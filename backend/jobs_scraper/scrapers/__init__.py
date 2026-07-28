from scrapers.base import BaseScraper
from scrapers.linkedin import LinkedInScraper
from scrapers.naukri import NaukriScraper
from scrapers.indeed import IndeedScraper
from scrapers.glassdoor import GlassdoorScraper
from scrapers.internshala import InternshalaScraper

SCRAPER_MAP = {
    "linkedin": LinkedInScraper,
    "naukri": NaukriScraper,
    "indeed": IndeedScraper,
    "glassdoor": GlassdoorScraper,
    "internshala": InternshalaScraper,
}

__all__ = ["BaseScraper", "LinkedInScraper", "NaukriScraper", "IndeedScraper", "GlassdoorScraper", "InternshalaScraper", "SCRAPER_MAP"]
