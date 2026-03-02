"""
ATS resume scorer
23-checkpoint scoring system for resume compatibility
"""

import json
import logging
from typing import Optional
from pydantic import BaseModel

logger = logging.getLogger(__name__)


class ATSCheckpoint(BaseModel):
    """Single ATS scoring checkpoint"""

    name: str  # Checkpoint name
    category: str  # formatting|content|keywords|structure|design
    status: str  # pass | fail | warning
    weight: float  # Contribution to final score
    details: str  # Explanation
    suggestion: Optional[str] = None


class ATSScore(BaseModel):
    """ATS scoring result"""

    overall_score: int  # 0-100
    level: str  # RED (<60), YELLOW (60-74), GREEN (75+)
    checkpoints: list[ATSCheckpoint]
    blockers: list[str]  # Must-fix issues
    warnings: list[str]  # Important improvements
    summary: str  # Overall assessment


class ATSScorer:
    """
    Score resume for ATS compatibility (23 checkpoints).
    """

    # 23 checkpoints
    CHECKPOINTS = [
        # FORMATTING (5 checkpoints)
        {
            "name": "Standard fonts",
            "category": "formatting",
            "weight": 0.05,
            "keywords": ["arial", "calibri", "helvetica", "times new roman"],
        },
        {
            "name": "Single column layout",
            "category": "formatting",
            "weight": 0.05,
            "keywords": ["table", "columns", "multi-column"],
        },
        {
            "name": "Standard margins",
            "category": "formatting",
            "weight": 0.03,
            "keywords": ["1 inch", "0.5 inch", "margins"],
        },
        {
            "name": "No headers/footers",
            "category": "formatting",
            "weight": 0.02,
            "keywords": ["header", "footer"],
        },
        {
            "name": "Consistent spacing",
            "category": "formatting",
            "weight": 0.02,
            "keywords": ["inconsistent", "spacing", "spacing"],
        },
        # STRUCTURE (5 checkpoints)
        {
            "name": "Clear section headers",
            "category": "structure",
            "weight": 0.08,
            "keywords": ["experience", "education", "skills"],
        },
        {
            "name": "Consistent date format",
            "category": "structure",
            "weight": 0.07,
            "keywords": ["date", "month/year", "january 2023"],
        },
        {
            "name": "Contact info at top",
            "category": "structure",
            "weight": 0.06,
            "keywords": ["email", "phone", "address"],
        },
        {
            "name": "Logical section order",
            "category": "structure",
            "weight": 0.05,
            "keywords": ["summary", "experience", "education"],
        },
        {
            "name": "No graphics/images",
            "category": "structure",
            "weight": 0.06,
            "keywords": ["image", "photo", "graphic"],
        },
        # CONTENT (6 checkpoints)
        {
            "name": "Action verbs used",
            "category": "content",
            "weight": 0.06,
            "keywords": ["led", "managed", "created", "achieved"],
        },
        {
            "name": "Quantified achievements",
            "category": "content",
            "weight": 0.08,
            "keywords": ["increased", "percentage", "number", "metric"],
        },
        {
            "name": "Specific accomplishments",
            "category": "content",
            "weight": 0.07,
            "keywords": ["project", "achieved", "result"],
        },
        {
            "name": "No spelling errors",
            "category": "content",
            "weight": 0.05,
            "keywords": ["spelling", "grammar"],
        },
        {
            "name": "Active voice preferred",
            "category": "content",
            "weight": 0.04,
            "keywords": ["was", "were", "being"],
        },
        {
            "name": "Concise descriptions",
            "category": "content",
            "weight": 0.03,
            "keywords": ["word_count", "length"],
        },
        # KEYWORDS (4 checkpoints)
        {
            "name": "Relevant skills listed",
            "category": "keywords",
            "weight": 0.08,
            "keywords": ["python", "javascript", "aws", "azure"],
        },
        {
            "name": "Industry keywords",
            "category": "keywords",
            "weight": 0.07,
            "keywords": ["agile", "devops", "leadership"],
        },
        {
            "name": "Job title matches",
            "category": "keywords",
            "weight": 0.06,
            "keywords": ["engineer", "manager", "analyst"],
        },
        {
            "name": "No keyword stuffing",
            "category": "keywords",
            "weight": 0.03,
            "keywords": ["repeated", "stuffing"],
        },
        # DESIGN (3 checkpoints)
        {
            "name": "Plain text compatible",
            "category": "design",
            "weight": 0.05,
            "keywords": ["special_char", "unicode"],
        },
        {
            "name": "Minimal formatting",
            "category": "design",
            "weight": 0.04,
            "keywords": ["bold", "italic", "colors"],
        },
        {
            "name": "Standard bullets only",
            "category": "design",
            "weight": 0.03,
            "keywords": ["bullet", "dash"],
        },
    ]

    def __init__(self):
        pass

    async def score(self, resume_text: str, job_description: str = None) -> ATSScore:
        """
        Score resume for ATS compatibility.

        Args:
            resume_text: Full resume text
            job_description: Optional job description for keyword matching

        Returns:
            ATSScore with 23 checkpoints
        """
        from digital_fte_llm import claude_call, HAIKU

        prompt = f"""Score this resume on 23 ATS compatibility checkpoints.

RESUME:
{resume_text[:2000]}

{f'TARGET JOB:' + job_description[:1000] if job_description else ''}

Evaluate each checkpoint (pass/fail/warning):

1. FORMATTING (5 checkpoints):
   - Uses standard fonts (Arial, Calibri, Helvetica, Times New Roman)
   - Single column layout (no tables/columns)
   - Standard margins (0.5-1 inch)
   - No headers/footers
   - Consistent spacing throughout

2. STRUCTURE (5 checkpoints):
   - Clear section headers (Experience, Education, Skills)
   - Consistent date format (MM/YYYY or Month Year)
   - Contact info at top (name, email, phone)
   - Logical section order
   - No graphics, images, or charts

3. CONTENT (6 checkpoints):
   - Action verbs used (Led, Managed, Created, Achieved)
   - Quantified achievements with numbers/metrics
   - Specific accomplishments, not generic descriptions
   - No spelling or grammar errors
   - Active voice preferred over passive
   - Concise, not overly wordy

4. KEYWORDS (4 checkpoints):
   - Relevant technical/professional skills listed
   - Industry-specific keywords present
   - Job titles match industry standards
   - No keyword stuffing or repetition

5. DESIGN (3 checkpoints):
   - Plain text compatible (no special Unicode)
   - Minimal formatting (bold/italic/colors okay but not excessive)
   - Standard bullet points only (-, •, *)

Return JSON:
{{
  "checkpoints": [
    {{
      "name": "checkpoint name",
      "category": "formatting|content|keywords|structure|design",
      "status": "pass|fail|warning",
      "weight": 0.05,
      "details": "explanation",
      "suggestion": "improvement if applicable"
    }}
  ],
  "blockers": ["issue 1", "issue 2"],
  "warnings": ["warning 1", "warning 2"],
  "summary": "Overall ATS assessment"
}}"""

        result = await claude_call(
            model=HAIKU,
            prompt=prompt,
            system_prompt="You are an ATS scoring expert. Be strict but fair. Score on the 23 checkpoints provided.",
            max_tokens=2500,
            temperature=0.2,
        )

        if not result.success:
            logger.error(f"ATS scoring failed: {result.error}")
            return self._error_score(result.error or "Scoring failed")

        try:
            data = json.loads(result.content)

            # Parse checkpoints
            checkpoints = []
            total_weight = 0.0
            score_sum = 0.0

            for cp in data.get("checkpoints", []):
                checkpoint = ATSCheckpoint(
                    name=cp["name"],
                    category=cp["category"],
                    status=cp["status"],
                    weight=cp.get("weight", 1.0),
                    details=cp["details"],
                    suggestion=cp.get("suggestion"),
                )
                checkpoints.append(checkpoint)

                total_weight += checkpoint.weight

                # Calculate points (pass=1, warning=0.5, fail=0)
                if checkpoint.status == "pass":
                    points = checkpoint.weight
                elif checkpoint.status == "warning":
                    points = checkpoint.weight * 0.5
                else:  # fail
                    points = 0

                score_sum += points

            # Calculate final score (0-100)
            final_score = int((score_sum / total_weight) * 100) if total_weight > 0 else 0
            final_score = max(0, min(100, final_score))  # Clamp 0-100

            # Determine level
            level = "GREEN" if final_score >= 75 else "YELLOW" if final_score >= 60 else "RED"

            return ATSScore(
                overall_score=final_score,
                level=level,
                checkpoints=checkpoints,
                blockers=data.get("blockers", []),
                warnings=data.get("warnings", []),
                summary=data.get("summary", ""),
            )

        except json.JSONDecodeError as e:
            logger.error(f"Failed to parse ATS score response: {e}")
            return self._error_score(f"Parse error: {str(e)}")

    def _error_score(self, error_msg: str) -> ATSScore:
        """Return error score"""
        return ATSScore(
            overall_score=50,
            level="YELLOW",
            checkpoints=[],
            blockers=["Scoring error: Unable to evaluate resume"],
            warnings=[error_msg],
            summary="Resume could not be scored. Please try again.",
        )

    def validate_score(self, score: ATSScore) -> tuple[bool, list[str]]:
        """
        Validate resume is exportable based on ATS score.

        Returns:
            Tuple of (can_export, messages)
        """
        can_export = True
        messages = []

        if score.level == "RED":
            can_export = False
            messages.append("❌ Score is RED (<60). Resume needs significant improvement before export.")
            messages.extend([f"  - {blocker}" for blocker in score.blockers[:3]])

        elif score.level == "YELLOW":
            can_export = True
            messages.append("⚠️ Score is YELLOW (60-74). Resume is acceptable but could be improved.")
            messages.extend([f"  - {warning}" for warning in score.warnings[:3]])

        else:  # GREEN
            messages.append("✅ Score is GREEN (75+). Resume is ATS-optimized and ready for export.")

        return can_export, messages
