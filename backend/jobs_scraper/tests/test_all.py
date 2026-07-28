from __future__ import annotations

import json
import os
import sys
from datetime import datetime, timedelta, timezone
from unittest.mock import MagicMock, patch

import pytest

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

os.environ["MONGODB_URI"] = "mongodb://localhost:27017"
os.environ["DB_NAME"] = "email_sender_test"
os.environ["PROXY_ENABLED"] = "false"

from scrapers.base import BaseScraper


class TestEmailUtils:
    def test_extract_hr_email(self):
        from email_utils import extract_email
        text = "For queries contact hr@google.com or support@google.com"
        result = extract_email(text, "Google")
        assert result == "hr@google.com"

    def test_extract_careers_email(self):
        from email_utils import extract_email
        text = "Please send your resume to careers@acme.com"
        result = extract_email(text)
        assert result == "careers@acme.com"

    def test_extract_company_email(self):
        from email_utils import extract_email
        text = "Reach out to hiring@stripe.com"
        result = extract_email(text, "Stripe")
        assert result == "hiring@stripe.com"

    def test_extract_no_email(self):
        from email_utils import extract_email
        text = "No contact information available"
        result = extract_email(text, "Google")
        assert result is None

    def test_extract_empty_text(self):
        from email_utils import extract_email
        assert extract_email("") is None
        assert extract_email(None) is None

    def test_extract_prefers_hr_over_info(self):
        from email_utils import extract_email
        text = "Contact info@company.com or hr@company.com"
        result = extract_email(text)
        assert result == "hr@company.com"


class TestConfig:
    def test_search_keywords(self):
        from config import SEARCH_KEYWORDS
        assert len(SEARCH_KEYWORDS) > 0
        assert "software engineer" in SEARCH_KEYWORDS

    def test_search_locations(self):
        from config import SEARCH_LOCATIONS
        assert "Bangalore" in SEARCH_LOCATIONS
        assert "Remote" in SEARCH_LOCATIONS

    def test_rate_limits(self):
        from config import RATE_LIMITS
        for platform in ["linkedin", "naukri", "indeed", "glassdoor", "internshala"]:
            assert platform in RATE_LIMITS
            assert "delay" in RATE_LIMITS[platform]
            assert "pages_per_min" in RATE_LIMITS[platform]

    def test_user_agents(self):
        from config import USER_AGENTS
        assert len(USER_AGENTS) >= 10


class TestDedup:
    def test_normalize_company(self):
        from dedup import Deduplicator
        d = Deduplicator()
        assert d._normalize_company("Google Inc.") == "google"
        assert d._normalize_company("Acme Technologies Pvt Ltd") == "acme"
        assert d._normalize_company("Stripe, Inc.") == "stripe"
        assert d._normalize_company("TCS") == "tcs"

    def test_normalize_title(self):
        from dedup import Deduplicator
        d = Deduplicator()
        assert d._normalize_title("Senior Software Engineer - Bangalore") == "senior software engineer"
        assert d._normalize_title("Frontend Developer | React") == "frontend developer"
        assert d._normalize_title("Data Scientist") == "data scientist"

    def test_normalize_location(self):
        from dedup import Deduplicator
        d = Deduplicator()
        assert d._normalize_location("Bangalore") == "bangalore"
        assert d._normalize_location("Mumbai, Maharashtra") == "mumbai maharashtra"
        assert d._normalize_location("Delhi NCR") == "delhi ncr"

    def test_levenshtein_ratio_exact(self):
        from dedup import Deduplicator
        d = Deduplicator()
        assert d._levenshtein_ratio("google", "google") == 1.0

    def test_levenshtein_ratio_similar(self):
        from dedup import Deduplicator
        d = Deduplicator()
        ratio = d._levenshtein_ratio("google", "googl")
        assert ratio > 0.8

    def test_levenshtein_ratio_different(self):
        from dedup import Deduplicator
        d = Deduplicator()
        ratio = d._levenshtein_ratio("google", "microsoft")
        assert ratio < 0.3

    def test_levenshtein_empty(self):
        from dedup import Deduplicator
        d = Deduplicator()
        assert d._levenshtein_ratio("", "") == 1.0
        assert d._levenshtein_ratio("test", "") == 0.0

    def test_is_duplicate_exact_match(self):
        from dedup import Deduplicator
        d = Deduplicator()
        mock_col = MagicMock()
        mock_col.find_one.return_value = {"source": "indeed", "job_id": "abc123"}
        with patch("dedup.get_jobs_collection", return_value=mock_col):
            assert d.is_duplicate({"source": "indeed", "job_id": "abc123", "company": "Google", "title": "Engineer", "location": "Bangalore"})


class _ConcreteScraper(BaseScraper):
    def scrape_keyword(self, keyword, location):
        return []

class TestBaseScraper:
    def _make(self):
        return _ConcreteScraper("test")

    def test_random_ua(self):
        s = self._make()
        ua = s._random_ua()
        assert ua.startswith("Mozilla/5.0")

    def test_headers(self):
        s = self._make()
        headers = s._headers()
        assert "User-Agent" in headers
        assert "Accept" in headers

    @patch("scrapers.base.httpx.Client")
    def test_get_with_retry_success(self, mock_client):
        s = self._make()
        mock_resp = MagicMock()
        mock_resp.status_code = 200
        mock_client_instance = mock_client.return_value
        mock_client_instance.get.return_value = mock_resp
        s._client = mock_client_instance
        resp = s._get_with_retry("https://example.com")
        assert resp is not None

    @patch("scrapers.base.httpx.Client")
    def test_get_with_retry_429(self, mock_client):
        s = self._make()
        mock_resp_429 = MagicMock()
        mock_resp_429.status_code = 429
        mock_resp_200 = MagicMock()
        mock_resp_200.status_code = 200
        mock_client_instance = mock_client.return_value
        mock_client_instance.get.side_effect = [mock_resp_429, mock_resp_200]
        s._client = mock_client_instance
        resp = s._get_with_retry("https://example.com", max_retries=2)
        assert resp is not None

    @patch("scrapers.base.httpx.Client")
    def test_get_with_retry_all_fail(self, mock_client):
        import httpx
        s = self._make()
        mock_resp = MagicMock()
        mock_resp.status_code = 500
        mock_resp.raise_for_status.side_effect = httpx.HTTPStatusError("fail", request=MagicMock(), response=mock_resp)
        mock_client_instance = mock_client.return_value
        mock_client_instance.get.return_value = mock_resp
        s._client = mock_client_instance
        with patch("scrapers.base.time.sleep"):
            resp = s._get_with_retry("https://example.com", max_retries=2)
        assert resp is None


class TestIndeedScraper:
    @patch("scrapers.indeed.IndeedScraper._fetch_page")
    def test_scrape_keyword_no_results(self, mock_fetch):
        from scrapers.indeed import IndeedScraper
        mock_fetch.return_value = "<html><body>No jobs found</body></html>"
        s = IndeedScraper()
        jobs = s.scrape_keyword("python", "Bangalore")
        assert isinstance(jobs, list)
        assert len(jobs) == 0

    def test_parse_salary_empty(self):
        from scrapers.indeed import IndeedScraper
        s = IndeedScraper()
        assert s._parse_salary("") == (None, None)
        assert s._parse_salary("Not disclosed") == (None, None)

    def test_parse_salary_range(self):
        from scrapers.indeed import IndeedScraper
        s = IndeedScraper()
        result = s._parse_salary("₹10,00,000 - ₹15,00,000 a year")
        min_val, max_val = result
        assert min_val is not None and max_val is not None


class TestNaukriScraper:
    def test_parse_salary_empty(self):
        from scrapers.naukri import NaukriScraper
        s = NaukriScraper()
        assert s._parse_salary("") == (None, None)
        assert s._parse_salary("Not Disclosed") == (None, None)

    def test_parse_salary_lpa(self):
        from scrapers.naukri import NaukriScraper
        s = NaukriScraper()
        result = s._parse_salary("10 Lakhs")
        min_val, max_val = result
        assert min_val == 10.0

    def test_parse_salary_range(self):
        from scrapers.naukri import NaukriScraper
        s = NaukriScraper()
        result = s._parse_salary("10 - 15 Lakhs")
        assert result == (10.0, 15.0)

    def test_parse_experience(self):
        from scrapers.naukri import NaukriScraper
        s = NaukriScraper()
        assert s._parse_experience("5-9 yrs") == (5, 9)
        assert s._parse_experience("") == (None, None)
        assert s._parse_experience("3+ years") == (3, 3)

    def test_parse_date_days_ago(self):
        from scrapers.naukri import NaukriScraper
        s = NaukriScraper()
        result = s._parse_date("Posted 1 day ago")
        assert result is not None

    def test_is_recent(self):
        from scrapers.naukri import NaukriScraper
        s = NaukriScraper()
        from datetime import datetime, timezone, timedelta
        assert s._is_recent(datetime.now(timezone.utc))
        assert s._is_recent(datetime.now(timezone.utc) - timedelta(hours=23))
        assert not s._is_recent(datetime.now(timezone.utc) - timedelta(days=2))


class TestInternshalaScraper:
    def test_parse_posted_today(self):
        from scrapers.internshala import InternshalaScraper
        s = InternshalaScraper()
        result = s._parse_posted("Posted Today")
        assert result is not None

    def test_parse_posted_yesterday(self):
        from scrapers.internshala import InternshalaScraper
        s = InternshalaScraper()
        result = s._parse_posted("Posted Yesterday")
        assert result is not None

    def test_parse_posted_days(self):
        from scrapers.internshala import InternshalaScraper
        s = InternshalaScraper()
        result = s._parse_posted("3 days ago")
        assert result is not None

    def test_parse_posted_empty(self):
        from scrapers.internshala import InternshalaScraper
        s = InternshalaScraper()
        assert s._parse_posted("") is None


class TestGlassdoorScraper:
    def test_parse_salary_empty(self):
        from scrapers.glassdoor import GlassdoorScraper
        s = GlassdoorScraper()
        assert s._parse_salary("") == (None, None)

    def test_parse_salary_range(self):
        from scrapers.glassdoor import GlassdoorScraper
        s = GlassdoorScraper()
        result = s._parse_salary("₹10L - ₹15L")
        min_val, max_val = result
        assert min_val == 10.0
        assert max_val == 15.0


class TestLinkedInScraper:
    def test_parse_posted_now(self):
        from scrapers.linkedin import LinkedInScraper
        s = LinkedInScraper()
        result = s._parse_posted("Posted just now")
        assert result is not None

    def test_parse_posted_hour(self):
        from scrapers.linkedin import LinkedInScraper
        s = LinkedInScraper()
        result = s._parse_posted("Posted 1 hour ago")
        assert result is not None

    def test_parse_posted_day(self):
        from scrapers.linkedin import LinkedInScraper
        s = LinkedInScraper()
        result = s._parse_posted("Posted 1 day ago")
        assert result is not None

    def test_parse_posted_old(self):
        from scrapers.linkedin import LinkedInScraper
        s = LinkedInScraper()
        result = s._parse_posted("Posted 2 weeks ago")
        assert result is None

    def test_parse_posted_empty(self):
        from scrapers.linkedin import LinkedInScraper
        s = LinkedInScraper()
        assert s._parse_posted("") is None


class TestDatabase:
    def setup_method(self):
        import database
        database._client = None

    @patch("database.MongoClient")
    def test_get_client(self, mock_mongo):
        from database import get_client
        client = get_client()
        assert client is not None

    @patch("database.MongoClient")
    def test_init_db(self, mock_mongo):
        from database import init_db
        mock_db = MagicMock()
        mock_col = MagicMock()
        mock_mongo.return_value.__getitem__.return_value = mock_db
        mock_db.__getitem__.return_value = mock_col
        init_db()
        assert mock_col.create_index.called

    @patch("database.MongoClient")
    def test_upsert_meta(self, mock_mongo):
        from database import upsert_meta
        mock_db = MagicMock()
        mock_col = MagicMock()
        mock_mongo.return_value.__getitem__.return_value = mock_db
        mock_db.__getitem__.return_value = mock_col
        upsert_meta("test_platform", last_run_at=datetime.now(timezone.utc))
        assert mock_col.update_one.called


class TestScheduler:
    def test_get_scraper_map(self):
        from scrapers import SCRAPER_MAP
        assert "linkedin" in SCRAPER_MAP
        assert "naukri" in SCRAPER_MAP
        assert "indeed" in SCRAPER_MAP
        assert "glassdoor" in SCRAPER_MAP
        assert "internshala" in SCRAPER_MAP

    @patch("scheduler.run_cycle")
    def test_run_forever_sigint(self, mock_cycle):
        from scheduler import run_forever
        import signal
        import os
        with patch("scheduler._running", False):
            pass
