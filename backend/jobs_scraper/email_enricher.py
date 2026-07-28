from __future__ import annotations

import random
import time
from concurrent.futures import ThreadPoolExecutor, as_completed
from typing import Any, Optional

import httpx
import structlog
from bs4 import BeautifulSoup

from config import RATE_LIMITS, USER_AGENTS
from database import get_jobs_collection
from email_utils import extract_email

logger = structlog.get_logger()

MAX_ENRICH_PER_CYCLE = 10
CONCURRENT_WORKERS = 3
PAGE_TIMEOUT = 15


def _needs_enrich(job: dict) -> bool:
    if job.get("email"):
        return False
    url = job.get("application_url") or job.get("url") or ""
    return bool(url)


def _fetch_with_playwright(url: str, ua: str) -> Optional[str]:
    try:
        from playwright.sync_api import sync_playwright
    except ImportError:
        logger.error("playwright_not_installed")
        return None
    try:
        with sync_playwright() as pw:
            browser = pw.chromium.launch(headless=True)
            context = browser.new_context(
                user_agent=ua,
                viewport={"width": 1280, "height": 800},
                locale="en-IN",
                timezone_id="Asia/Kolkata",
            )
            page = context.new_page()
            page.add_init_script("Object.defineProperty(navigator, 'webdriver', {get: () => undefined})")
            page.goto(url, wait_until="commit", timeout=PAGE_TIMEOUT * 1000)
            page.wait_for_timeout(4000)
            html = page.content()
            browser.close()
            return html
    except Exception as e:
        logger.warning("enrich_playwright_fail", url=url[:80], error=str(e))
        return None


def _fetch_with_httpx(url: str, ua: str) -> Optional[str]:
    try:
        with httpx.Client(timeout=PAGE_TIMEOUT, follow_redirects=True) as client:
            resp = client.get(url, headers={
                "User-Agent": ua,
                "Accept": "text/html,*/*",
                "Accept-Language": "en-US,en;q=0.5",
            })
            resp.raise_for_status()
            return resp.text
    except Exception as e:
        logger.warning("enrich_httpx_fail", url=url[:80], error=str(e))
        return None


def _extract_from_html(html: str, company: str) -> Optional[str]:
    soup = BeautifulSoup(html, "html.parser")
    text = soup.get_text(separator=" ", strip=True)
    return extract_email(text, company)


def _enrich_one(job: dict, ua: str) -> Optional[str]:
    url = job.get("application_url") or job.get("url") or ""
    source = job.get("source", "")
    company = job.get("company", "")

    if not url:
        return None

    logger.info("enrich_fetching", source=source, url=url[:80])

    if source in ("internshala",):
        html = _fetch_with_httpx(url, ua)
    else:
        html = _fetch_with_playwright(url, ua)

    if not html:
        return None

    email = _extract_from_html(html, company)
    if email:
        logger.info("enrich_found_email", source=source, email=email, url=url[:80])
    else:
        logger.info("enrich_no_email", source=source, url=url[:80])

    time.sleep(random.uniform(1.0, 2.5))
    return email


def _random_ua() -> str:
    return random.choice(USER_AGENTS)


def enrich_jobs(platform_jobs: dict[str, list[dict]]) -> int:
    ua = _random_ua()

    candidates = []
    for _platform, jobs in platform_jobs.items():
        for j in jobs:
            if _needs_enrich(j):
                candidates.append(j)
                if len(candidates) >= MAX_ENRICH_PER_CYCLE:
                    break
        if len(candidates) >= MAX_ENRICH_PER_CYCLE:
            break

    if not candidates:
        logger.info("enrich_no_candidates")
        return 0

    logger.info("enrich_starting", count=len(candidates))
    col = get_jobs_collection()
    found_count = 0

    with ThreadPoolExecutor(max_workers=CONCURRENT_WORKERS) as ex:
        fut_map = {ex.submit(_enrich_one, j, ua): j for j in candidates}
        for fut in as_completed(fut_map):
            job = fut_map[fut]
            try:
                email = fut.result()
                if email:
                    found_count += 1
                    source = job.get("source", "")
                    job_id = job.get("job_id", "")
                    if job_id:
                        col.update_one(
                            {"source": source, "job_id": job_id},
                            {"$set": {"email": email}},
                        )
                    else:
                        col.update_one(
                            {"_id": job.get("_id")},
                            {"$set": {"email": email}},
                        )
            except Exception as e:
                logger.error("enrich_job_error", error=str(e))

    logger.info("enrich_done", found=found_count, total=len(candidates))
    return found_count
