import os
from datetime import datetime, timedelta, timezone
from typing import Any, Optional

import certifi
import structlog
from pymongo import ASCENDING, MongoClient
from pymongo.collection import Collection
from pymongo.database import Database as MongoDatabase
from pymongo.errors import DuplicateKeyError

from config import MONGODB_URI, DB_NAME

logger = structlog.get_logger()

_client: Optional[MongoClient] = None
_indexes_created = False
JOB_TTL_DAYS = 4


def get_client() -> MongoClient:
    global _client
    if _client is None:
        _client = MongoClient(MONGODB_URI, tlsCAFile=certifi.where())
    return _client


def get_db() -> MongoDatabase:
    return get_client()[DB_NAME]


def get_jobs_collection() -> Collection:
    global _indexes_created
    db = get_db()
    col = db["jobs"]
    if not _indexes_created:
        try:
            col.create_index([("source", ASCENDING), ("job_id", ASCENDING)], unique=True, partialFilterExpression={"job_id": {"$gt": ""}})
        except Exception:
            col.create_index([("source", ASCENDING), ("job_id", ASCENDING)], unique=True)
        col.create_index([("posted_date", ASCENDING)])
        try:
            col.drop_index("scraped_at_1")
        except Exception:
            pass
        try:
            col.create_index([("scraped_at", ASCENDING)], expireAfterSeconds=JOB_TTL_DAYS * 86400)
        except Exception as e:
            logger.warning("ttl_index_error", error=str(e))
            col.create_index([("scraped_at", ASCENDING)])
        col.create_index([("source", ASCENDING)])
        _indexes_created = True
    return col


def get_meta_collection() -> Collection:
    return get_db()["scrape_meta"]


def init_db() -> None:
    col = get_jobs_collection()
    col.delete_many({"scraped_at": {"$lt": datetime.now(timezone.utc) - timedelta(days=JOB_TTL_DAYS)}})
    get_meta_collection()
    logger.info("mongodb_connected", db_name=DB_NAME)


def upsert_job(job_dict: dict) -> bool:
    col = get_jobs_collection()
    source = job_dict.get("source", "")
    job_id = job_dict.get("job_id", "")
    job_dict["scraped_at"] = datetime.now(timezone.utc)
    job_dict["created_at"] = job_dict.get("created_at", datetime.now(timezone.utc))

    try:
        if job_id:
            result = col.update_one(
                {"source": source, "job_id": job_id},
                {"$set": job_dict},
                upsert=True,
            )
            return result.upserted_id is not None or result.modified_count > 0
        else:
            existing = col.find_one({
                "source": source,
                "company": job_dict.get("company", ""),
                "title": job_dict.get("title", ""),
                "location": job_dict.get("location", ""),
            })
            if existing:
                col.update_one({"_id": existing["_id"]}, {"$set": job_dict})
                return True
            col.insert_one(job_dict)
            return True
    except DuplicateKeyError:
        col.update_one(
            {"source": source, "job_id": job_id},
            {"$set": job_dict},
        )
        return True
    except Exception as e:
        logger.error("mongodb_upsert_error", error=str(e))
        raise


def get_recent_jobs(minutes: int = 30) -> list[dict]:
    col = get_jobs_collection()
    from datetime import timedelta
    cutoff = datetime.now(timezone.utc) - timedelta(minutes=minutes)
    return list(col.find({"scraped_at": {"$gte": cutoff}}).sort("posted_date", -1).limit(100))


def get_platform_stats() -> list[dict]:
    col = get_jobs_collection()
    pipeline = [{"$group": {"_id": "$source", "count": {"$sum": 1}}}, {"$sort": {"count": -1}}]
    return [{"platform": r["_id"], "count": r["count"]} for r in col.aggregate(pipeline)]


def get_meta(platform: str) -> Optional[dict]:
    col = get_meta_collection()
    return col.find_one({"platform": platform})


def upsert_meta(platform: str, **kwargs: Any) -> None:
    col = get_meta_collection()
    col.update_one(
        {"platform": platform},
        {"$set": {**kwargs, "updated_at": datetime.now(timezone.utc)}},
        upsert=True,
    )


def close() -> None:
    global _client
    if _client:
        _client.close()
        _client = None
