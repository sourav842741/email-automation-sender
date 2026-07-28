from __future__ import annotations

import re
from typing import Optional

import structlog

logger = structlog.get_logger()

EMAIL_REGEX = re.compile(r'[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}')

HR_PREFIXES = ["hr", "careers", "hiring", "recruit", "talent",
               "people", "jobs", "resume", "cv", "apply",
               "contact", "hello", "admin", "info", "support", "work"]

HR_SCORES = {
    "hr": 10, "careers": 9, "hiring": 8, "recruit": 8,
    "talent": 7, "people": 6, "jobs": 6, "resume": 5,
    "cv": 5, "apply": 5, "contact": 4, "hello": 4, "admin": 3,
    "info": 2, "support": 1, "work": 3,
}


def _score_email(local_part: str, domain: str) -> int:
    lp = local_part.lower()
    parts = re.split(r'[._-]', lp)
    for part in parts:
        if part in HR_SCORES:
            return HR_SCORES[part]
        for kw in HR_PREFIXES:
            if kw in part:
                return HR_SCORES.get(kw, 5)
    return 0


def extract_email(text: str, company: str = "") -> Optional[str]:
    if not text:
        return None
    matches = EMAIL_REGEX.findall(text)
    if not matches:
        return None

    if company:
        company_slug = re.sub(r'[^a-zA-Z0-9]', '', company).lower()
        for m in matches:
            domain = m.split("@")[1].lower()
            if company_slug in domain.replace('.', '') or domain.startswith(company.lower()[:5]):
                return m

    scored = sorted(
        ((m, _score_email(m.split("@")[0], m.split("@")[1])) for m in matches),
        key=lambda x: (-x[1], matches.index(x[0]))
    )
    best = scored[0]
    if best[1] > 0:
        return best[0]
    return None
