"""
Six optimization sub-agents for resume improvement
Runs in parallel, then AuthenticityAgent runs last
"""

import json
import logging
from typing import Optional

from .base import BaseOptimizer, OptimizationResult, OptimizationChange

logger = logging.getLogger(__name__)


class LinguisticAgent(BaseOptimizer):
    """
    Linguistic optimization agent
    Fixes grammar, clarity, eliminates passive voice
    """

    def __init__(self):
        super().__init__("Linguistic Agent")

    async def optimize(self, resume_text: str, context: dict = None) -> OptimizationResult:
        """Optimize grammar, clarity, and voice"""
        from digital_fte_llm import claude_call, HAIKU

        prompt = f"""Review this resume for linguistic quality.

RESUME:
{resume_text}

Identify issues:
1. Grammar errors
2. Clarity problems (awkward phrasing)
3. Passive voice (convert to active)
4. Repetitive words/phrases
5. Typos or spelling errors

Return JSON with suggested changes:
{{
  "changes": [
    {{
      "original": "exact text from resume",
      "improved": "fixed version",
      "issue": "grammar|clarity|passive_voice|repetition|typo",
      "explanation": "Why this fix"
    }}
  ],
  "summary": "Overall assessment"
}}"""

        result = await claude_call(
            model=HAIKU,
            prompt=prompt,
            system_prompt="You are a resume grammar and clarity expert.",
            max_tokens=2000,
            temperature=0.3,
        )

        if not result.success:
            return OptimizationResult(
                agent_name=self.agent_name,
                changes=[],
                summary="Grammar check failed",
                warnings=[result.error],
            )

        try:
            data = json.loads(result.content)
            changes = []

            for change in data.get("changes", []):
                changes.append(
                    OptimizationChange(
                        field="general",
                        original=change["original"],
                        improved=change["improved"],
                        rationale=change["explanation"],
                        impact="medium",
                        agent=self.agent_name,
                    )
                )

            return OptimizationResult(
                agent_name=self.agent_name,
                changes=changes,
                summary=data.get("summary", ""),
            )
        except json.JSONDecodeError:
            return OptimizationResult(
                agent_name=self.agent_name,
                changes=[],
                summary="Failed to parse response",
                warnings=["JSON parsing error"],
            )


class ATSKeywordAgent(BaseOptimizer):
    """
    ATS Keyword optimization agent
    Analyzes job description and suggests keywords to add
    """

    def __init__(self):
        super().__init__("ATS Keyword Agent")

    async def optimize(self, resume_text: str, context: dict = None) -> OptimizationResult:
        """Suggest keywords from job description"""
        from digital_fte_llm import claude_call, HAIKU

        job_description = context.get("job_description", "") if context else ""

        prompt = f"""Analyze ATS keyword gaps between resume and job.

JOB DESCRIPTION:
{job_description[:2000]}

RESUME:
{resume_text[:2000]}

Tasks:
1. Extract key skills/keywords from job
2. Find which are missing from resume
3. Suggest where to add each keyword

Return JSON:
{{
  "missing_keywords": [
    {{
      "keyword": "skill name",
      "frequency_in_job": 2,
      "suggested_section": "skills|experience|summary",
      "how_to_add": "suggestion"
    }}
  ],
  "keywords_already_present": ["Python", "AWS"],
  "summary": "Overall ATS assessment"
}}"""

        result = await claude_call(
            model=HAIKU,
            prompt=prompt,
            system_prompt="You are an ATS optimization expert.",
            max_tokens=1500,
            temperature=0.2,
        )

        if not result.success:
            return OptimizationResult(
                agent_name=self.agent_name,
                changes=[],
                summary="ATS analysis failed",
                warnings=[result.error],
            )

        try:
            data = json.loads(result.content)
            return OptimizationResult(
                agent_name=self.agent_name,
                changes=[],  # Keywords handled differently (not text replacements)
                summary=data.get("summary", ""),
                warnings=[
                    f"Add keyword: {kw['keyword']}" for kw in data.get("missing_keywords", [])
                ],
            )
        except json.JSONDecodeError:
            return OptimizationResult(
                agent_name=self.agent_name,
                changes=[],
                summary="Failed to parse response",
                warnings=["JSON parsing error"],
            )


class ImpactAgent(BaseOptimizer):
    """
    Impact optimization agent
    Transforms achievements using CAR/STAR framework
    (Context-Action-Result / Situation-Task-Action-Result)
    """

    def __init__(self):
        super().__init__("Impact Agent")

    async def optimize(self, resume_text: str, context: dict = None) -> OptimizationResult:
        """Enhance achievements with metrics and impact"""
        from digital_fte_llm import claude_call, HAIKU

        prompt = f"""Enhance resume achievements using CAR/STAR framework.

RESUME:
{resume_text}

For each achievement/responsibility:
1. Add quantified metrics where possible
2. Transform to emphasize impact
3. Follow STAR format: Situation-Task-Action-Result

Return JSON:
{{
  "enhanced_achievements": [
    {{
      "original": "exact text",
      "enhanced": "CAR/STAR version with metrics",
      "metrics_added": ["increased sales by 25%", ...],
      "impact_level": "high|medium|low"
    }}
  ],
  "summary": "Enhancement summary"
}}"""

        result = await claude_call(
            model=HAIKU,
            prompt=prompt,
            system_prompt="You are a resume achievement optimization expert using CAR/STAR framework.",
            max_tokens=2000,
            temperature=0.3,
        )

        if not result.success:
            return OptimizationResult(
                agent_name=self.agent_name,
                changes=[],
                summary="Impact analysis failed",
                warnings=[result.error],
            )

        try:
            data = json.loads(result.content)
            changes = []

            for item in data.get("enhanced_achievements", []):
                changes.append(
                    OptimizationChange(
                        field="achievements",
                        original=item["original"],
                        improved=item["enhanced"],
                        rationale=f"Added metrics and STAR framework: {', '.join(item.get('metrics_added', []))}",
                        impact=item.get("impact_level", "medium"),
                        agent=self.agent_name,
                    )
                )

            return OptimizationResult(
                agent_name=self.agent_name,
                changes=changes,
                summary=data.get("summary", ""),
            )
        except json.JSONDecodeError:
            return OptimizationResult(
                agent_name=self.agent_name,
                changes=[],
                summary="Failed to parse response",
                warnings=["JSON parsing error"],
            )


class CustomizationAgent(BaseOptimizer):
    """
    Customization agent
    Tailors resume for specific job/company
    """

    def __init__(self):
        super().__init__("Customization Agent")

    async def optimize(self, resume_text: str, context: dict = None) -> OptimizationResult:
        """Tailor resume for target job"""
        from digital_fte_llm import claude_call, HAIKU

        job_description = context.get("job_description", "") if context else ""
        target_role = context.get("target_role", "") if context else ""

        prompt = f"""Tailor resume for this specific job.

TARGET ROLE: {target_role}

JOB DESCRIPTION:
{job_description[:1500]}

RESUME:
{resume_text[:1500]}

Suggest changes to:
1. Highlight relevant experience
2. Reorder achievements by relevance
3. Emphasize matching skills
4. Adjust language to match job posting

Return JSON:
{{
  "tailoring_suggestions": [
    {{
      "section": "experience|skills|summary",
      "current": "current text",
      "suggested": "tailored version",
      "relevance": "why this matters for the job"
    }}
  ],
  "priority_changes": ["skill 1", "achievement 2"],
  "summary": "Tailoring strategy"
}}"""

        result = await claude_call(
            model=HAIKU,
            prompt=prompt,
            system_prompt="You are a resume customization expert.",
            max_tokens=1500,
            temperature=0.3,
        )

        if not result.success:
            return OptimizationResult(
                agent_name=self.agent_name,
                changes=[],
                summary="Customization failed",
                warnings=[result.error],
            )

        try:
            data = json.loads(result.content)
            changes = []

            for suggestion in data.get("tailoring_suggestions", []):
                changes.append(
                    OptimizationChange(
                        field=suggestion["section"],
                        original=suggestion["current"],
                        improved=suggestion["suggested"],
                        rationale=suggestion["relevance"],
                        impact="high",
                        agent=self.agent_name,
                    )
                )

            return OptimizationResult(
                agent_name=self.agent_name,
                changes=changes,
                summary=data.get("summary", ""),
                warnings=data.get("priority_changes", []),
            )
        except json.JSONDecodeError:
            return OptimizationResult(
                agent_name=self.agent_name,
                changes=[],
                summary="Failed to parse response",
                warnings=["JSON parsing error"],
            )


class FormattingAgent(BaseOptimizer):
    """
    Formatting agent
    Ensures ATS-safe formatting (no tables, graphics, special chars)
    """

    def __init__(self):
        super().__init__("Formatting Agent")

    async def optimize(self, resume_text: str, context: dict = None) -> OptimizationResult:
        """Check and fix ATS formatting issues"""
        from digital_fte_llm import claude_call, HAIKU

        prompt = f"""Audit resume for ATS formatting issues.

RESUME:
{resume_text}

Check for:
1. Inconsistent date formatting
2. Special characters that may not parse
3. Missing section headers
4. Bullet point inconsistencies
5. Line breaks and spacing issues

Return JSON:
{{
  "formatting_issues": [
    {{
      "issue": "issue description",
      "location": "where in resume",
      "current": "current format",
      "recommended": "ATS-safe format",
      "severity": "high|medium|low"
    }}
  ],
  "ats_score_impact": "high|medium|low",
  "summary": "Formatting assessment"
}}"""

        result = await claude_call(
            model=HAIKU,
            prompt=prompt,
            system_prompt="You are an ATS formatting expert.",
            max_tokens=1500,
            temperature=0.2,
        )

        if not result.success:
            return OptimizationResult(
                agent_name=self.agent_name,
                changes=[],
                summary="Formatting check failed",
                warnings=[result.error],
            )

        try:
            data = json.loads(result.content)
            changes = []

            for issue in data.get("formatting_issues", []):
                changes.append(
                    OptimizationChange(
                        field=issue["location"],
                        original=issue["current"],
                        improved=issue["recommended"],
                        rationale=f"ATS formatting: {issue['issue']}",
                        impact=issue.get("severity", "medium"),
                        agent=self.agent_name,
                    )
                )

            return OptimizationResult(
                agent_name=self.agent_name,
                changes=changes,
                summary=data.get("summary", ""),
                warnings=[
                    f"ATS impact: {data.get('ats_score_impact', 'unknown')}"
                ],
            )
        except json.JSONDecodeError:
            return OptimizationResult(
                agent_name=self.agent_name,
                changes=[],
                summary="Failed to parse response",
                warnings=["JSON parsing error"],
            )


class AuthenticityAgent(BaseOptimizer):
    """
    Authenticity agent (runs LAST)
    Preserves user voice, removes AI-generated phrases
    Validates that changes maintain authenticity
    """

    def __init__(self):
        super().__init__("Authenticity Agent")

    async def optimize(self, resume_text: str, context: dict = None) -> OptimizationResult:
        """
        Review for authenticity and AI-detection.
        Runs AFTER all other agents.
        """
        from digital_fte_llm import claude_call, HAIKU

        prompt = f"""Review resume for authenticity and AI-generated content.

RESUME:
{resume_text}

Check for:
1. Over-polished language that sounds AI-generated
2. Clichés (e.g., "synergize", "leverage")
3. Loss of personal voice/personality
4. Unrealistic achievements or claims
5. Generic descriptions instead of specific examples

Return JSON:
{{
  "authenticity_concerns": [
    {{
      "text": "suspicious text",
      "concern": "AI-generated|cliché|generic|unrealistic",
      "suggestion": "how to make more authentic",
      "severity": "high|medium|low"
    }}
  ],
  "authenticity_score": 0-100,
  "summary": "Authenticity assessment",
  "recommendations": ["recommendation 1", ...]
}}"""

        result = await claude_call(
            model=HAIKU,
            prompt=prompt,
            system_prompt="You are an authenticity expert. Detect AI-generated content and clichés.",
            max_tokens=1500,
            temperature=0.2,
        )

        if not result.success:
            return OptimizationResult(
                agent_name=self.agent_name,
                changes=[],
                summary="Authenticity check failed",
                warnings=[result.error],
            )

        try:
            data = json.loads(result.content)
            changes = []

            for concern in data.get("authenticity_concerns", []):
                changes.append(
                    OptimizationChange(
                        field="general",
                        original=concern["text"],
                        improved=concern["suggestion"],
                        rationale=f"Authenticity: {concern['concern']}",
                        impact=concern.get("severity", "medium"),
                        agent=self.agent_name,
                    )
                )

            return OptimizationResult(
                agent_name=self.agent_name,
                changes=changes,
                summary=data.get("summary", ""),
                warnings=[
                    f"Authenticity score: {data.get('authenticity_score', 0)}/100",
                    *data.get("recommendations", []),
                ],
            )
        except json.JSONDecodeError:
            return OptimizationResult(
                agent_name=self.agent_name,
                changes=[],
                summary="Failed to parse response",
                warnings=["JSON parsing error"],
            )
