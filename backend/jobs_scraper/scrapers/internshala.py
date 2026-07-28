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


class InternshalaScraper(BaseScraper):
    BASE_URL = "https://internshala.com"

    def __init__(self):
        super().__init__("internshala")
        self.rate = RATE_LIMITS["internshala"]

    def scrape_keyword(self, keyword: str, location: str) -> list[dict[str, Any]]:
        jobs: list[dict[str, Any]] = []
        encoded_kw = keyword.replace(" ", "-")

        for page_num in range(1, 11):
            url = f"{self.BASE_URL}/jobs/{encoded_kw}-jobs/page-{page_num}/"
            if page_num == 1:
                url = f"{self.BASE_URL}/jobs/{encoded_kw}-jobs/"

            resp = self._get_with_retry(url, headers=self._headers())
            if not resp:
                break

            soup = BeautifulSoup(resp.text, "html.parser")
            cards = soup.select(".individual_internship")
            if not cards:
                logger.info("internshala_no_cards", platform=self.platform, keyword=keyword, page=page_num)
                if page_num > 1:
                    break
                continue

            for card in cards:
                try:
                    job = self._parse_card(card, keyword, location)
                    if job:
                        jobs.append(job)
                except Exception as e:
                    logger.error("internshala_card_parse_error", platform=self.platform, error=str(e))
                    continue

            self._rate_limit(self.rate["delay"])

        return jobs

    def _parse_card(self, card, keyword: str, location: str) -> Optional[dict]:
        title_el = card.select_one(".job-title-href")
        title = title_el.get_text(strip=True) if title_el else ""

        company_el = card.select_one(".company-name")
        company = company_el.get_text(strip=True) if company_el else ""

        loc_el = card.select_one(".locations span, .locations a")
        loc = loc_el.get_text(strip=True) if loc_el else location

        stipend_el = card.select_one("[class*=money] + span, [class*=money] ~ span")
        if not stipend_el:
            stipend_el = card.select_one(".desktop, .mobile")
        stipend_text = stipend_el.get_text(strip=True) if stipend_el else ""

        skills_els = card.select(".job_skill")
        skills = ", ".join([s.get_text(strip=True) for s in skills_els]) if skills_els else ""

        posted_el = card.select_one("[class*='status'], [class*='posted'], [class*='days'], .status, .time")
        posted_text = posted_el.get_text(strip=True) if posted_el else ""
        posted = self._parse_posted(posted_text)

        link_el = card.select_one("a.job-title-href")
        job_url = ""
        if link_el:
            href = link_el.get("href", "")
            job_url = f"{self.BASE_URL}{href}" if href.startswith("/") else href

        job_id_match = re.search(r'/jobs/([^/]+)', job_url)
        job_id = job_id_match.group(1) if job_id_match else ""

        employment_type = "Internship"
        classes = card.get("class", []) or []
        if "individual_internship_job" in classes or card.get("employment_type") == "job":
            employment_type = "Full-time"

        description_el = card.select_one(".about_job .text, .about_job_text")
        description = description_el.get_text(strip=True) if description_el else ""
        email = extract_email(description, company)

        return {
            "source": "internshala",
            "job_id": job_id,
            "title": title,
            "company": company,
            "location": loc,
            "salary_text": stipend_text,
            "skills": skills,
            "description": description,
            "email": email,
            "posted_date": posted,
            "application_url": job_url,
            "employment_type": employment_type,
        }

    def _parse_posted(self, text: str) -> Optional[datetime]:
        if not text:
            return None
        text = text.lower()
        now = datetime.now(timezone.utc)
        if "today" in text or "just now" in text:
            return now
        if "yesterday" in text:
            return now - timedelta(days=1)
        if "day" in text:
            match = re.search(r'(\d+)', text)
            days = int(match.group(1)) if match else 1
            return now - timedelta(days=days)
        if "hour" in text or "min" in text:
            return now
        if "week" in text:
            match = re.search(r'(\d+)', text)
            weeks = int(match.group(1)) if match else 1
            return now - timedelta(weeks=weeks)
        if "month" in text:
            match = re.search(r'(\d+)', text)
            months = int(match.group(1)) if match else 1
            return now - timedelta(days=months * 30)
        return None
