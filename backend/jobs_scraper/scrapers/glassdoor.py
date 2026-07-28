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


class GlassdoorScraper(BaseScraper):
    BASE_URL = "https://www.glassdoor.co.in"

    def __init__(self):
        super().__init__("glassdoor")
        self.rate = RATE_LIMITS["glassdoor"]

    def _fetch_page(self, url: str) -> Optional[str]:
        try:
            from playwright.sync_api import sync_playwright
        except ImportError:
            logger.error("playwright_not_installed", platform=self.platform)
            return None
        try:
            with sync_playwright() as pw:
                browser = pw.chromium.launch(headless=True)
                context = browser.new_context(
                    user_agent=self._random_ua(),
                    viewport={"width": 1920, "height": 1080},
                )
                page = context.new_page()
                page.goto(url, wait_until="commit", timeout=15000)
                page.wait_for_timeout(8000)
                html = page.content()
                browser.close()
                return html
        except Exception as e:
            logger.error("glassdoor_playwright_fail", platform=self.platform, error=str(e))
            return None

    def scrape_keyword(self, keyword: str, location: str) -> list[dict[str, Any]]:
        jobs: list[dict[str, Any]] = []
        encoded_kw = keyword.replace(" ", "+")

        for page_num in range(3):
            url = f"{self.BASE_URL}/Job/jobs.htm?sc.keyword={encoded_kw}&locT=C&locQ={location}&p={page_num}"
            html = self._fetch_page(url)
            if not html:
                break

            page_jobs = self._parse_page(html, keyword, location)
            jobs.extend(page_jobs)

            if len(page_jobs) < 30:
                break

            self._rate_limit(self.rate["delay"])

        return jobs

    def _parse_page(self, html: str, keyword: str, location: str) -> list[dict]:
        soup = BeautifulSoup(html, "html.parser")
        cards = soup.select("[data-test='job-card-wrapper']")
        if not cards:
            return []

        jobs = []
        for card in cards:
            try:
                job = self._parse_card(card, keyword, location)
                if job:
                    jobs.append(job)
            except Exception as e:
                logger.error("glassdoor_card_parse_error", platform=self.platform, error=str(e))
                continue

        return jobs

    def _parse_card(self, card, keyword: str, location: str) -> Optional[dict]:
        title_el = card.select_one("a[data-test='job-title']")
        title = title_el.get_text(strip=True) if title_el else ""

        job_url = ""
        job_id = ""
        if title_el and title_el.has_attr("href"):
            job_url = title_el["href"]
            m = re.search(r'jl=(\d+)', job_url)
            if m:
                job_id = m.group(1)

        company_el = card.select_one("[class*='EmployerProfile_compactEmployerName'], [class*='employerName']")
        company = ""
        if company_el:
            raw = company_el.get_text(strip=True)
            company = re.sub(r'\d+\.?\d*$', '', raw).strip()

        loc_el = card.select_one("[data-test='emp-location']")
        loc = loc_el.get_text(strip=True) if loc_el else location

        salary_el = card.select_one("[data-test='detailSalary']")
        salary_text = salary_el.get_text(strip=True) if salary_el else ""
        if not salary_text:
            salary_text = self._extract_salary_from_card(card)
        salary_min, salary_max = self._parse_salary(salary_text) if salary_text else (None, None)

        age_el = card.select_one("[data-test='job-age']")
        posted_date = self._parse_age(age_el.get_text(strip=True) if age_el else "")

        desc_el = card.select_one("[class*='JobCard_jobDescription']")
        description = desc_el.get_text(strip=True) if desc_el else ""
        email = extract_email(description, company)

        return {
            "source": "glassdoor",
            "job_id": job_id,
            "title": title,
            "company": company,
            "location": loc,
            "salary_min": salary_min,
            "salary_max": salary_max,
            "salary_currency": "INR" if salary_min or salary_max else None,
            "description": description,
            "email": email,
            "application_url": job_url,
            "posted_date": posted_date,
            "employment_type": "Full-time",
        }

    def _extract_salary_from_card(self, card) -> str:
        text = card.get_text()
        m = re.search(r'([₹Rs]?[\d,.\s]+L\s*[-–to]+\s*[₹Rs]?[\d,.\s]+L)', text, re.I)
        if m:
            return m.group(1).strip()
        m = re.search(r'([₹Rs][\d,.\s]+(?:per\s*hour|hour|year|month|yr|mo|annual|LPA|lpa))', text)
        if m:
            return m.group(1).strip()
        m = re.search(r'(₹[\d,.\s]+[-–to]{1,3}[\d,.\s]+)', text)
        if m:
            return m.group(1).strip()
        m = re.search(r'(\d[\d,.\s]*L)', text)
        if m:
            return m.group(1).strip()
        return ""

    def _parse_salary(self, text: str) -> tuple[Optional[float], Optional[float]]:
        if not text:
            return None, None
        text = text.replace(",", "").replace("₹", "").replace("Rs", "").replace("LPA", "").strip()
        in_lakhs = bool(re.search(r'(?:^|\s|[\d.])L(?:$|\s|[^\w])', text, re.I)) or "lakh" in text.lower()
        per_hour = "hour" in text.lower()
        monthly = "month" in text.lower() or " mo" in text.lower()
        yearly = "year" in text.lower() or " yr" in text.lower() or "annual" in text.lower()

        text_clean = re.sub(r'L(?:PA)?\b', '', text, flags=re.I).strip()
        nums = re.findall(r'([\d.]+)', text_clean)
        vals = []
        for n in nums:
            try:
                vals.append(float(n))
            except ValueError:
                continue
        if len(vals) < 1:
            return None, None

        def to_lpa(v: float) -> float:
            if in_lakhs:
                return round(v, 2)
            if per_hour:
                return round(v * 40 * 52 / 100000, 2)
            if monthly:
                return round(v * 12 / 100000, 2)
            if yearly or v > 1000:
                return round(v / 100000, 2)
            return round(v, 2)

        if len(vals) >= 2:
            mn, mx = min(vals), max(vals)
            return to_lpa(mn), to_lpa(mx)
        return to_lpa(vals[0]), None

    def _parse_age(self, text: str) -> datetime:
        now = datetime.now(timezone.utc)
        if not text or text == "30d+":
            return now - timedelta(days=30)
        m = re.search(r'(\d+)\s*([dhms])', text)
        if m:
            num = int(m.group(1))
            unit = m.group(2)
            if unit == "d":
                return now - timedelta(days=num)
            if unit == "h":
                return now - timedelta(hours=num)
            if unit == "m":
                return now - timedelta(minutes=num)
            if unit == "s":
                return now - timedelta(seconds=num)
        days = re.search(r'(\d+)\s*days?', text)
        if days:
            return now - timedelta(days=int(days.group(1)))
        return now - timedelta(days=7)
