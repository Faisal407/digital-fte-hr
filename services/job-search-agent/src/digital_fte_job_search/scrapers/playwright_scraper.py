"""
Playwright-based scraper for Tier 2/3 platforms
Used for Glassdoor, NaukriGulf, Bayt, Rozee.pk, etc.
"""

import asyncio
from datetime import datetime
from typing import Optional
import logging
from playwright.async_api import async_playwright, Page

from .base import BaseScraper, JobPosting, ScraperResult

logger = logging.getLogger(__name__)


class PlaywrightScraper(BaseScraper):
    """Base Playwright scraper for browser automation"""

    def __init__(
        self,
        platform: str,
        base_url: str,
        search_url_template: str,
        selectors: dict[str, str],
        rate_limit_per_hour: int = 10,
        search_delay_ms: int = 100,
    ):
        """
        Initialize Playwright scraper.

        Args:
            platform: Platform name
            base_url: Base URL for the platform
            search_url_template: URL template for search (use {query} placeholder)
            selectors: CSS selectors for job elements
            rate_limit_per_hour: Rate limit
            search_delay_ms: Delay between requests
        """
        super().__init__(platform, rate_limit_per_hour, search_delay_ms)
        self.base_url = base_url
        self.search_url_template = search_url_template
        self.selectors = selectors

    async def search(
        self,
        roles: list[str],
        locations: list[str],
        limit: int = 20,
    ) -> ScraperResult:
        """Search using Playwright browser automation"""
        start_time = asyncio.get_event_loop().time()
        jobs: list[JobPosting] = []
        error = None

        try:
            async with async_playwright() as p:
                browser = await p.chromium.launch(headless=True)
                page = await browser.new_page()

                # Add anti-bot headers
                await page.set_extra_http_headers({
                    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
                })

                for role in roles:
                    for location in locations:
                        try:
                            # Navigate to search URL
                            search_url = self.search_url_template.format(
                                query=f"{role} {location}"
                            )

                            logger.info(f"Scraping {self.platform}: {role} in {location}")

                            await page.goto(search_url, wait_until="domcontentloaded", timeout=30000)
                            await asyncio.sleep(self.search_delay_ms / 1000.0)

                            # Wait for job listings
                            try:
                                await page.wait_for_selector(self.selectors["job_item"], timeout=10000)
                            except Exception:
                                logger.warning(f"No job items found on {self.platform}")
                                continue

                            # Extract job data
                            job_elements = await page.query_selector_all(self.selectors["job_item"])

                            for element in job_elements[:limit]:
                                try:
                                    job_data = await self._extract_job_data(element)
                                    if job_data:
                                        job = self.parse_job(job_data)
                                        jobs.append(job)

                                        if len(jobs) >= limit:
                                            break
                                except Exception as e:
                                    logger.warning(f"Failed to extract job: {e}")
                                    continue

                        except Exception as e:
                            logger.error(f"Error scraping {role} in {location}: {e}")
                            continue

                await browser.close()

        except Exception as e:
            error = str(e)
            logger.error(f"{self.platform} scraper error: {e}")

        duration = asyncio.get_event_loop().time() - start_time

        return ScraperResult(
            platform=self.platform,
            success=error is None,
            jobs=jobs,
            total_found=len(jobs),
            error=error,
            duration_seconds=duration,
        )

    async def _extract_job_data(self, element) -> Optional[dict]:
        """Extract job data from a DOM element"""
        data = {}

        try:
            for key, selector in self.selectors.items():
                if key.startswith("job_"):  # Only extract job_* selectors
                    el = await element.query_selector(selector)
                    if el:
                        data[key] = await el.text_content()
                    else:
                        data[key] = None

            return data if data else None
        except Exception as e:
            logger.warning(f"Error extracting job data: {e}")
            return None

    def parse_job(self, raw_job: dict) -> JobPosting:
        """Parse raw job data (override in subclass)"""
        raise NotImplementedError


class GlassdoorScraper(PlaywrightScraper):
    """Glassdoor scraper"""

    def __init__(self):
        super().__init__(
            platform="glassdoor",
            base_url="https://www.glassdoor.com",
            search_url_template="https://www.glassdoor.com/Job/jobs.htm?keyword={query}",
            selectors={
                "job_item": "li.JobCard_jobCardContainer",
                "job_title": ".JobCard_title",
                "job_company": ".EmployerName",
                "job_location": ".JobCard_location",
                "job_link": "a[href*='/job-listing/']",
            },
            rate_limit_per_hour=15,
            search_delay_ms=100,
        )

    def parse_job(self, raw_job: dict) -> JobPosting:
        """Parse Glassdoor job"""
        return JobPosting(
            job_id=f"glassdoor#{raw_job.get('job_link', 'unknown')}",
            platform="glassdoor",
            platform_job_id=raw_job.get("job_link", "unknown"),
            platform_url=raw_job.get("job_link", "https://glassdoor.com"),
            title=raw_job.get("job_title", "Unknown").strip(),
            company=raw_job.get("job_company", "Unknown").strip(),
            location=raw_job.get("job_location", "Unknown").strip(),
            description=raw_job.get("job_description", ""),
        )


class NaukriGulfScraper(PlaywrightScraper):
    """NaukriGulf scraper (for Middle East)"""

    def __init__(self):
        super().__init__(
            platform="naukrigulf",
            base_url="https://www.naukrigulf.com",
            search_url_template="https://www.naukrigulf.com/search-jobs?keyword={query}",
            selectors={
                "job_item": ".jobCardContainer",
                "job_title": ".jobTitle",
                "job_company": ".companyName",
                "job_location": ".jobLocation",
            },
            rate_limit_per_hour=10,
            search_delay_ms=200,
        )

    def parse_job(self, raw_job: dict) -> JobPosting:
        """Parse NaukriGulf job"""
        return JobPosting(
            job_id=f"naukrigulf#{raw_job.get('job_title', 'unknown')}",
            platform="naukrigulf",
            platform_job_id=raw_job.get("job_title", "unknown"),
            platform_url="https://www.naukrigulf.com",
            title=raw_job.get("job_title", "Unknown").strip(),
            company=raw_job.get("job_company", "Unknown").strip(),
            location=raw_job.get("job_location", "Unknown").strip(),
            description="",
        )


class BaytScraper(PlaywrightScraper):
    """Bayt.com scraper (for Middle East)"""

    def __init__(self):
        super().__init__(
            platform="bayt",
            base_url="https://www.bayt.com",
            search_url_template="https://www.bayt.com/en/q-{query}/",
            selectors={
                "job_item": ".has-multiple-locations.atom-job-item",
                "job_title": ".atom-title",
                "job_company": ".atom-company",
                "job_location": ".atom-location",
            },
            rate_limit_per_hour=10,
            search_delay_ms=200,
        )

    def parse_job(self, raw_job: dict) -> JobPosting:
        """Parse Bayt job"""
        return JobPosting(
            job_id=f"bayt#{raw_job.get('job_title', 'unknown')}",
            platform="bayt",
            platform_job_id=raw_job.get("job_title", "unknown"),
            platform_url="https://www.bayt.com",
            title=raw_job.get("job_title", "Unknown").strip(),
            company=raw_job.get("job_company", "Unknown").strip(),
            location=raw_job.get("job_location", "Unknown").strip(),
            description="",
        )


class RozeePkScraper(PlaywrightScraper):
    """Rozee.pk scraper (for Pakistan)"""

    def __init__(self):
        super().__init__(
            platform="rozee_pk",
            base_url="https://www.rozee.pk",
            search_url_template="https://www.rozee.pk/jobs?title={query}",
            selectors={
                "job_item": ".search_job_item",
                "job_title": ".jobTitle",
                "job_company": ".company_name",
                "job_location": ".jobLocation",
            },
            rate_limit_per_hour=10,
            search_delay_ms=200,
        )

    def parse_job(self, raw_job: dict) -> JobPosting:
        """Parse Rozee.pk job"""
        return JobPosting(
            job_id=f"rozee_pk#{raw_job.get('job_title', 'unknown')}",
            platform="rozee_pk",
            platform_job_id=raw_job.get("job_title", "unknown"),
            platform_url="https://www.rozee.pk",
            title=raw_job.get("job_title", "Unknown").strip(),
            company=raw_job.get("job_company", "Unknown").strip(),
            location=raw_job.get("job_location", "Unknown").strip(),
            description="",
        )
