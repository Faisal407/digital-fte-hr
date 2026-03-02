"""
Base scraper class - all platform scrapers extend this
"""

from abc import ABC, abstractmethod
from dataclasses import dataclass
from datetime import datetime
from typing import Optional
import logging

logger = logging.getLogger(__name__)


@dataclass
class JobPosting:
    """Standardized job posting format"""

    job_id: str  # Unique ID from platform
    platform: str
    platform_job_id: str  # Original ID from platform
    platform_url: str
    title: str
    company: str
    location: str
    description: str
    requirements: Optional[str] = None
    benefits: Optional[str] = None
    salary: Optional[str] = None
    salary_min: Optional[int] = None
    salary_max: Optional[int] = None
    job_type: Optional[str] = None  # full-time, contract, etc
    posted_date: Optional[datetime] = None
    company_url: Optional[str] = None
    tags: list[str] = None

    def __post_init__(self) -> None:
        if self.tags is None:
            self.tags = []


@dataclass
class ScraperResult:
    """Result from a scraper run"""

    platform: str
    success: bool
    jobs: list[JobPosting]
    total_found: int
    error: Optional[str] = None
    duration_seconds: float = 0.0


class BaseScraper(ABC):
    """
    Base class for all platform scrapers.

    Subclasses must implement:
    - search() - Execute the search
    - parse_job() - Parse a job posting into standardized format
    """

    def __init__(
        self,
        platform: str,
        rate_limit_per_hour: int = 20,
        search_delay_ms: int = 100,
    ) -> None:
        self.platform = platform
        self.rate_limit_per_hour = rate_limit_per_hour
        self.search_delay_ms = search_delay_ms
        self.logger = logging.getLogger(f"scraper.{platform}")

    @abstractmethod
    async def search(
        self,
        roles: list[str],
        locations: list[str],
        limit: int = 20,
    ) -> ScraperResult:
        """
        Search for jobs on this platform.

        Args:
            roles: Job titles/roles to search for
            locations: Locations to search in
            limit: Max number of jobs to return

        Returns:
            ScraperResult with jobs or error
        """
        pass

    @abstractmethod
    def parse_job(self, raw_job: dict) -> JobPosting:
        """
        Parse raw job data into standardized format.

        Args:
            raw_job: Raw job data from platform

        Returns:
            Standardized JobPosting
        """
        pass

    def normalize_title(self, title: str) -> str:
        """Normalize job title for consistency"""
        return title.lower().strip()

    def normalize_location(self, location: str) -> str:
        """Normalize location (e.g., 'San Francisco, CA' -> 'san francisco, ca')"""
        return location.lower().strip()

    def extract_salary(self, text: str) -> tuple[Optional[int], Optional[int]]:
        """
        Extract salary range from text.

        Args:
            text: Text containing salary info

        Returns:
            Tuple of (min_salary, max_salary) or (None, None)
        """
        import re

        # Match patterns like $50k-$70k, $50,000 - $70,000, etc
        pattern = r"\$?([\d,]+)(?:\s*[-–]\s*\$?([\d,]+))?"
        matches = re.findall(pattern, text)

        if not matches:
            return None, None

        try:
            first = int(matches[0][0].replace(",", ""))
            second = int(matches[0][1].replace(",", "")) if matches[0][1] else first

            # Normalize to annual if looks like hourly
            if first < 100:
                first = first * 1000
            if second < 100:
                second = second * 1000

            return min(first, second), max(first, second)
        except (ValueError, IndexError):
            return None, None

    def deduplicate_id(self, platform: str, platform_id: str) -> str:
        """
        Create a deduplication ID combining platform and ID.

        Used for cross-platform deduplication.
        """
        return f"{platform}#{platform_id}"
