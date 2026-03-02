---
name: ats-scorer
description: Implements the Digital FTE 23-checkpoint ATS scoring system for resume evaluation. Use when building or extending the ATS scorer, generating score reports, implementing checkpoint logic, or evaluating a resume against a job description. Knows all 23 checkpoint definitions, weights, scoring rubrics, and grade thresholds (RED <60, YELLOW 60-74, GREEN 75+).
---

# ATS Scorer Skill — Digital FTE 23-Checkpoint System

## Grade Thresholds

| Score | Grade | Action |
|---|---|---|
| 0 – 59 | 🔴 RED | Block PDF export. Show mandatory optimization prompt. |
| 60 – 74 | 🟡 YELLOW | Warn user. Allow export with caution notice. |
| 75 – 100 | 🟢 GREEN | Allow export. Show congratulations message. |

## The 23 Checkpoints (Complete Authoritative List)

### Section 1: Format & Parseability (Checkpoints 1–6, Weight: 25%)

| # | Checkpoint | Max Score | Pass Condition |
|---|---|---|---|
| 1 | Clean ATS parseable format | 10 | No tables, text boxes, headers/footers, or multi-column layouts |
| 2 | Standard section headings | 8 | Work Experience, Education, Skills — exact label match |
| 3 | Consistent date formatting | 7 | All dates in `MMM YYYY` or `MM/YYYY` — no mixing |
| 4 | No images or graphics | 8 | Zero embedded images, logos, icons, or infographic charts |
| 5 | Readable font and size | 7 | Body: 10-12pt; Headings: 12-14pt; standard fonts only |
| 6 | Single-column layout | 10 | Full single column — no side panels, no LinkedIn-style sidebars |

### Section 2: Contact & Identity (Checkpoints 7–9, Weight: 10%)

| # | Checkpoint | Max Score | Pass Condition |
|---|---|---|---|
| 7 | Complete contact info | 10 | Name, email, phone, LinkedIn URL all present |
| 8 | Professional email address | 8 | No hotmail/yahoo/aol, no numbers like john123@, domain matches name |
| 9 | Location present | 7 | City + Country minimum (or "Remote" explicit) |

### Section 3: Keyword Optimization (Checkpoints 10–14, Weight: 30%)

| # | Checkpoint | Max Score | Pass Condition |
|---|---|---|---|
| 10 | Job title keyword match | 10 | Target job title appears verbatim in resume headline or summary |
| 11 | Hard skills match rate | 10 | ≥70% of JD hard skills found in resume (exact or synonym) |
| 12 | Soft skills presence | 7 | At least 5 JD soft skills represented in experience bullets |
| 13 | Industry terminology | 8 | Domain jargon matches JD vocabulary (e.g. "KPI", "SDLC", "SLA") |
| 14 | No keyword stuffing | 8 | Keyword density ≤ 3% — no spam repetition |

### Section 4: Work Experience (Checkpoints 15–18, Weight: 20%)

| # | Checkpoint | Max Score | Pass Condition |
|---|---|---|---|
| 15 | Impact-driven bullet points | 10 | ≥60% of bullets contain quantified achievements (numbers, %, $, #) |
| 16 | Relevant experience recency | 8 | Most recent 3 roles cover ≥80% of required experience |
| 17 | Employment gap disclosure | 7 | Gaps >6 months explained or bridged with freelance/education |
| 18 | Experience years match | 8 | Total YOE meets minimum JD requirement (±20% tolerance) |

### Section 5: Education & Credentials (Checkpoints 19–21, Weight: 10%)

| # | Checkpoint | Max Score | Pass Condition |
|---|---|---|---|
| 19 | Education requirement met | 10 | Degree level matches JD minimum (or equivalent experience noted) |
| 20 | Certifications listed | 7 | Relevant certifications from JD appear with issuer and date |
| 21 | GPA included if required | 6 | Present when JD explicitly asks for it (recent graduates) |

### Section 6: Authenticity & Quality (Checkpoints 22–23, Weight: 5%)

| # | Checkpoint | Max Score | Pass Condition |
|---|---|---|---|
| 22 | No grammar or spelling errors | 10 | Zero detected errors in entire document |
| 23 | Consistent first-person voice | 8 | No first-person pronouns ("I", "my") — implied subject throughout |

## Scorer Implementation

```python
# services/resume-builder-agent/scoring/ats_scorer.py
from anthropic import Anthropic
from dataclasses import dataclass
from typing import Optional
from ..lib.prompts import load_prompt
from ..lib.logger import logger

client = Anthropic()

@dataclass
class CheckpointResult:
    id: int
    name: str
    passed: bool
    score: float        # 0 to max_score
    max_score: float
    feedback: str
    suggestions: list[str]

@dataclass
class ATSScoreResult:
    overall: int            # 0-100
    grade: str              # 'red' | 'yellow' | 'green'
    can_export: bool
    checkpoints: list[CheckpointResult]
    section_scores: dict[str, float]
    top_issues: list[str]
    recommendations: list[str]

CHECKPOINT_WEIGHTS = {
    "format":        0.25,
    "contact":       0.10,
    "keywords":      0.30,
    "experience":    0.20,
    "education":     0.10,
    "authenticity":  0.05,
}

SECTION_CHECKPOINTS = {
    "format":       [1, 2, 3, 4, 5, 6],
    "contact":      [7, 8, 9],
    "keywords":     [10, 11, 12, 13, 14],
    "experience":   [15, 16, 17, 18],
    "education":    [19, 20, 21],
    "authenticity": [22, 23],
}

MAX_SCORES = {
    1: 10, 2: 8, 3: 7, 4: 8, 5: 7, 6: 10,
    7: 10, 8: 8, 9: 7,
    10: 10, 11: 10, 12: 7, 13: 8, 14: 8,
    15: 10, 16: 8, 17: 7, 18: 8,
    19: 10, 20: 7, 21: 6,
    22: 10, 23: 8,
}

async def score_resume(
    resume_text: str,
    job_description: Optional[str] = None,
) -> ATSScoreResult:
    """Run full 23-checkpoint ATS evaluation on a resume."""

    prompt = load_prompt("scoring/ats_full_eval.md").render(
        resume=resume_text,
        job_description=job_description or "General professional resume",
        checkpoints=_format_checkpoint_instructions(),
    )

    # Use Sonnet for nuanced ATS analysis (not Haiku)
    response = client.messages.create(
        model="claude-sonnet-4-6",
        max_tokens=4000,
        messages=[{"role": "user", "content": prompt}],
    )

    raw = response.content[0].text
    checkpoints = _parse_checkpoint_results(raw)
    return _compute_final_score(checkpoints)


def _compute_final_score(checkpoints: list[CheckpointResult]) -> ATSScoreResult:
    """Aggregate 23 checkpoint results into final weighted score."""

    # Section scores
    section_scores = {}
    for section, cp_ids in SECTION_CHECKPOINTS.items():
        section_cps = [c for c in checkpoints if c.id in cp_ids]
        max_possible = sum(MAX_SCORES[cp.id] for cp in section_cps)
        actual = sum(cp.score for cp in section_cps)
        section_scores[section] = (actual / max_possible * 100) if max_possible > 0 else 0

    # Weighted overall
    overall = sum(
        section_scores[section] * CHECKPOINT_WEIGHTS[section]
        for section in CHECKPOINT_WEIGHTS
    )
    overall = round(overall)
    overall = max(0, min(100, overall))

    grade = "green" if overall >= 75 else "yellow" if overall >= 60 else "red"

    # Top 5 issues (failed checkpoints with highest weight)
    failed = sorted(
        [c for c in checkpoints if not c.passed],
        key=lambda c: MAX_SCORES[c.id],
        reverse=True,
    )
    top_issues = [c.feedback for c in failed[:5]]
    recommendations = [suggestion for c in failed[:3] for suggestion in c.suggestions][:10]

    return ATSScoreResult(
        overall=overall,
        grade=grade,
        can_export=overall >= 60,
        checkpoints=checkpoints,
        section_scores=section_scores,
        top_issues=top_issues,
        recommendations=recommendations,
    )
```

## ATS Score Prompt Template

Save at: `prompts/scoring/ats_full_eval.md`

```markdown
You are an expert ATS (Applicant Tracking System) evaluator.
Evaluate the following resume against these 23 checkpoints.
For each checkpoint, respond with:
- id: checkpoint number (1-23)
- passed: true or false
- score: numeric score (0 to max_score shown below)
- feedback: one sentence explaining the result
- suggestions: 1-3 specific improvement actions (only if not passed)

Resume to evaluate:
{{ resume }}

Job description (if available):
{{ job_description }}

Checkpoint definitions and max scores:
{{ checkpoints }}

Respond ONLY with valid JSON array of checkpoint results. No preamble, no markdown.
```

## Rules

- ATS scorer ALWAYS uses `claude-sonnet-4-6` — never Haiku for this task
- Score must ALWAYS be recomputed after any optimization — never use cached score
- If `can_export=False` (score < 60), the frontend MUST block the Export button — backend enforces too
- Never modify checkpoint IDs or weights without updating both frontend color logic and backend scorer
- All 23 checkpoints must always be evaluated — never skip checkpoints even if JD is unavailable
