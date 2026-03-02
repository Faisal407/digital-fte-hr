"""
Job matching scorer
Uses Claude Haiku for fast, cheap semantic matching
"""

import json
import logging
from dataclasses import dataclass
from typing import Optional
from pydantic import BaseModel

logger = logging.getLogger(__name__)


@dataclass
class UserProfile:
    """User profile for job matching"""

    user_id: str
    target_roles: list[str]
    target_locations: list[str]
    target_industries: list[str]
    years_of_experience: int
    skills: list[str]
    salary_min: Optional[int] = None
    salary_max: Optional[int] = None


class MatchScore(BaseModel):
    """Job match score"""

    semantic_score: int  # 0-100, overall fit
    skills_match: int  # 0-100, skills overlap
    role_match: int  # 0-100, role title match
    location_match: int  # 0-100, location match
    overall_score: int  # 0-100, weighted average
    reasoning: str


class JobMatcher:
    """
    Score jobs against user profile using Claude Haiku.
    Fast and cheap - perfect for batch scoring.
    """

    def __init__(self):
        # Lazy import to avoid circular dependency
        from digital_fte_llm import claude_call, HAIKU
        self.claude_call = claude_call
        self.model = HAIKU

    async def score_job(
        self,
        job_title: str,
        job_description: str,
        job_company: str,
        job_location: str,
        user_profile: UserProfile,
    ) -> Optional[MatchScore]:
        """
        Score a job against user profile using Claude Haiku.

        Args:
            job_title: Job title
            job_description: Full job description
            job_company: Company name
            job_location: Job location
            user_profile: User's profile

        Returns:
            MatchScore or None if scoring fails
        """
        try:
            prompt = self._build_scoring_prompt(
                job_title=job_title,
                job_description=job_description,
                job_company=job_company,
                job_location=job_location,
                user_profile=user_profile,
            )

            system_prompt = """You are a precise job matching algorithm. Score jobs against user profiles.

Your task: Analyze the job and user profile, then return a JSON object with:
- semantic_score: 0-100, overall fit between job and user
- skills_match: 0-100, overlap of required vs user skills
- role_match: 0-100, how closely job title matches target roles
- location_match: 0-100, location preference match
- overall_score: 0-100, weighted average (40% semantic, 30% skills, 15% role, 15% location)
- reasoning: Brief explanation

IMPORTANT: Always return valid JSON only, no other text."""

            result = await self.claude_call(
                model=self.model,
                prompt=prompt,
                system_prompt=system_prompt,
                max_tokens=500,
                temperature=0.2,
            )

            if not result.success:
                logger.error(f"Claude call failed: {result.error}")
                return None

            # Parse JSON response
            try:
                score_data = json.loads(result.content)
                return MatchScore(**score_data)
            except (json.JSONDecodeError, ValueError) as e:
                logger.error(f"Failed to parse score JSON: {e}\nContent: {result.content}")
                return None

        except Exception as e:
            logger.error(f"Job scoring error: {e}")
            return None

    def _build_scoring_prompt(
        self,
        job_title: str,
        job_description: str,
        job_company: str,
        job_location: str,
        user_profile: UserProfile,
    ) -> str:
        """Build scoring prompt"""
        return f"""Analyze this job against the user's profile and provide match scores.

**USER PROFILE:**
- Target Roles: {', '.join(user_profile.target_roles)}
- Target Locations: {', '.join(user_profile.target_locations)}
- Target Industries: {', '.join(user_profile.target_industries)}
- Years of Experience: {user_profile.years_of_experience}
- Skills: {', '.join(user_profile.skills)}
- Salary Range: ${user_profile.salary_min:,} - ${user_profile.salary_max:,} per year

**JOB POSTING:**
- Title: {job_title}
- Company: {job_company}
- Location: {job_location}
- Description: {job_description[:1000]}

Evaluate:
1. How well does the overall job fit the user's career goals?
2. What percentage of required skills does the user have?
3. How closely does the job title match target roles?
4. Does the location match preferences?

Return valid JSON with scores (0-100) and brief reasoning."""

    async def score_jobs(
        self,
        jobs: list[dict],
        user_profile: UserProfile,
    ) -> list[dict]:
        """
        Score multiple jobs (batch scoring).

        Args:
            jobs: List of job data dicts
            user_profile: User profile

        Returns:
            Jobs with scores added
        """
        scored_jobs = []

        for job in jobs:
            score = await self.score_job(
                job_title=job.get("title", ""),
                job_description=job.get("description", ""),
                job_company=job.get("company", ""),
                job_location=job.get("location", ""),
                user_profile=user_profile,
            )

            if score:
                job["match_score"] = score.overall_score
                job["score_breakdown"] = {
                    "semantic_score": score.semantic_score,
                    "skills_match": score.skills_match,
                    "role_match": score.role_match,
                    "location_match": score.location_match,
                }
                scored_jobs.append(job)
            else:
                # If scoring fails, assign neutral score
                job["match_score"] = 50
                scored_jobs.append(job)

        # Sort by score descending
        scored_jobs.sort(key=lambda x: x.get("match_score", 0), reverse=True)

        return scored_jobs
