---
name: claude-prompt-engineer
description: Designs, writes, and optimizes Claude API prompts for all Digital FTE agents. Use when creating new agent prompts, improving existing prompt quality, debugging unexpected Claude outputs, selecting the right model for a task, or implementing structured output extraction. Knows all Digital FTE prompt templates, their locations, and the Jinja2 templating system.
---

# Claude Prompt Engineer Skill — Digital FTE Prompt Library

## Prompt File Locations

All prompts live in `prompts/` directories within each service — NEVER hardcoded in Python:

```
services/job-search-agent/prompts/
├── scoring/
│   ├── match.md          ← Job-profile match scoring
│   ├── ghost_detect.md   ← Ghost job classification
│   └── platform_rank.md  ← Platform result ranking
├── extraction/
│   ├── jd_parse.md       ← Extract structured data from JD
│   └── company_info.md   ← Company enrichment from web data
└── report/
    └── weekly_summary.md ← Weekly coaching narrative

services/resume-builder-agent/prompts/
├── extraction/
│   ├── resume_parse.md    ← Parse uploaded PDF/DOCX
│   ├── linkedin_import.md ← Extract from LinkedIn HTML
│   └── voice_extract.md   ← Structure from voice transcript
├── optimization/
│   ├── linguistic.md      ← Grammar & style agent
│   ├── ats_keywords.md    ← Keyword gap agent
│   ├── impact.md          ← Quantification agent
│   ├── customization.md   ← JD tailoring agent
│   ├── formatting.md      ← Structure agent
│   └── authenticity.md    ← Voice preservation agent (runs last)
└── scoring/
    ├── ats_full_eval.md   ← Full 23-checkpoint evaluation
    └── quick_score.md     ← Fast 5-checkpoint preview

services/channel-orchestration/prompts/
├── intent_classify.md     ← User message → intent enum
└── response_compose.md    ← Natural language response generation
```

## Prompt Design Principles

### 1. Always Specify Output Format Explicitly

```markdown
<!-- WRONG — vague output instruction -->
"Analyze this resume and give feedback."

<!-- RIGHT — explicit structured format -->
"Analyze this resume and respond ONLY with valid JSON matching this schema:
{
  "checkpoints": [{ "id": number, "passed": boolean, "score": number, "feedback": string }],
  "overall": number
}
No preamble, no markdown fences, no explanation outside the JSON."
```

### 2. Role + Context + Task + Format Structure

Every prompt follows this structure:

```markdown
# Role
You are [specific expert role] working for Digital FTE, a career acceleration platform.

# Context
[What the agent knows about the situation — injected via Jinja2]
User profile: {{ user_profile | tojson }}
Target job: {{ job_description[:2000] }}

# Task
[Precise instruction for what to do]
Score this resume against the job description on a scale of 0-100, evaluating...

# Constraints
- [Hard rules that cannot be broken]
- Never fabricate information not present in the resume
- Only score skills that are explicitly mentioned

# Output Format
Respond ONLY with JSON:
{{ output_schema }}
```

### 3. Model Selection Matrix

```python
# When to use which model — follow strictly
MODEL_SELECTION = {
    # HAIKU: Fast classification, simple extraction, formatting tasks
    "intent_classification":    "claude-haiku-4-5-20251001",  # Channel message intent
    "ghost_job_detection":      "claude-haiku-4-5-20251001",  # Binary classification
    "platform_result_ranking":  "claude-haiku-4-5-20251001",  # Sorting + basic scoring
    "formatting_check":         "claude-haiku-4-5-20251001",  # Structure validation
    "quick_extraction":         "claude-haiku-4-5-20251001",  # Simple field extraction

    # SONNET: Complex reasoning, generation, nuanced evaluation
    "ats_full_scoring":         "claude-sonnet-4-6",          # 23-checkpoint eval
    "resume_optimization":      "claude-sonnet-4-6",          # All 6 sub-agents
    "screening_qa":             "claude-sonnet-4-6",          # Application Q&A
    "weekly_report_narrative":  "claude-sonnet-4-6",          # Coaching tone
    "jd_deep_analysis":         "claude-sonnet-4-6",          # Requirement extraction
    "voice_transcript_extract": "claude-sonnet-4-6",          # Unstructured → structured
    "authenticity_check":       "claude-sonnet-4-6",          # Style analysis
}
```

### 4. Structured Output Extraction

```python
# lib/claude_client.py
import json
import re
from anthropic import Anthropic
from .logger import logger

client = Anthropic()

async def call_claude_structured(
    prompt: str,
    output_schema: dict,
    model: str,
    max_tokens: int = 2000,
) -> dict:
    """Call Claude and extract JSON from response reliably."""

    response = client.messages.create(
        model=model,
        max_tokens=max_tokens,
        system="You respond ONLY with valid JSON. No markdown, no explanation, no preamble.",
        messages=[{"role": "user", "content": prompt}],
    )

    raw = response.content[0].text.strip()

    # Strip markdown fences if model included them despite instruction
    raw = re.sub(r'^```(?:json)?\n?', '', raw)
    raw = re.sub(r'\n?```$', '', raw)
    raw = raw.strip()

    try:
        return json.loads(raw)
    except json.JSONDecodeError as e:
        logger.error("Claude returned invalid JSON", extra={
            "raw_response": raw[:500],
            "model": model,
            "error": str(e),
        })
        raise ValueError(f"Claude returned invalid JSON: {e}")
```

### 5. Prompt Templates with Jinja2

```python
# Prompt template example: prompts/scoring/match.md
"""
---
model: claude-haiku-4-5-20251001
max_tokens: 500
description: Score a job listing against a user profile (0-100)
---

You are a precise job matching AI for Digital FTE career platform.

Score how well this candidate matches this job opportunity.

## Candidate Profile
- Skills: {{ user_skills | join(', ') }}
- Years of experience: {{ user_yoe }}
- Location: {{ user_location }}
- Target titles: {{ target_titles | join(', ') }}
- Target salary: {{ target_salary.currency }} {{ target_salary.min }}–{{ target_salary.max }}/{{ target_salary.period }}

## Job Listing
- Title: {{ job.title }}
- Company: {{ job.company.name }}
- Location: {{ job.location }} {% if job.remote %}(Remote available){% endif %}
- Required skills: {{ job.required_skills | join(', ') }}
- Years required: {{ job.min_experience }}–{{ job.max_experience | default('open') }}

## Instructions
Score each dimension 0-100 and compute weighted overall.
Weights: Skills 35%, Experience 25%, Location 15%, Education 10%, Salary 10%, Culture 5%.

Respond ONLY with JSON:
{
  "overall": <integer 0-100>,
  "skills": <integer 0-100>,
  "experience": <integer 0-100>,
  "location": <integer 0-100>,
  "education": <integer 0-100>,
  "salary": <integer 0-100>,
  "culture": <integer 0-100>,
  "top_strength": "<one sentence>",
  "top_gap": "<one sentence>"
}
"""
```

## Prompt Quality Checklist

Before adding any new prompt to the codebase, verify:

- [ ] Role is defined at the top — Claude knows exactly what expert it is
- [ ] Output format is specified with exact JSON schema — no ambiguity
- [ ] All variable injections use Jinja2 `{{ }}` — never Python f-strings
- [ ] Constraints section includes "Never fabricate" rule for any factual prompt
- [ ] Max tokens is appropriate (extraction: 300-500, generation: 1000-4000)
- [ ] Correct model selected from MODEL_SELECTION dict
- [ ] Prompt tested with 3 real examples before merging

## Debugging Bad Outputs

1. **Claude ignores output format** → Add `system="Respond ONLY with JSON..."` param
2. **JSON parse fails** → Add the regex strip for markdown fences
3. **Scores too uniform (all 70s)** → Add score distribution examples in prompt
4. **Ghost job false positives** → Reduce binary to three-way: `"confident" | "possible" | "unlikely"`
5. **Resume bullets too AI-sounding** → Add more examples to `AI_PHRASES_BLOCKLIST` and expand authenticity prompt
6. **Missing keywords in extraction** → Ask for a second pass: "Did you miss any technical tools?"
