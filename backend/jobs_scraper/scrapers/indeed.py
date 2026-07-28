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


class IndeedScraper(BaseScraper):
    BASE_URL = "https://in.indeed.com"

    def __init__(self):
        super().__init__("indeed")
        self.rate = RATE_LIMITS["indeed"]

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
                    locale="en-IN",
                )
                page = context.new_page()
                page.goto(url, wait_until="commit", timeout=25000)
                page.wait_for_timeout(5000)
                html = page.content()
                browser.close()
                return html
        except Exception as e:
            logger.error("indeed_playwright_fail", platform=self.platform, error=str(e))
            return None

    def scrape_keyword(self, keyword: str, location: str) -> list[dict[str, Any]]:
        jobs: list[dict[str, Any]] = []
        encoded_kw = keyword.replace(" ", "+")
        encoded_loc = location.replace(" ", "+")

        for page_num in range(3):
            url = f"{self.BASE_URL}/jobs?q={encoded_kw}&l={encoded_loc}&fromage=1&start={page_num * 10}"
            html = self._fetch_page(url)
            if not html:
                break

            page_jobs, _ = self._parse_page(html, keyword, location)
            jobs.extend(page_jobs)

            if len(page_jobs) < 10:
                break

            self._rate_limit(self.rate["delay"])

        return jobs

    def _parse_page(self, html: str, keyword: str, location: str) -> tuple[list[dict], int]:
        soup = BeautifulSoup(html, "html.parser")
        cards = soup.select(".cardOutline.tapItem")
        if not cards:
            return [], 0

        total_text = soup.select_one("[class*=searchCount], [class*=jobcount], #searchCount")
        total = 0
        if total_text:
            nums = re.findall(r'(\d[\d,]*)', total_text.get_text())
            if nums:
                total = int(nums[-1].replace(",", ""))

        jobs = []
        for card in cards:
            try:
                job = self._parse_card(card, keyword, location)
                if job:
                    jobs.append(job)
            except Exception as e:
                logger.error("indeed_card_parse_error", platform=self.platform, error=str(e))
                continue

        return jobs, max(total, len(jobs))

    def _parse_card(self, card, keyword: str, location: str) -> Optional[dict]:
        jk_el = card.select_one("a[data-jk]")
        jk = jk_el.get("data-jk", "") if jk_el else ""

        title_el = card.select_one("h2 a span, h2 span, .jobTitle span")
        title = title_el.get_text(strip=True) if title_el else keyword

        company_el = card.select_one("[data-testid='company-name'], .companyName")
        company = company_el.get_text(strip=True) if company_el else ""

        loc_el = card.select_one("[data-testid='text-location'], .companyLocation")
        loc = loc_el.get_text(strip=True) if loc_el else location

        salary_el = card.select_one("[data-testid='text-salary'], .salary-snippet, .estimated-salary, [class*=salary]")
        salary_text = salary_el.get_text(strip=True) if salary_el else ""
        salary_min, salary_max = self._parse_salary(salary_text) if salary_text else (None, None)

        desc_el = card.select_one(".job-snippet, [data-testid='job-snippet']")
        description = desc_el.get_text(strip=True) if desc_el else ""
        email = extract_email(description, company)

        return {
            "source": "indeed",
            "job_id": str(jk),
            "title": title,
            "company": company,
            "location": loc,
            "salary_min": salary_min,
            "salary_max": salary_max,
            "salary_currency": "INR" if salary_min or salary_max else None,
            "description": description,
            "email": email,
            "application_url": f"{self.BASE_URL}/viewjob?jk={jk}" if jk else "",
            "posted_date": datetime.now(timezone.utc),
            "employment_type": "Full-time",
        }

    def _parse_salary(self, text: str) -> tuple[Optional[float], Optional[float]]:
        if not text or "Not disclosed" in text.lower():
            return None, None
        text = text.replace(",", "").replace("₹", "").replace("Rs", "").strip()
        nums = re.findall(r'([\d.]+)', text)
        vals = []
        for n in nums:
            try:
                vals.append(float(n))
            except ValueError:
                continue
        monthly = "month" in text.lower() or "mo" in text.lower()
        yearly = "year" in text.lower() or "yr" in text.lower() or "annual" in text.lower()
        if len(vals) >= 2:
            mn, mx = min(vals), max(vals)
            if monthly:
                mn, mx = mn * 12 / 100000, mx * 12 / 100000
            elif not yearly:
                mn, mx = mn / 100000, mx / 100000
            else:
                mn, mx = mn / 100000, mx / 100000
            return round(mn, 2), round(mx, 2)
        if len(vals) == 1:
            v = vals[0]
            if monthly:
                v = v * 12 / 100000
            elif not yearly:
                v = v / 100000
            else:
                v = v / 100000
            return round(v, 2), None
        return None, None
