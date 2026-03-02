"""Job platform scrapers"""

from .base import BaseScraper, JobPosting, ScraperResult
from .linkedin import LinkedInScraper
from .indeed import IndeedScraper
from .playwright_scraper import (
    PlaywrightScraper,
    GlassdoorScraper,
    NaukriGulfScraper,
    BaytScraper,
    RozeePkScraper,
)

__all__ = [
    "BaseScraper",
    "JobPosting",
    "ScraperResult",
    "LinkedInScraper",
    "IndeedScraper",
    "PlaywrightScraper",
    "GlassdoorScraper",
    "NaukriGulfScraper",
    "BaytScraper",
    "RozeePkScraper",
]
