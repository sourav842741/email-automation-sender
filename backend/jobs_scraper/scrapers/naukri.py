from __future__ import annotations

import math
import re
import time
from datetime import datetime, timedelta, timezone
from typing import Any, Optional

import structlog

from config import RATE_LIMITS
from scrapers.base import BaseScraper

logger = structlog.get_logger()


class NaukriScraper(BaseScraper):
    BASE_URL = "https://www.naukri.com"

    def __init__(self):
        super().__init__("naukri")
        self.rate = RATE_LIMITS["naukri"]

    def scrape_keyword(self, keyword: str, location: str) -> list[dict[str, Any]]:
        jobs: list[dict[str, Any]] = []
        encoded_kw = keyword.replace(" ", "-")
        encoded_loc = location.replace(" ", "-")

        first_url = f"{self.BASE_URL}/{encoded_kw}-jobs-in-{encoded_loc}"
        first_resp = self._get_with_retry(first_url, headers=self._headers())
        if not first_resp:
            return jobs

        api_url, total = self._extract_api_info(first_resp.text)
        if not api_url:
            return jobs

        page_size = 20
        total_pages = min(math.ceil(total / page_size), 20)

        for page_no in range(1, total_pages + 1):
            paginated_url = api_url.replace("pageNo=1", f"pageNo={page_no}")
            if "pageNo=" not in paginated_url:
                sep = "&" if "?" in paginated_url else "?"
                paginated_url = f"{paginated_url}{sep}pageNo={page_no}"

            resp = self._get_with_retry(paginated_url, headers=self._headers(
                Accept="application/json",
                Referer=first_url,
            ))
            if not resp:
                continue

            try:
                data = resp.json()
                job_list = data.get("jobDetails", [])
                for item in job_list:
                    job = self._parse_job(item, keyword, location)
                    if job and self._is_recent(job["posted_date"]):
                        jobs.append(job)
            except Exception as e:
                logger.error("naukri_parse_error", platform=self.platform, page=page_no, error=str(e))

            self._rate_limit(self.rate["delay"])
            time.sleep(1)

        return jobs

    def _extract_api_info(self, html: str) -> tuple[Optional[str], int]:
        match = re.search(r'"searchUrl"\s*:\s*"([^"]+)"', html)
        if not match:
            return None, 0
        api_url = match.group(1).replace("\\/", "/")
        total_match = re.search(r'"totalResults"\s*:\s*(\d+)', html)
        total = int(total_match.group(1)) if total_match else 0
        return api_url, total

    def _parse_job(self, item: dict, keyword: str, location: str) -> Optional[dict]:
        try:
            job_id = str(item.get("id", ""))
            title = item.get("title", item.get("jobTitle", "")).strip()
            company = item.get("companyName", item.get("company", "")).strip()
            loc = item.get("location", item.get("place", location)).strip()

            salary_text = item.get("salary", "")
            salary_min, salary_max = self._parse_salary(salary_text)

            skills_raw = item.get("skills", item.get("tags", []))
            if isinstance(skills_raw, list):
                skills = ", ".join(skills_raw)
            else:
                skills = str(skills_raw) if skills_raw else ""

            exp_text = item.get("experience", "")
            exp_min, exp_max = self._parse_experience(exp_text)

            posted_raw = item.get("postedDate", item.get("createdDate", ""))
            posted = self._parse_date(posted_raw)

            job_url = item.get("url", item.get("jobURL", ""))
            if job_url and not job_url.startswith("http"):
                job_url = f"{self.BASE_URL}{job_url}"

            description = item.get("description", item.get("jobDescription", ""))

            return {
                "source": "naukri",
                "job_id": job_id,
                "title": title,
                "company": company,
                "location": loc,
                "salary_min": salary_min,
                "salary_max": salary_max,
                "salary_currency": "INR" if salary_min or salary_max else None,
                "skills": skills,
                "experience_min": exp_min,
                "experience_max": exp_max,
                "posted_date": posted,
                "application_url": job_url,
                "description": description,
                "employment_type": "Full-time",
            }
        except Exception as e:
            logger.error("naukri_job_parse_error", platform=self.platform, error=str(e))
            return None

    def _parse_salary(self, text: str) -> tuple[Optional[float], Optional[float]]:
        if not text or "Not Disclosed" in text:
            return None, None
        nums = re.findall(r'([\d.]+)\s*(L|lac|lakh|K|k|M|m)?', text)
        if not nums:
            return None, None
        vals = []
        for num, unit in nums:
            val = float(num)
            if unit.lower() in ("l", "lac", "lakh"):
                val = val
            elif unit.lower() == "k":
                val = val / 100
            elif unit.lower() == "m":
                val = val * 10
            vals.append(val)
        if len(vals) >= 2:
            return min(vals), max(vals)
        return vals[0] if vals else None, None

    def _parse_experience(self, text: str) -> tuple[Optional[int], Optional[int]]:
        if not text:
            return None, None
        nums = re.findall(r'(\d+)', text)
        if len(nums) >= 2:
            return int(nums[0]), int(nums[1])
        if len(nums) == 1:
            return int(nums[0]), int(nums[0])
        return None, None

    def _parse_date(self, text: str) -> Optional[datetime]:
        if not text:
            return None
        text = text.lower()
        now = datetime.now(timezone.utc)
        if "day" in text or "days" in text:
            match = re.search(r'(\d+)', text)
            days = int(match.group(1)) if match else 1
            return now - timedelta(days=days)
        if "hour" in text or "hr" in text:
            return now
        if "week" in text:
            match = re.search(r'(\d+)', text)
            weeks = int(match.group(1)) if match else 1
            return now - timedelta(weeks=weeks)
        from dateutil import parser as dateparser
        try:
            return dateparser.parse(text)
        except Exception:
            return None

    def _is_recent(self, posted: Optional[datetime]) -> bool:
        if posted is None:
            return True
        return (datetime.now(timezone.utc) - posted).days <= 1
