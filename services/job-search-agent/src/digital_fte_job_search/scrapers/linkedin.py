"""
LinkedIn job scraper
Tier 1: Official API (requires authentication)
"""

import asyncio
from datetime import datetime, timedelta
from typing import Optional
import logging
import httpx

from .base import BaseScraper, JobPosting, ScraperResult

logger = logging.getLogger(__name__)


class LinkedInScraper(BaseScraper):
    """LinkedIn job scraper using API"""

    def __init__(self, access_token: Optional[str] = None):
        super().__init__(
            platform="linkedin",
            rate_limit_per_hour=10,
            search_delay_ms=100,
        )
        self.access_token = access_token or "mock-token"  # Use real token in production
        self.base_url = "https://api.linkedin.com/v2"

    async def search(
        self,
        roles: list[str],
        locations: list[str],
        limit: int = 20,
    ) -> ScraperResult:
        """Search LinkedIn for jobs"""
        start_time = asyncio.get_event_loop().time()
        jobs: list[JobPosting] = []
        total_found = 0
        error = None

        try:
            async with httpx.AsyncClient() as client:
                headers = {
                    "Authorization": f"Bearer {self.access_token}",
                    "Accept": "application/json",
                }

                # Build search query
                queries = [f'"{role}"' for role in roles]
                locations_query = " OR ".join([f'"{loc}"' for loc in locations])

                search_params = {
                    "keywords": " OR ".join(queries),
                    "locationName": locations_query,
                    "limit": min(limit, 100),
                }

                # Make API request (would be real in production)
                # For now, return mock data
                logger.info(
                    f"Searching LinkedIn: {search_params['keywords']} in {search_params['locationName']}"
                )

                # Mock response for development
                mock_jobs = self._generate_mock_jobs(
                    roles=roles, locations=locations, count=min(limit, 5)
                )

                jobs = [self.parse_job(job) for job in mock_jobs]
                total_found = len(jobs)

                await asyncio.sleep(self.search_delay_ms / 1000.0)

        except Exception as e:
            error = str(e)
            logger.error(f"LinkedIn scraper error: {e}")

        duration = asyncio.get_event_loop().time() - start_time

        return ScraperResult(
            platform="linkedin",
            success=error is None,
            jobs=jobs,
            total_found=total_found,
            error=error,
            duration_seconds=duration,
        )

    def parse_job(self, raw_job: dict) -> JobPosting:
        """Parse LinkedIn job response"""
        posted_at = None
        if "postedAt" in raw_job:
            posted_at = datetime.fromtimestamp(raw_job["postedAt"] / 1000)

        salary_min, salary_max = None, None
        if "salary" in raw_job and raw_job["salary"]:
            salary_min = raw_job["salary"].get("min")
            salary_max = raw_job["salary"].get("max")

        return JobPosting(
            job_id=f"linkedin#{raw_job['entityUrn']}",
            platform="linkedin",
            platform_job_id=raw_job["entityUrn"],
            platform_url=f"https://linkedin.com/jobs/{raw_job['entityUrn']}",
            title=raw_job.get("title", "Unknown"),
            company=raw_job.get("companyName", "Unknown"),
            location=raw_job.get("location", "Unknown"),
            description=raw_job.get("description", ""),
            requirements=raw_job.get("description", ""),
            salary=raw_job.get("salaryText"),
            salary_min=salary_min,
            salary_max=salary_max,
            job_type=raw_job.get("jobType"),
            posted_date=posted_at,
            company_url=f"https://linkedin.com/company/{raw_job.get('companyId', '')}",
        )

    def _generate_mock_jobs(
        self, roles: list[str], locations: list[str], count: int = 5
    ) -> list[dict]:
        """Generate mock LinkedIn jobs for development"""
        job_titles = [
            "Senior Software Engineer",
            "Backend Engineer",
            "Full Stack Developer",
            "Machine Learning Engineer",
        ]
        companies = ["Google", "Microsoft", "Apple", "Meta", "Amazon"]

        jobs = []
        for i in range(count):
            jobs.append(
                {
                    "entityUrn": f"jobPosting:{i}",
                    "title": job_titles[i % len(job_titles)],
                    "companyName": companies[i % len(companies)],
                    "companyId": f"company:{i}",
                    "location": locations[0] if locations else "San Francisco, CA",
                    "description": "We are looking for talented engineers to join our team.",
                    "jobType": "FULL_TIME",
                    "salaryText": "$150K - $200K",
                    "salary": {"min": 150000, "max": 200000},
                    "postedAt": int((asyncio.get_event_loop().time() - i * 86400) * 1000),
                }
            )

        return jobs
