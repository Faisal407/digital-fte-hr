---
name: resume-optimizer
description: Implements the Digital FTE 6-sub-agent parallel resume optimization pipeline. Use when building the resume optimization flow, individual sub-agents, the diff review system, or the authenticity checker. Knows the exact order of sub-agents, what each one does, and the non-negotiable rule that AuthenticityAgent always runs last.
---

# Resume Optimizer Skill — Digital FTE 6-Sub-Agent Pipeline

## Pipeline Overview

User submits resume → 5 sub-agents run in PARALLEL → AuthenticityAgent runs LAST → ATS rescore → User reviews diff → Accept/Reject

```
                    ┌──────────────────┐
                    │  Original Resume  │
                    └────────┬─────────┘
                             │  Fan-out (parallel)
          ┌──────────────────┼────────────────────────┐
          ▼                  ▼           ▼             ▼            ▼
  LinguisticAgent   ATSKeywordAgent  ImpactAgent  CustomizationAgent  FormattingAgent
  (grammar, style)  (keyword gaps)   (quantify)   (JD tailoring)      (structure)
          │                  │           │             │               │
          └──────────────────┴─────┬─────┴─────────────┘
                                   ▼  Merge all suggestions
                          AuthenticityAgent  ← ALWAYS LAST
                          (removes AI-sounding language,
                           preserves user's voice)
                                   │
                                   ▼
                             ATS Rescore
                                   │
                                   ▼
                           User Reviews Diff
                           (Accept / Reject / Edit)
```

## Sub-Agent Definitions

### 1. LinguisticAgent — Grammar & Style

```python
# agents/resume_optimizer/sub_agents/linguistic_agent.py
SYSTEM_PROMPT_FILE = "prompts/optimization/linguistic.md"
MODEL = "claude-sonnet-4-6"

# What it does:
# - Fix grammar and spelling errors
# - Ensure consistent tense (past for past roles, present for current)
# - Remove passive voice (replace "was responsible for" with action verbs)
# - Standardize punctuation (no periods at end of bullets, consistent colon usage)
# - Flag overly long bullets (>2 lines) for splitting
#
# What it MUST NOT do:
# - Change meaning of any achievement
# - Remove content
# - Add new claims not in original
```

### 2. ATSKeywordAgent — Keyword Gap Analysis

```python
# agents/resume_optimizer/sub_agents/ats_keyword_agent.py
SYSTEM_PROMPT_FILE = "prompts/optimization/ats_keywords.md"
MODEL = "claude-sonnet-4-6"

# What it does:
# - Extract all keywords from target job description
# - Identify which keywords are missing from resume
# - Suggest natural insertion points for missing keywords
# - Detect synonyms and expand vocabulary (e.g. "team lead" ↔ "people manager")
# - Prioritize high-frequency JD keywords
#
# Keyword categories to handle:
# - Technical skills: tools, languages, frameworks, platforms
# - Soft skills: leadership, communication, collaboration
# - Industry terms: domain-specific vocabulary
# - Certifications: mentioned but not held yet → don't fabricate
# - Action verbs: replace weak verbs with power verbs from approved list
```

### 3. ImpactAgent — Quantification & Achievement Amplification

```python
# agents/resume_optimizer/sub_agents/impact_agent.py
SYSTEM_PROMPT_FILE = "prompts/optimization/impact.md"
MODEL = "claude-sonnet-4-6"

# What it does:
# - Identify bullets that describe responsibilities (not achievements)
# - Transform responsibility statements into achievement statements
# - Add impact placeholders where numbers are unknown: "[X]%", "[N] team members"
# - Apply STAR/CAR method (Context, Action, Result)
# - Flag bullets for user to fill in actual numbers
#
# Example transformations:
# BEFORE: "Managed social media accounts for the company"
# AFTER:  "Grew company social media following by [X]% in [N] months through targeted content strategy"
#
# BEFORE: "Responsible for customer support tickets"
# AFTER:  "Resolved [N]+ customer support tickets per month, achieving [X]% satisfaction score"
#
# RULES:
# - NEVER invent actual numbers — use bracketed placeholders
# - NEVER remove a bullet even if it seems weak — flag it instead
```

### 4. CustomizationAgent — Job Description Tailoring

```python
# agents/resume_optimizer/sub_agents/customization_agent.py
SYSTEM_PROMPT_FILE = "prompts/optimization/customization.md"
MODEL = "claude-sonnet-4-6"

# What it does (only when JD is provided):
# - Reorder bullet points to lead with JD-relevant achievements
# - Adjust summary/headline to mirror JD language
# - Prioritize relevant experience sections
# - Suggest which older/irrelevant roles can be condensed
# - Identify cultural fit signals in JD and surface matching evidence
#
# What it does (when no JD — general optimization):
# - Ensure summary is compelling and benefit-focused
# - Ensure most impressive achievements appear early in each role
# - Reorder sections: Summary → Core Skills → Experience → Education
```

### 5. FormattingAgent — Structure & Consistency

```python
# agents/resume_optimizer/sub_agents/formatting_agent.py
SYSTEM_PROMPT_FILE = "prompts/optimization/formatting.md"
MODEL = "claude-haiku-4-5-20251001"  # Formatting is simpler — Haiku is fine

# What it does:
# - Normalize date formats to "MMM YYYY" consistently
# - Ensure all section headings use Title Case
# - Standardize bullet style (• or - consistently)
# - Check line spacing and section separation
# - Flag if resume exceeds 2 pages for senior roles, 1 page for graduates
# - Remove text boxes, tables, columns (ATS checkpoint 1, 4, 6)
# - Ensure contact info is in plain text at top (not in header/footer)
```

### 6. AuthenticityAgent — Voice Preservation (ALWAYS LAST)

```python
# agents/resume_optimizer/sub_agents/authenticity_agent.py
SYSTEM_PROMPT_FILE = "prompts/optimization/authenticity.md"
MODEL = "claude-sonnet-4-6"

# RUNS AFTER all other sub-agents have finished — never in parallel
#
# What it does:
# - Review ALL changes made by previous 5 agents
# - Detect and revert AI-sounding language patterns:
#   → "Demonstrated exceptional leadership..." ← too polished, revert
#   → "Spearheaded transformative initiatives..." ← AI buzzword, revert
#   → "Leveraged synergistic methodologies..." ← absolutely revert
# - Ensure the resume still sounds like the original person's voice
# - Preserve user's industry-specific vocabulary choices
# - Flag any claim that wasn't in original resume (hallucination check)
# - Produce final CLEAN diff of all accepted changes

AI_PHRASES_BLOCKLIST = [
    "demonstrated exceptional", "spearheaded", "transformative", "synergistic",
    "leveraged", "dynamic", "results-driven", "passionate about",
    "thought leader", "paradigm shift", "holistic approach", "game-changing",
    "best-in-class", "cutting-edge", "robust solution", "strategic vision",
]
```

## Orchestration

```python
# agents/resume_optimizer/orchestrator.py
import asyncio
from .sub_agents import (
    LinguisticAgent, ATSKeywordAgent, ImpactAgent,
    CustomizationAgent, FormattingAgent, AuthenticityAgent
)

async def optimize_resume(
    original_resume: dict,
    job_description: str | None,
    optimization_level: str = "standard",
) -> dict:
    """Run full 6-sub-agent optimization pipeline."""

    # Step 1: Run 5 agents in parallel (AuthenticityAgent excluded)
    parallel_results = await asyncio.gather(
        LinguisticAgent.run(original_resume),
        ATSKeywordAgent.run(original_resume, job_description),
        ImpactAgent.run(original_resume),
        CustomizationAgent.run(original_resume, job_description),
        FormattingAgent.run(original_resume),
        return_exceptions=True,   # Partial failure = continue
    )

    # Merge all suggestions (conflicts resolved by priority order)
    merged = merge_suggestions(original_resume, parallel_results)

    # Step 2: AuthenticityAgent ALWAYS runs last, on merged result
    final_resume = await AuthenticityAgent.run(
        original=original_resume,
        optimized=merged,
        blocklist=AI_PHRASES_BLOCKLIST,
    )

    # Step 3: Generate diff for user review
    diff = generate_diff(original_resume, final_resume)

    return {
        "original":     original_resume,
        "optimized":    final_resume,
        "diff":         diff,
        "changes_count": len(diff["changes"]),
        "sub_agent_logs": parallel_results,
    }
```

## Diff Format (for Frontend react-diff-viewer)

```json
{
  "changes": [
    {
      "section": "experience.0.bullets.2",
      "original": "Managed team of developers",
      "optimized": "Led cross-functional team of [N] developers delivering [X] features per sprint",
      "reason": "ImpactAgent — Added quantification placeholders and action verb",
      "agent": "ImpactAgent",
      "accepted": null
    }
  ],
  "summary": {
    "total": 24,
    "by_agent": {
      "LinguisticAgent": 6,
      "ATSKeywordAgent": 8,
      "ImpactAgent": 5,
      "CustomizationAgent": 3,
      "FormattingAgent": 2,
      "AuthenticityAgent": 0
    }
  }
}
```

## Rules

- `AuthenticityAgent` ALWAYS runs after all other agents — never in parallel with them
- NEVER remove content from user's resume without adding it to the diff for review
- NEVER claim a number the user didn't provide — use `[N]` and `[X]` placeholders
- User can accept/reject EACH change individually via frontend diff viewer
- After user accepts changes, ALWAYS rerun ATS scorer before allowing export
- Original version ALWAYS saved as version 0 — user can always restore it
- Voice recordings for profile extraction are deleted from S3 after 24 hours
