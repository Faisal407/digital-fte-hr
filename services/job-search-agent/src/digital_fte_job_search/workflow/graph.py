"""
LangGraph workflow for job search orchestration
Multi-agent pipeline: Search → Deduplicate → Score → Detect Ghost → Return Results
"""

import logging
from dataclasses import dataclass, field
from datetime import datetime
from typing import Optional
from enum import Enum

from langgraph.graph import StateGraph, END
from langgraph.types import Send

logger = logging.getLogger(__name__)


class SearchState(Enum):
    """States in the job search workflow"""

    INIT = "init"
    SEARCHING = "searching"
    DEDUPLICATING = "deduplicating"
    SCORING = "scoring"
    GHOST_DETECTION = "ghost_detection"
    COMPLETE = "complete"
    ERROR = "error"


@dataclass
class JobSearchInput:
    """Input to job search workflow"""

    user_id: str
    correlation_id: str
    target_roles: list[str]
    target_locations: list[str]
    target_industries: list[str]
    years_of_experience: int
    skills: list[str]
    salary_min: Optional[int] = None
    salary_max: Optional[int] = None
    limit: int = 20
    platforms: Optional[list[str]] = None


@dataclass
class JobSearchState:
    """State throughout job search workflow"""

    input: JobSearchInput
    state: SearchState = SearchState.INIT
    raw_jobs: list[dict] = field(default_factory=list)
    unique_jobs: list[dict] = field(default_factory=list)
    scored_jobs: list[dict] = field(default_factory=list)
    final_jobs: list[dict] = field(default_factory=list)
    platforms_searched: list[str] = field(default_factory=list)
    platforms_failed: list[dict] = field(default_factory=list)
    dedup_count: int = 0
    ghost_count: int = 0
    total_jobs: int = 0
    error: Optional[str] = None
    start_time: Optional[datetime] = None
    end_time: Optional[datetime] = None


class JobSearchGraph:
    """LangGraph workflow for job search"""

    def __init__(self):
        from digital_fte_job_search.scoring.matcher import JobMatcher
        from digital_fte_job_search.scoring.deduplicator import JobDeduplicator
        from digital_fte_job_search.scoring.ghost_detector import GhostJobDetector

        self.matcher = JobMatcher()
        self.deduplicator = JobDeduplicator()
        self.ghost_detector = GhostJobDetector()

        self.graph = self._build_graph()

    def _build_graph(self):
        """Build the LangGraph state machine"""
        workflow = StateGraph(JobSearchState)

        # Add nodes
        workflow.add_node("search_jobs", self._search_node)
        workflow.add_node("deduplicate", self._deduplicate_node)
        workflow.add_node("score_jobs", self._score_node)
        workflow.add_node("detect_ghosts", self._ghost_detection_node)
        workflow.add_node("finalize", self._finalize_node)
        workflow.add_node("error_handler", self._error_node)

        # Define edges
        workflow.set_entry_point("search_jobs")

        workflow.add_edge("search_jobs", "deduplicate")
        workflow.add_edge("deduplicate", "score_jobs")
        workflow.add_edge("score_jobs", "detect_ghosts")
        workflow.add_edge("detect_ghosts", "finalize")
        workflow.add_edge("finalize", END)

        # Error handling
        workflow.add_edge("error_handler", END)

        return workflow.compile()

    async def execute(self, input_data: JobSearchInput) -> JobSearchState:
        """Execute the job search workflow"""
        state = JobSearchState(input=input_data)
        state.start_time = datetime.utcnow()

        try:
            # Execute graph
            config = {"recursion_limit": 100}
            result = await self.graph.ainvoke(state, config)
            return result
        except Exception as e:
            logger.error(f"Workflow error: {e}")
            state.state = SearchState.ERROR
            state.error = str(e)
            return state

    async def _search_node(self, state: JobSearchState) -> JobSearchState:
        """Search multiple platforms in parallel"""
        logger.info(f"Searching {len(state.input.target_roles)} roles on job platforms")

        # Import scrapers
        from digital_fte_job_search.scrapers.linkedin import LinkedInScraper
        from digital_fte_job_search.scrapers.indeed import IndeedScraper
        from digital_fte_job_search.scrapers.playwright_scraper import (
            GlassdoorScraper,
            NaukriGulfScraper,
            BaytScraper,
            RozeePkScraper,
        )

        # Create scrapers
        scrapers = [
            LinkedInScraper(),
            IndeedScraper(),
            GlassdoorScraper(),
            NaukriGulfScraper(),
            BaytScraper(),
            RozeePkScraper(),
        ]

        # Filter by requested platforms
        if state.input.platforms:
            scrapers = [s for s in scrapers if s.platform in state.input.platforms]

        # Search in parallel
        import asyncio

        results = await asyncio.gather(
            *[
                scraper.search(
                    roles=state.input.target_roles,
                    locations=state.input.target_locations,
                    limit=state.input.limit,
                )
                for scraper in scrapers
            ],
            return_exceptions=True,
        )

        # Aggregate results
        for result in results:
            if isinstance(result, Exception):
                logger.error(f"Scraper error: {result}")
                continue

            if result.success:
                state.platforms_searched.append(result.platform)
                state.raw_jobs.extend(
                    [
                        {
                            "id": job.job_id,
                            "platform": job.platform,
                            "platform_job_id": job.platform_job_id,
                            "platform_url": job.platform_url,
                            "title": job.title,
                            "company": job.company,
                            "location": job.location,
                            "description": job.description,
                            "requirements": job.requirements,
                            "salary": job.salary,
                            "posted_date": job.posted_date,
                            "tags": job.tags,
                        }
                        for job in result.jobs
                    ]
                )
            else:
                state.platforms_failed.append(
                    {"platform": result.platform, "reason": result.error or "Unknown error"}
                )

        state.state = SearchState.SEARCHING
        logger.info(f"Found {len(state.raw_jobs)} total jobs from {len(state.platforms_searched)} platforms")

        return state

    async def _deduplicate_node(self, state: JobSearchState) -> JobSearchState:
        """Deduplicate jobs across platforms"""
        if not state.raw_jobs:
            logger.warning("No jobs to deduplicate")
            return state

        logger.info(f"Deduplicating {len(state.raw_jobs)} jobs")

        # Use simple dedup for speed (Claude dedup optional)
        unique_jobs, dedup_count = self.deduplicator.simple_deduplicate(state.raw_jobs)

        state.unique_jobs = unique_jobs
        state.dedup_count = dedup_count
        state.state = SearchState.DEDUPLICATING

        logger.info(f"Deduplicated {dedup_count} jobs, {len(unique_jobs)} unique")

        return state

    async def _score_node(self, state: JobSearchState) -> JobSearchState:
        """Score jobs against user profile"""
        if not state.unique_jobs:
            return state

        logger.info(f"Scoring {len(state.unique_jobs)} jobs")

        from digital_fte_job_search.scoring.matcher import UserProfile

        user_profile = UserProfile(
            user_id=state.input.user_id,
            target_roles=state.input.target_roles,
            target_locations=state.input.target_locations,
            target_industries=state.input.target_industries,
            years_of_experience=state.input.years_of_experience,
            skills=state.input.skills,
            salary_min=state.input.salary_min,
            salary_max=state.input.salary_max,
        )

        # Score jobs (batch)
        scored_jobs = await self.matcher.score_jobs(state.unique_jobs, user_profile)

        # Filter by minimum score
        state.scored_jobs = [j for j in scored_jobs if j.get("match_score", 0) >= 30]
        state.state = SearchState.SCORING

        logger.info(f"Scored {len(state.scored_jobs)} jobs with match score >=30")

        return state

    async def _ghost_detection_node(self, state: JobSearchState) -> JobSearchState:
        """Detect ghost jobs"""
        if not state.scored_jobs:
            return state

        logger.info(f"Detecting ghost jobs in {len(state.scored_jobs)} jobs")

        clean_jobs, suspicious_jobs = self.ghost_detector.flag_suspicious_jobs(
            state.scored_jobs
        )

        state.final_jobs = clean_jobs
        state.ghost_count = len(suspicious_jobs)
        state.state = SearchState.GHOST_DETECTION

        logger.info(f"Flagged {state.ghost_count} suspicious jobs")

        return state

    async def _finalize_node(self, state: JobSearchState) -> JobSearchState:
        """Finalize results"""
        state.total_jobs = len(state.final_jobs)
        state.state = SearchState.COMPLETE
        state.end_time = datetime.utcnow()

        duration = (state.end_time - state.start_time).total_seconds()

        logger.info(
            f"Job search complete: {state.total_jobs} jobs in {duration:.1f}s "
            f"(searched {len(state.platforms_searched)} platforms, "
            f"deduped {state.dedup_count}, flagged {state.ghost_count} ghosts)"
        )

        return state

    async def _error_node(self, state: JobSearchState) -> JobSearchState:
        """Handle errors"""
        state.state = SearchState.ERROR
        logger.error(f"Workflow error: {state.error}")
        return state

    async def run(self, input_data: JobSearchInput) -> dict:
        """Run job search and return results"""
        state = await self.execute(input_data)

        return {
            "success": state.state == SearchState.COMPLETE,
            "matches": state.final_jobs,
            "total_found": state.total_jobs,
            "platforms_searched": state.platforms_searched,
            "platforms_failed": state.platforms_failed,
            "deduplicatedCount": state.dedup_count,
            "ghost_count": state.ghost_count,
            "completedAt": state.end_time.isoformat() if state.end_time else None,
            "error": state.error,
        }
