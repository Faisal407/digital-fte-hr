# LLM Package — Local Context
# This CLAUDE.md is for: packages/llm/
# Inherits root CLAUDE.md + adds LLM/Claude-specific context

## What This Package Does
The centralized Claude API wrapper, prompt loader, LangGraph setup, and eval runner
for all Digital FTE agents. NEVER call the Anthropic SDK directly from agent code —
always use this package's `claude_call()` wrapper.

## Directory Structure
```
packages/llm/
├── claude.py               → claude_call() wrapper with retries + rate limiting
├── prompts/                → All system prompts organized by agent
│   ├── job-search/
│   │   ├── system.md       → Agent system prompt
│   │   └── scoring.md      → Job match scoring prompt
│   ├── resume-builder/
│   │   ├── system.md
│   │   ├── linguistic.md   → LinguisticAgent prompt
│   │   ├── ats-keyword.md  → ATSKeywordAgent prompt
│   │   ├── impact.md       → ImpactAgent prompt
│   │   ├── customization.md → CustomizationAgent prompt
│   │   ├── formatting.md   → FormattingAgent prompt
│   │   └── authenticity.md → AuthenticityAgent prompt (runs LAST)
│   ├── auto-apply/
│   │   ├── system.md
│   │   └── answer-gen.md   → Screening question answer generation
│   └── channel-orchestration/
│       └── intent.md       → WhatsApp/Telegram intent classification
├── evals/
│   ├── runner.py           → Local eval runner (no external service required)
│   ├── fixtures/           → Test inputs + expected outputs per agent/prompt
│   └── assertions.py       → Custom assertion helpers
└── langgraph_setup.py      → Shared LangGraph configuration + state type helpers
```

## claude_call() Wrapper
```python
# packages/llm/claude.py
# ALWAYS use this — never import anthropic directly in agent code
from packages.llm.claude import claude_call

result = await claude_call(
    model="claude-sonnet-4-6",            # or "claude-haiku-4-5-20251001"
    system=load_prompt("job-search/system"),
    messages=conversation_messages,
    tools=tool_definitions,               # Optional
    max_tokens=4096,
    user_id=user_id,                      # Required — for rate limiting + audit
)
# Wrapper handles: 3x exponential retry, per-user rate limiting, cost logging, X-Ray tracing
```

## Prompt Loading
```python
from packages.llm.prompts import load_prompt

# Loads from packages/llm/prompts/{path}.md
# Applies Jinja2 templating automatically
system_prompt = load_prompt("resume-builder/ats-keyword", {
    "job_title":    job.title,
    "company_name": job.company_name,
    "user_skills":  ", ".join(user.skills),
})
# Every prompt file must start with: <!-- v1.x - YYYY-MM-DD -->
```

## Eval Runner (Run Before Merging Prompt Changes)
```bash
# Run evals for a specific agent + prompt
uv run python -m packages.llm.evals.runner job-search scoring
uv run python -m packages.llm.evals.runner resume-builder ats-keyword

# CI gate: all evals must pass — score delta < ±5, schema validation 100%
# Fixtures in: packages/llm/evals/fixtures/{agent}/{prompt}/input_NNN.json
```

## Model Decision Guide
```
claude-sonnet-4-6:
  - Resume content generation (bullets, summaries, cover letters)
  - Job description deep analysis
  - Complex agent reasoning and tool selection
  - Any output > 500 tokens

claude-haiku-4-5-20251001:
  - ATS checkpoint scoring (per checkpoint — 23 calls per resume)
  - Match score calculation (0-100) per job listing
  - Intent classification (WhatsApp/Telegram messages)
  - Keyword extraction from JDs
  - Duplicate job detection
  - Any classification or scoring task < 500 tokens output
```

## Rules
- NEVER import `anthropic` directly from agent code — always `from packages.llm.claude import claude_call`
- NEVER inline prompts longer than 3 lines in Python — use `load_prompt()`
- EVERY prompt file must have version comment: `<!-- v1.0 - 2026-03-01 -->`
- Run eval suite BEFORE merging any prompt change: `uv run python -m packages.llm.evals.runner`
- Cost tracking: every claude_call logs token usage to CloudWatch metric `llm/tokens_used`
