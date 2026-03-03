"""
Job deduplication logic
Identify duplicate jobs across platforms using Claude Haiku
"""

import json
import logging
from dataclasses import dataclass
from typing import Optional

logger = logging.getLogger(__name__)


@dataclass
class DedupeGroup:
    """Group of duplicate jobs"""

    group_id: str
    job_ids: list[str]
    keep_job_id: str
    reason: str
    platforms: list[str]


class JobDeduplicator:
    """
    Deduplicates job listings across platforms.
    Uses Claude Haiku for semantic matching (fast & cheap).
    """

    def __init__(self):
        from digital_fte_llm import claude_call, HAIKU
        self.claude_call = claude_call
        self.model = HAIKU

    async def deduplicate(
        self, jobs: list[dict]
    ) -> tuple[list[dict], list[DedupeGroup], int]:
        """
        Deduplicate job listings across platforms.

        Args:
            jobs: List of job dicts with id, title, company, location, platform

        Returns:
            Tuple of (unique_jobs, dedup_groups, dedup_count)
        """
        if len(jobs) <= 1:
            return jobs, [], 0

        unique_jobs = []
        dedup_groups: list[DedupeGroup] = []
        seen_ids = set()
        dedup_count = 0

        # Group jobs by company + title (fast pre-filtering)
        job_groups: dict[str, list[dict]] = {}
        for job in jobs:
            key = f"{job.get('company', '').lower()}#{job.get('title', '').lower()}"
            if key not in job_groups:
                job_groups[key] = []
            job_groups[key].append(job)

        # Analyze each group for duplicates
        for group_key, group_jobs in job_groups.items():
            if len(group_jobs) == 1:
                # Single job, not a duplicate
                job = group_jobs[0]
                if job["id"] not in seen_ids:
                    unique_jobs.append(job)
                    seen_ids.add(job["id"])
            else:
                # Multiple jobs - need to check for duplicates
                is_duplicate, keep_id, reason = await self._check_duplicates(group_jobs)

                if is_duplicate:
                    # Mark as dedup group
                    job_ids = [j["id"] for j in group_jobs]
                    dedup_groups.append(
                        DedupeGroup(
                            group_id=f"dedup-{len(dedup_groups)}",
                            job_ids=job_ids,
                            keep_job_id=keep_id,
                            reason=reason,
                            platforms=[j.get("platform", "") for j in group_jobs],
                        )
                    )

                    dedup_count += len(job_ids) - 1

                    # Add only the kept job
                    if keep_id not in seen_ids:
                        keep_job = next(j for j in group_jobs if j["id"] == keep_id)
                        unique_jobs.append(keep_job)
                        seen_ids.add(keep_id)
                else:
                    # Not duplicates, add all
                    for job in group_jobs:
                        if job["id"] not in seen_ids:
                            unique_jobs.append(job)
                            seen_ids.add(job["id"])

        return unique_jobs, dedup_groups, dedup_count

    async def _check_duplicates(self, jobs: list[dict]) -> tuple[bool, str, str]:
        """
        Check if jobs in a group are duplicates.

        Returns:
            Tuple of (is_duplicate, keep_job_id, reason)
        """
        if len(jobs) < 2:
            return False, jobs[0]["id"], "Single job"

        try:
            # Build comparison prompt
            job_details = []
            for job in jobs:
                job_details.append(
                    f"- Job ID: {job['id']}\n  Platform: {job.get('platform', 'unknown')}\n"
                    f"  Posted: {job.get('posted_date', 'unknown')}\n"
                    f"  URL: {job.get('platform_url', 'unknown')}"
                )

            prompt = f"""Analyze these job postings and determine if they are duplicates.

Jobs to compare:
{chr(10).join(job_details)}

Are these the same job posted on different platforms?
Consider:
1. Same company AND same role (title match >80%)
2. Same location (exact or within 25 miles)
3. Posted within 7 days of each other

Return JSON:
{{
  "is_duplicate": true/false,
  "keep_job_id": "job_id_to_keep",
  "reason": "Explanation"
}}

Keep the job that was posted first (most authoritative source)."""

            result = await self.claude_call(
                model=self.model,
                prompt=prompt,
                system_prompt="You are a job deduplication system. Analyze and respond with JSON only.",
                max_tokens=300,
                temperature=0.1,
            )

            if not result.success:
                logger.warning(f"Dedup check failed: {result.error}")
                return False, jobs[0]["id"], "Check failed"

            try:
                data = json.loads(result.content)
                return (
                    data.get("is_duplicate", False),
                    data.get("keep_job_id", jobs[0]["id"]),
                    data.get("reason", "Duplicate detected"),
                )
            except json.JSONDecodeError:
                logger.warning(f"Failed to parse dedup response: {result.content}")
                return False, jobs[0]["id"], "Parse error"

        except Exception as e:
            logger.error(f"Dedup check error: {e}")
            return False, jobs[0]["id"], "Error"

    def simple_deduplicate(self, jobs: list[dict]) -> tuple[list[dict], int]:
        """
        Fast deduplication without LLM (for development/testing).
        Uses simple heuristics.
        """
        unique_jobs = []
        seen_signatures = set()
        dedup_count = 0

        for job in jobs:
            # Create signature: company + title (normalized)
            signature = (
                job.get("company", "").lower().strip(),
                job.get("title", "").lower().strip(),
                job.get("location", "").lower().strip(),
            )

            if signature not in seen_signatures:
                unique_jobs.append(job)
                seen_signatures.add(signature)
            else:
                dedup_count += 1

        return unique_jobs, dedup_count
