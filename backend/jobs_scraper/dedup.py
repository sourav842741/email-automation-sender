from __future__ import annotations

import re
from typing import Any, Optional

from database import get_jobs_collection


class Deduplicator:
    def __init__(self):
        pass

    def is_duplicate(self, job: dict) -> bool:
        col = get_jobs_collection()
        source = job.get("source")
        job_id = job.get("job_id")

        if source and job_id:
            existing = col.find_one({"source": source, "job_id": job_id})
            if existing:
                return True

        company = self._normalize_company(job.get("company", ""))
        title = self._normalize_title(job.get("title", ""))
        location = self._normalize_location(job.get("location", ""))

        candidates = col.find({"source": source}).limit(200)

        for c in candidates:
            c_company = self._normalize_company(c.get("company", ""))
            c_title = self._normalize_title(c.get("title", ""))
            c_location = self._normalize_location(c.get("location", ""))

            if self._levenshtein_ratio(company, c_company) > 0.85 and \
               self._levenshtein_ratio(title, c_title) > 0.85 and \
               self._levenshtein_ratio(location, c_location) > 0.8:
                return True

        return False

    def _normalize_company(self, name: str) -> str:
        name = name.lower().strip()
        name = re.sub(r'\b(inc|pvt\s*ltd|ltd|technologies|technology|tech|solutions|services|corp|corporation|llc|private\s*limited)\b', '', name)
        name = re.sub(r'[^a-z0-9\s]', '', name)
        name = re.sub(r'\s+', ' ', name).strip()
        return name

    def _normalize_title(self, title: str) -> str:
        title = title.lower().strip()
        title = re.sub(r'\s*[-–|]\s*.*$', '', title)
        title = re.sub(r'[^a-z0-9\s/]', '', title)
        title = re.sub(r'\s+', ' ', title).strip()
        return title

    def _normalize_location(self, location: str) -> str:
        if not location:
            return ""
        location = location.lower().strip()
        location = re.sub(r'[^a-z\s]', '', location)
        location = re.sub(r'\s+', ' ', location).strip()
        city_match = re.search(r'([a-z\s]+?)(?:\s*,|\s+area|\s+region|\s+metro)', location)
        if city_match:
            location = city_match.group(1).strip()
        return location

    def _levenshtein_ratio(self, s1: str, s2: str) -> float:
        if not s1 and not s2:
            return 1.0
        if not s1 or not s2:
            return 0.0

        m, n = len(s1), len(s2)
        dp = [[0] * (n + 1) for _ in range(m + 1)]

        for i in range(m + 1):
            dp[i][0] = i
        for j in range(n + 1):
            dp[0][j] = j

        for i in range(1, m + 1):
            for j in range(1, n + 1):
                cost = 0 if s1[i - 1] == s2[j - 1] else 1
                dp[i][j] = min(dp[i - 1][j] + 1, dp[i][j - 1] + 1, dp[i - 1][j - 1] + cost)

        return 1 - (dp[m][n] / max(m, n))
