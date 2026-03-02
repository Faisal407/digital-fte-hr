"""
Indeed job scraper
Tier 1: Official API
"""

import asyncio
from datetime import datetime
from typing import Optional
import logging
import httpx

from .base import BaseScraper, JobPosting, ScraperResult

logger = logging.getLogger(__name__)


class IndeedScraper(BaseScraper):
    """Indeed job scraper using API"""

    def __init__(self, api_key: Optional[str] = None):
        super().__init__(
            platform="indeed",
            rate_limit_per_hour=20,
            search_delay_ms=50,
        )
        self.api_key = api_key or "mock-api-key"
        self.base_url = "https://api.indeed.com/v1"

    async def search(
        self,
        roles: list[str],
        locations: list[str],
        limit: int = 20,
    ) -> ScraperResult:
        """Search Indeed for jobs"""
        start_time = asyncio.get_event_loop().time()
        jobs: list[JobPosting] = []
        total_found = 0
        error = None

        try:
            async with httpx.AsyncClient() as client:
                headers = {
                    "Authorization": f"Bearer {self.api_key}",
                    "Accept": "application/json",
                }

                # Mock search for development
                logger.info(f"Searching Indeed: {roles} in {locations}")

                mock_jobs = self._generate_mock_jobs(
                    roles=roles, locations=locations, count=min(limit, 5)
                )

                jobs = [self.parse_job(job) for job in mock_jobs]
                total_found = len(jobs)

                await asyncio.sleep(self.search_delay_ms / 1000.0)

        except Exception as e:
            error = str(e)
            logger.error(f"Indeed scraper error: {e}")

        duration = asyncio.get_event_loop().time() - start_time

        return ScraperResult(
            platform="indeed",
            success=error is None,
            jobs=jobs,
            total_found=total_found,
            error=error,
            duration_seconds=duration,
        )

    def parse_job(self, raw_job: dict) -> JobPosting:
        """Parse Indeed job response"""
        posted_at = None
        if "postedDate" in raw_job:
            posted_at = datetime.fromisoformat(raw_job["postedDate"].replace("Z", "+00:00"))

        salary_min, salary_max = None, None
        if "salary" in raw_job and raw_job["salary"]:
            salary_min, salary_max = self.extract_salary(raw_job["salary"])

        return JobPosting(
            job_id=f"indeed#{raw_job['id']}",
            platform="indeed",
            platform_job_id=raw_job["id"],
            platform_url=raw_job.get("url", f"https://indeed.com/viewjob?jk={raw_job['id']}"),
            title=raw_job.get("jobTitle", "Unknown"),
            company=raw_job.get("company", "Unknown"),
            location=raw_job.get("location", "Unknown"),
            description=raw_job.get("snippet", ""),
            requirements=raw_job.get("requirements"),
            salary=raw_job.get("salary"),
            salary_min=salary_min,
            salary_max=salary_max,
            job_type=raw_job.get("employmentType"),
            posted_date=posted_at,
        )

    def _generate_mock_jobs(
        self, roles: list[str], locations: list[str], count: int = 5
    ) -> list[dict]:
        """Generate mock Indeed jobs for development"""
        job_titles = [
            "Software Engineer",
            "DevOps Engineer",
            "Frontend Developer",
            "Data Engineer",
        ]
        companies = ["Google", "Microsoft", "Apple", "Meta", "Amazon"]

        jobs = []
        for i in range(count):
            jobs.append(
                {
                    "id": f"indeed_{i}",
                    "jobTitle": job_titles[i % len(job_titles)],
                    "company": companies[i % len(companies)],
                    "location": locations[0] if locations else "New York, NY",
                    "snippet": "We are looking for experienced engineers...",
                    "url": f"https://indeed.com/viewjob?jk=indeed_{i}",
                    "salary": f"${120000 + i*10000} - ${150000 + i*10000} per year",
                    "employmentType": "FULL_TIME",
                    "postedDate": datetime.utcnow().isoformat() + "Z",
                }
            )

        return jobs
