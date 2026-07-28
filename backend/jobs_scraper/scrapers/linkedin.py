from __future__ import annotations

import re
from datetime import datetime, timedelta, timezone
from typing import Any, Optional

import structlog
from bs4 import BeautifulSoup

from config import RATE_LIMITS
from email_utils import extract_email
from scrapers.base import BaseScraper

logger = structlog.get_logger()


class LinkedInScraper(BaseScraper):
    def __init__(self):
        super().__init__("linkedin")
        self.rate = RATE_LIMITS["linkedin"]
        self._browser = None

    def _get_browser(self):
        if self._browser is not None:
            return self._browser
        try:
            from playwright.sync_api import sync_playwright
        except ImportError:
            logger.error("playwright_not_installed", platform=self.platform)
            return None
        p = sync_playwright().start()
        browser = p.chromium.launch(headless=True)
        self._playwright = p
        self._browser = browser
        return browser

    def scrape_all(self, keywords: list[str], locations: list[str]) -> list[dict[str, Any]]:
        from database import init_db, upsert_job
        init_db()
        browser = self._get_browser()
        if not browser:
            return []

        all_jobs = []
        try:
            for keyword in keywords:
                for location in locations:
                    jobs = self.scrape_keyword(keyword, location)
                    all_jobs.extend(jobs)
                    for j in jobs:
                        try:
                            upsert_job(j)
                        except Exception:
                            pass
                    logger.info("keyword_done", platform=self.platform, keyword=keyword, location=location, count=len(jobs))
        finally:
            self.close()
        return all_jobs

    def scrape_keyword(self, keyword: str, location: str) -> list[dict[str, Any]]:
        jobs: list[dict[str, Any]] = []
        browser = self._get_browser()
        if not browser:
            return []

        encoded_kw = keyword.replace(" ", "%20")
        encoded_loc = location.replace(" ", "%20")

        try:
            context = browser.new_context(
                user_agent=self._random_ua(),
                viewport={"width": 1920, "height": 1080},
                locale="en-IN",
                timezone_id="Asia/Kolkata",
            )
            page = context.new_page()
            page.add_init_script("Object.defineProperty(navigator, 'webdriver', {get: () => undefined})")

            url = f"https://www.linkedin.com/jobs/search/?keywords={encoded_kw}&location={encoded_loc}&f_TPR=r86400"
            try:
                page.goto(url, wait_until="commit", timeout=20000)
                page.wait_for_timeout(6000)
            except Exception as e:
                logger.warning("linkedin_nav_fail", url=url, platform=self.platform, error=str(e))
                context.close()
                return jobs

            current_url = page.url
            if "/checkpoint/" in current_url or "/authwall/" in current_url:
                logger.warning("linkedin_blocked", platform=self.platform, keyword=keyword, location=location)
                context.close()
                return jobs

            html = page.content()
            soup = BeautifulSoup(html, "html.parser")

            results_list = soup.select_one("ul.jobs-search__results-list")
            if not results_list:
                logger.info("linkedin_no_jobs", keyword=keyword, location=location, platform=self.platform)
                context.close()
                return jobs

            items = results_list.find_all("li", recursive=False)
            logger.info("linkedin_jobs_found", platform=self.platform, count=len(items))

            for item in items:
                try:
                    job = self._parse_item(item, keyword, location)
                    if job:
                        posted = job.get("posted_date")
                        if posted and (datetime.now(timezone.utc) - posted).days > 1:
                            continue
                        jobs.append(job)
                except Exception as e:
                    logger.error("linkedin_item_parse_error", platform=self.platform, error=str(e))
                    continue

            context.close()
        except Exception as e:
            logger.error("linkedin_scraper_crash", platform=self.platform, error=str(e))

        return jobs

    def _parse_item(self, item, keyword: str, location: str) -> Optional[dict]:
        card = item.select_one("div.job-search-card") or item

        entity_urn = card.get("data-entity-urn", "")
        job_id = entity_urn.split(":")[-1] if ":" in entity_urn else ""

        title_el = card.select_one(".base-search-card__title")
        title = title_el.get_text(strip=True) if title_el else keyword

        company_el = card.select_one(".base-search-card__subtitle .hidden-nested-link")
        company = company_el.get_text(strip=True) if company_el else ""

        loc_el = card.select_one(".job-search-card__location")
        loc = loc_el.get_text(strip=True) if loc_el else location

        link_el = card.select_one("a.base-card__full-link")
        app_url = link_el.get("href", "") if link_el else ""

        time_el = card.select_one("time.job-search-card__listdate--new, time.job-search-card__listdate")
        time_text = time_el.get_text(strip=True) if time_el else ""
        posted = self._parse_posted(time_text)

        # LinkedIn cards rarely have description, try anchor text
        desc_text = card.get_text(separator=" ", strip=True)
        email = extract_email(desc_text, company)

        return {
            "source": "linkedin",
            "job_id": job_id,
            "title": title,
            "company": company,
            "location": loc,
            "application_url": app_url,
            "posted_date": posted,
            "email": email,
        }

    def _parse_posted(self, text: str) -> Optional[datetime]:
        if not text:
            return None
        text = text.lower()
        now = datetime.now(timezone.utc)
        if "just now" in text or "moment" in text or "minute" in text:
            return now
        if "hour" in text:
            return now - timedelta(hours=1)
        if "day" in text:
            match = re.search(r"(\d+)", text)
            days = int(match.group(1)) if match else 1
            if days <= 1:
                return now
            return now - timedelta(days=days)
        if "week" in text:
            return None
        return None

    def close(self):
        if self._browser is not None:
            try:
                self._browser.close()
            except Exception:
                pass
            self._browser = None
        if hasattr(self, '_playwright') and self._playwright is not None:
            try:
                self._playwright.stop()
            except Exception:
                pass
            self._playwright = None
