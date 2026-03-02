"""
Job Search Agent - Main Entry Point
Callable as:
- Python script: python main.py
- SQS worker: Consumes from SQS queue
- API: HTTP endpoint wrapper
"""

import asyncio
import json
import logging
import os
from typing import Optional

from dotenv import load_dotenv

from digital_fte_job_search import JobSearchGraph, JobSearchInput

# Setup logging
logging.basicConfig(
    level=os.getenv("LOG_LEVEL", "INFO"),
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
)
logger = logging.getLogger(__name__)

load_dotenv()


async def search_jobs(
    user_id: str,
    target_roles: list[str],
    target_locations: list[str],
    target_industries: list[str],
    years_of_experience: int,
    skills: list[str],
    correlation_id: str = "local-test",
    salary_min: Optional[int] = None,
    salary_max: Optional[int] = None,
    limit: int = 20,
    platforms: Optional[list[str]] = None,
) -> dict:
    """
    Execute job search workflow.

    Args:
        user_id: User ID
        target_roles: Target job roles
        target_locations: Target locations
        target_industries: Target industries
        years_of_experience: Years of experience
        skills: User skills
        correlation_id: Correlation ID for tracking
        salary_min: Minimum salary
        salary_max: Maximum salary
        limit: Max jobs to return
        platforms: Specific platforms to search (all if None)

    Returns:
        Search results dict
    """
    logger.info(f"Starting job search for user {user_id}")

    # Create input
    search_input = JobSearchInput(
        user_id=user_id,
        correlation_id=correlation_id,
        target_roles=target_roles,
        target_locations=target_locations,
        target_industries=target_industries,
        years_of_experience=years_of_experience,
        skills=skills,
        salary_min=salary_min,
        salary_max=salary_max,
        limit=limit,
        platforms=platforms,
    )

    # Execute workflow
    graph = JobSearchGraph()
    results = await graph.run(search_input)

    return results


async def main():
    """Main entry point for local testing"""
    # Test search
    results = await search_jobs(
        user_id="test-user-123",
        target_roles=["Software Engineer", "Backend Developer"],
        target_locations=["San Francisco, CA", "New York, NY"],
        target_industries=["Technology", "Finance"],
        years_of_experience=5,
        skills=["Python", "JavaScript", "AWS", "PostgreSQL", "Docker"],
        salary_min=120000,
        salary_max=200000,
        limit=20,
    )

    # Print results
    print("\n" + "=" * 80)
    print("JOB SEARCH RESULTS")
    print("=" * 80)

    print(f"\nSuccess: {results['success']}")
    print(f"Total Found: {results['total_found']}")
    print(f"Platforms Searched: {results['platforms_searched']}")
    print(f"Dedup Count: {results['deduplicatedCount']}")
    print(f"Ghost Count: {results['ghost_count']}")

    if results["platforms_failed"]:
        print(f"\nFailed Platforms: {results['platforms_failed']}")

    if results["matches"]:
        print(f"\nTop 5 Matches:")
        for i, job in enumerate(results["matches"][:5], 1):
            score = job.get("match_score", 0)
            print(
                f"  {i}. {job.get('title')} at {job.get('company')} "
                f"({job.get('location')}) - Score: {score}"
            )

    print(f"\nCompleted: {results['completedAt']}")


if __name__ == "__main__":
    asyncio.run(main())
