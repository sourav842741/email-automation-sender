from __future__ import annotations

import random
import time
from abc import ABC, abstractmethod
from typing import Any, Optional

import httpx
import structlog

from config import PROXY_ENABLED, PROXY_URL, USER_AGENTS

logger = structlog.get_logger()


class BaseScraper(ABC):
    def __init__(self, platform: str):
        self.platform = platform
        self._client: Optional[httpx.Client] = None

    @property
    def client(self) -> httpx.Client:
        if self._client is None:
            proxy = PROXY_URL if PROXY_ENABLED else None
            client_kwargs = {"timeout": 30.0, "follow_redirects": True}
            if proxy:
                client_kwargs["proxy"] = proxy
            self._client = httpx.Client(**client_kwargs)
        return self._client

    def _random_ua(self) -> str:
        return random.choice(USER_AGENTS)

    def _headers(self, **extra: str) -> dict[str, str]:
        return {
            "User-Agent": self._random_ua(),
            "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
            "Accept-Language": "en-US,en;q=0.5",
            "Accept-Encoding": "gzip, deflate, br",
            "DNT": "1",
            "Connection": "keep-alive",
            "Upgrade-Insecure-Requests": "1",
            **extra,
        }

    def _rate_limit(self, delay_range: tuple[float, float]) -> None:
        time.sleep(random.uniform(*delay_range))

    def _get_with_retry(
        self, url: str, max_retries: int = 3, headers: Optional[dict] = None
    ) -> Optional[httpx.Response]:
        for attempt in range(max_retries):
            try:
                resp = self.client.get(url, headers=headers or self._headers())
                logger.info("http_request", url=url, status=resp.status_code, attempt=attempt + 1, platform=self.platform)
                if resp.status_code == 429:
                    wait = (2 ** attempt) + random.uniform(0, 1)
                    logger.warning("rate_limited", url=url, platform=self.platform, wait_secs=round(wait, 1))
                    time.sleep(wait)
                    continue
                if resp.status_code in (503, 502):
                    wait = (2 ** attempt) + random.uniform(0, 1)
                    time.sleep(wait)
                    continue
                resp.raise_for_status()
                return resp
            except (httpx.TimeoutException, httpx.HTTPStatusError, httpx.RequestError) as e:
                logger.error("request_failed", url=url, platform=self.platform, attempt=attempt + 1, error=str(e))
                if attempt < max_retries - 1:
                    time.sleep((2 ** attempt) + random.uniform(0, 1))
        return None

    @abstractmethod
    def scrape_keyword(self, keyword: str, location: str) -> list[dict[str, Any]]:
        ...

    def scrape_all(self, keywords: list[str], locations: list[str]) -> list[dict[str, Any]]:
        all_jobs: list[dict[str, Any]] = []
        for kw in keywords:
            for loc in locations:
                try:
                    jobs = self.scrape_keyword(kw, loc)
                    for j in jobs:
                        j["search_term"] = f"{kw} - {loc}"
                    all_jobs.extend(jobs)
                    logger.info("keyword_done", platform=self.platform, keyword=kw, location=loc, count=len(jobs))
                except Exception as e:
                    logger.error("keyword_failed", platform=self.platform, keyword=kw, location=loc, error=str(e))
        return all_jobs

    def close(self) -> None:
        if self._client:
            self._client.close()
            self._client = None
