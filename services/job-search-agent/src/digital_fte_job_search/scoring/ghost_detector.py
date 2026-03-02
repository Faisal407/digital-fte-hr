"""
Ghost job detection
Identify jobs that are unlikely to be real openings
"""

import json
import logging
from datetime import datetime, timedelta
from typing import Optional

logger = logging.getLogger(__name__)


class GhostJobDetector:
    """
    Detects ghost jobs (fake openings).
    Uses heuristics and Claude Haiku.
    """

    def __init__(self):
        from digital_fte_llm import claude_call, HAIKU
        self.claude_call = claude_call
        self.model = HAIKU

    async def is_ghost_job(
        self,
        title: str,
        company: str,
        posted_date: Optional[datetime],
        days_posted: int,
        application_count: int = 0,
        description: str = "",
    ) -> tuple[bool, float, list[str]]:
        """
        Determine if a job is a ghost job.

        Args:
            title: Job title
            company: Company name
            posted_date: When job was posted
            days_posted: How many days ago posted
            application_count: Number of applications received
            description: Job description

        Returns:
            Tuple of (is_ghost_job, confidence_0_to_1, reasons)
        """
        reasons: list[str] = []
        confidence = 0.0

        # Heuristic 1: Posted >30 days ago
        if days_posted > 30:
            reasons.append(f"Posted {days_posted} days ago (>30 day threshold)")
            confidence += 0.3

        # Heuristic 2: Zero applications (suspicious)
        if application_count == 0 and days_posted > 7:
            reasons.append("No applications after 7+ days (suspicious)")
            confidence += 0.2

        # Heuristic 3: Many similar roles (potential spam)
        if self._is_generic_role(title):
            reasons.append("Generic job title (potential spam posting)")
            confidence += 0.1

        # Heuristic 4: Check description quality
        if len(description) < 100:
            reasons.append("Very short job description (<100 chars)")
            confidence += 0.1

        # If high confidence already, return early
        if confidence >= 0.6:
            return confidence >= 0.7, confidence, reasons

        # Use Claude for detailed analysis
        try:
            is_ghost = await self._claude_check(
                title, company, days_posted, application_count, description
            )
            if is_ghost:
                reasons.append("Claude analysis: Likely ghost job")
                confidence = min(1.0, confidence + 0.3)
        except Exception as e:
            logger.warning(f"Claude ghost check failed: {e}")

        # Final decision
        is_ghost_job = confidence >= 0.6

        return is_ghost_job, confidence, reasons

    async def _claude_check(
        self,
        title: str,
        company: str,
        days_posted: int,
        application_count: int,
        description: str,
    ) -> bool:
        """Use Claude Haiku for ghost job analysis"""
        try:
            prompt = f"""Analyze if this is a ghost job (fake opening):

Job Title: {title}
Company: {company}
Days Posted: {days_posted}
Applications: {application_count}
Description: {description[:500]}

Ghost job indicators:
- Posted >30 days without updates
- Zero applications despite age
- Generic description with missing details
- Generic job title with no specifics
- Unusual salary/benefits claims

Return JSON with:
{{
  "is_ghost_job": true/false,
  "reasoning": "Brief explanation"
}}"""

            result = await self.claude_call(
                model=self.model,
                prompt=prompt,
                system_prompt="You are a ghost job detector. Respond with JSON only.",
                max_tokens=200,
                temperature=0.2,
            )

            if result.success:
                try:
                    data = json.loads(result.content)
                    return data.get("is_ghost_job", False)
                except json.JSONDecodeError:
                    return False

            return False

        except Exception as e:
            logger.error(f"Claude ghost check error: {e}")
            return False

    def _is_generic_role(self, title: str) -> bool:
        """Check if job title is suspiciously generic"""
        generic_keywords = [
            "work from home",
            "easy money",
            "quick cash",
            "no experience needed",
            "guaranteed income",
            "hiring immediately",
            "urgent",
            "assistant needed",
            "help needed",
            "call now",
        ]

        title_lower = title.lower()
        return any(keyword in title_lower for keyword in generic_keywords)

    def detect_reposting(
        self, jobs: list[dict], repost_window_days: int = 7
    ) -> dict[str, list[dict]]:
        """
        Detect jobs that are reposted frequently.

        Returns:
            Dict of {company_name: [reposted_jobs]}
        """
        reposted_by_company: dict[str, list[dict]] = {}

        for job in jobs:
            company = job.get("company", "")
            if not company:
                continue

            if company not in reposted_by_company:
                reposted_by_company[company] = []

            reposted_by_company[company].append(job)

        # Filter to only companies with multiple postings
        return {
            company: jobs
            for company, jobs in reposted_by_company.items()
            if len(jobs) > 1
        }

    def flag_suspicious_jobs(
        self, jobs: list[dict]
    ) -> tuple[list[dict], list[dict]]:
        """
        Flag suspicious jobs and return clean list.

        Returns:
            Tuple of (clean_jobs, suspicious_jobs)
        """
        clean_jobs = []
        suspicious_jobs = []

        for job in jobs:
            days_posted = self._calculate_days_posted(job.get("posted_date"))
            reason = None

            # Ghost job check
            if days_posted > 30:
                reason = "Ghost job: Posted >30 days"
            elif len(job.get("description", "")) < 50:
                reason = "Suspicious: Very short description"
            elif self._is_generic_role(job.get("title", "")):
                reason = "Suspicious: Generic title"

            if reason:
                job["suspension_reason"] = reason
                suspicious_jobs.append(job)
            else:
                clean_jobs.append(job)

        return clean_jobs, suspicious_jobs

    def _calculate_days_posted(self, posted_date: Optional[datetime]) -> int:
        """Calculate days since posting"""
        if not posted_date:
            return 0

        if isinstance(posted_date, str):
            try:
                posted_date = datetime.fromisoformat(posted_date.replace("Z", "+00:00"))
            except (ValueError, AttributeError):
                return 0

        now = datetime.utcnow()
        if posted_date.tzinfo:
            now = now.replace(tzinfo=posted_date.tzinfo)

        delta = now - posted_date
        return delta.days
