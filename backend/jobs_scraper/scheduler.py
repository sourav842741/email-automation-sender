from __future__ import annotations

import signal
import time
from concurrent.futures import ThreadPoolExecutor, as_completed
from datetime import datetime, timedelta, timezone
from typing import Any, Optional

import structlog

from config import DEFAULT_PLATFORMS as CFG_PLATFORMS, MAX_AGE_DAYS, SCRAPE_INTERVAL_MINUTES
from database import close as close_db
from database import get_meta, init_db, load_scraper_config, upsert_job, upsert_meta
from dedup import Deduplicator
from email_enricher import enrich_jobs
from scrapers import SCRAPER_MAP

logger = structlog.get_logger()

_running = True


def _handle_signal(signum, frame) -> None:
    global _running
    logger.info("shutdown_signal_received", signal=signum)
    _running = False


signal.signal(signal.SIGTERM, _handle_signal)
signal.signal(signal.SIGINT, _handle_signal)


MAX_AGE_DAYS_UTC = timedelta(days=MAX_AGE_DAYS)


def _process_platform(name: str, kw_list: list[str], loc_list: list[str]) -> tuple[str, list[dict]]:
    if name not in SCRAPER_MAP:
        logger.warning("unknown_platform", platform=name)
        return name, []

    meta = get_meta(name)
    if meta and meta.get("skip_until"):
        skip_until = meta["skip_until"]
        if isinstance(skip_until, str):
            skip_until = datetime.fromisoformat(skip_until)
        if skip_until.replace(tzinfo=timezone.utc) > datetime.now(timezone.utc):
            logger.info("platform_skipped", platform=name, skip_until=skip_until)
            return name, []

    scraper = SCRAPER_MAP[name]()
    try:
        jobs = scraper.scrape_all(kw_list, loc_list)
        logger.info("platform_scrape_complete", platform=name, raw_count=len(jobs))
        return name, jobs
    except Exception as e:
        logger.error("platform_crash", platform=name, error=str(e))
        return name, None
    finally:
        scraper.close()


def _filter_recent(jobs: list[dict]) -> list[dict]:
    if not jobs:
        return []
    now = datetime.now(timezone.utc)
    cutoff = now - MAX_AGE_DAYS_UTC
    filtered = []
    for j in jobs:
        pd = j.get("posted_date")
        if pd and pd.tzinfo is None:
            pd = pd.replace(tzinfo=timezone.utc)
        if pd and pd < cutoff:
            continue
        filtered.append(j)
    return filtered


_db_interval_minutes: Optional[int] = None


def run_cycle(platforms: Optional[list[str]] = None, keywords: Optional[list[str]] = None, locations: Optional[list[str]] = None) -> dict:
    from config import SEARCH_KEYWORDS, SEARCH_LOCATIONS

    init_db()
    db_cfg = load_scraper_config()
    if not keywords:
        keywords = db_cfg.get("keywords") or SEARCH_KEYWORDS
    if not locations:
        locations = db_cfg.get("locations") or SEARCH_LOCATIONS
    if not platforms:
        platforms = db_cfg.get("platforms") or CFG_PLATFORMS
    global _db_interval_minutes, MAX_AGE_DAYS_UTC
    db_max_days = db_cfg.get("maxAgeDays")
    if db_max_days:
        MAX_AGE_DAYS_UTC = timedelta(days=db_max_days)
    _db_interval_minutes = db_cfg.get("intervalMinutes")

    kw_list = keywords
    loc_list = locations
    platform_names = platforms
    results: dict[str, int] = {}

    scraped: dict[str, Any] = {}
    with ThreadPoolExecutor(max_workers=len(platform_names)) as ex:
        futs = {ex.submit(_process_platform, n, kw_list, loc_list): n for n in platform_names}
        for fut in as_completed(futs):
            name, jobs = fut.result()
            scraped[name] = jobs

    for name in platform_names:
        jobs = scraped.get(name)
        if jobs is None:
            meta = get_meta(name)
            failures = (meta.get("consecutive_failures", 0) if meta else 0) + 1
            if failures >= 5:
                skip_until = datetime.now(timezone.utc) + timedelta(hours=2)
                logger.warning("platform_skipping_2h", platform=name, skip_until=skip_until.isoformat())
                upsert_meta(name, consecutive_failures=failures, skip_until=skip_until.isoformat())
            else:
                upsert_meta(name, consecutive_failures=failures)
            results[name] = -1
            continue
        if isinstance(jobs, list) and len(jobs) == 0:
            meta = get_meta(name)
            consecutive_empty = (meta.get("consecutive_empty", 0) if meta else 0) + 1
            upsert_meta(name, last_run_at=datetime.now(timezone.utc), consecutive_empty=consecutive_empty)
            results[name] = 0
            continue

        meta = get_meta(name)
        upsert_meta(name, last_run_at=datetime.now(timezone.utc), consecutive_empty=0, consecutive_failures=0, skip_until=None)

        recent = _filter_recent(jobs)
        logger.info("platform_age_filter", platform=name, total=len(jobs), recent=len(recent), max_days=MAX_AGE_DAYS)

        dedup = Deduplicator()
        new_count = 0
        dup_count = 0

        for job in recent:
            try:
                if dedup.is_duplicate(job):
                    dup_count += 1
                    continue
                upsert_job(job)
                new_count += 1
            except Exception as e:
                logger.error("job_upsert_error", platform=name, error=str(e))

        results[name] = new_count
        logger.info("platform_results", platform=name, new=new_count, duplicates=dup_count, filtered_out=len(jobs) - len(recent))

    try:
        enriched = enrich_jobs(scraped)
        if enriched:
            logger.info("email_enrichment_done", count=enriched)
    except Exception as e:
        logger.error("email_enrichment_failed", error=str(e))

    return results


def run_forever(platforms: Optional[list[str]] = None) -> None:
    run_count = 0
    while _running:
        run_count += 1
        start = datetime.now(timezone.utc)
        logger.info("cycle_start", run=run_count, time=start.isoformat())

        try:
            results = run_cycle(platforms=platforms)
            elapsed = (datetime.now(timezone.utc) - start).total_seconds()
            logger.info("cycle_end", run=run_count, results=results, elapsed_seconds=round(elapsed, 1))
        except Exception as e:
            elapsed = (datetime.now(timezone.utc) - start).total_seconds()
            logger.error("cycle_crash", run=run_count, error=str(e), elapsed_seconds=round(elapsed, 1))

        if not _running:
            break

        sleep_minutes = _db_interval_minutes or SCRAPE_INTERVAL_MINUTES
        logger.info("sleeping", minutes=sleep_minutes)
        for _ in range(sleep_minutes * 60):
            if not _running:
                break
            time.sleep(1)

    close_db()
