#!/usr/bin/env python3
from __future__ import annotations

import argparse
import sys
import time

import structlog

from config import SEARCH_KEYWORDS, SEARCH_LOCATIONS
from scheduler import run_cycle, run_forever

logger = structlog.get_logger()


def main() -> None:
    parser = argparse.ArgumentParser(description="Multi-platform job scraper")
    parser.add_argument("--platforms", type=str, default="",
                        help="Comma-separated list: linkedin,naukri,indeed,glassdoor,internshala")
    parser.add_argument("--keywords", type=str, default="",
                        help="Comma-separated list of keywords (default: config)")
    parser.add_argument("--locations", type=str, default="",
                        help="Comma-separated list of locations (default: config)")
    parser.add_argument("--once", action="store_true",
                        help="Run one cycle and exit")
    parser.add_argument("--forever", action="store_true",
                        help="Run continuously with configured interval")
    args = parser.parse_args()

    platforms = [p.strip() for p in args.platforms.split(",") if p.strip()] if args.platforms else None
    keywords = [k.strip() for k in args.keywords.split(",") if k.strip()] if args.keywords else None
    locations = [l.strip() for l in args.locations.split(",") if l.strip()] if args.locations else None

    structlog.configure(
        processors=[
            structlog.stdlib.add_log_level,
            structlog.dev.ConsoleRenderer(),
        ],
        wrapper_class=structlog.stdlib.BoundLogger,
        context_class=dict,
        logger_factory=structlog.PrintLoggerFactory(),
        cache_logger_on_first_use=True,
    )

    if args.once:
        logger.info("mode_once", platforms=platforms or "all")
        results = run_cycle(platforms=platforms, keywords=keywords, locations=locations)
        logger.info("done", results=results)
        sys.exit(0)

    if args.forever or (not args.once):
        logger.info("mode_forever", platforms=platforms or "all", interval_minutes=30)
        run_forever(platforms=platforms)


if __name__ == "__main__":
    main()
