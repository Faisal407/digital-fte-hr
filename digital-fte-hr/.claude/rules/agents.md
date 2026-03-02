# Agent Architecture Rules
# Loaded by: CLAUDE.md @import
# Apply when: working in services/, packages/llm/, or any LangGraph code

## LangGraph Patterns (All Agents Must Follow)

### Standard Agent Structure
```python
# Every agent follows this pattern — no exceptions
from langgraph.graph import StateGraph, END
from packages.llm.claude import claude_call
from packages.llm.prompts import load_prompt
from packages.db.audit import log_agent_action

def build_agent_graph(agent_name: str) -> StateGraph:
    graph = StateGraph(AgentState)
    # Always: input_validator → reasoning → output_formatter → audit_logger
    graph.add_node("input_validator",  validate_and_sanitize_input)
    graph.add_node("reasoning",        call_claude_with_tools)
    graph.add_node("output_formatter", format_and_validate_output)
    graph.add_node("audit_logger",     log_to_dynamodb)
    return graph
```

### Claude API Call Pattern (Always Use Wrapper)
```python
# NEVER call anthropic.AsyncAnthropic() directly — use packages/llm/claude.py wrapper
from packages.llm.claude import claude_call

result = await claude_call(
    model="claude-sonnet-4-6",           # Sonnet: generation, reasoning, analysis
    # model="claude-haiku-4-5-20251001", # Haiku: scoring, classification, keyword extraction
    system=load_prompt("agent_name/system"),
    messages=messages,
    tools=tool_definitions,
    max_tokens=4096,
    user_id=user_id,   # Always pass — used for rate limiting + audit
)
# claude_call handles: 3x retries with exponential backoff, rate limit queuing, logging
```

## Model Selection Guide
```
claude-sonnet-4-6:           Resume generation, job description analysis, cover letter writing,
                              complex reasoning, agent orchestration decisions
claude-haiku-4-5-20251001:   ATS scoring (per checkpoint), intent classification (WhatsApp/Telegram),
                              keyword extraction, match scoring (0-100), duplicate detection
```

## Prompt Management Rules
- All system prompts live in `packages/llm/prompts/{agent_name}/{prompt_name}.md`
- Never inline long prompts in Python — reference via `load_prompt("agent/name")`
- Prompt files use Jinja2 templating: `{{ user_name }}`, `{{ job_title }}`
- Every prompt must have a version comment at top: `<!-- v1.2 - 2026-03-01 -->`
- Run local eval suite before merging any prompt change (see Prompt Evaluation section below)

## Prompt Evaluation (Local Eval Suite — No External Service Required)
```python
# packages/llm/evals/runner.py
# Run before merging prompt changes: uv run python -m packages.llm.evals.runner {agent} {prompt}

# Eval fixture structure:
# packages/llm/evals/fixtures/{agent_name}/{prompt_name}/
#   input_001.json       → test input
#   expected_001.json    → expected output schema + key assertions
#   input_002.json, ...

# Eval runner checks:
# 1. Output matches expected JSON schema (Pydantic validation)
# 2. Score delta < ±5 vs baseline for scoring prompts
# 3. No hallucinated company names or job titles in results
# 4. Authenticity score: no banned corporate buzzwords in resume prompts
# CI gate: eval suite must pass before prompt file changes can be merged
```

## Tool Definition Pattern
```python
SEARCH_TOOL = {
    "name": "search_linkedin_jobs",
    "description": "Search LinkedIn Jobs for listings matching query. Returns max 20 results per call. Use for LinkedIn-sourced jobs only.",
    "input_schema": {
        "type": "object",
        "properties": {
            "query":       { "type": "string", "description": "Job title or skill keywords" },
            "location":    { "type": "string", "description": "City, country, or 'remote'" },
            "date_posted": { "type": "string", "enum": ["24h", "week", "month"] },
        },
        "required": ["query"]
    }
}
# Tool descriptions must be precise — vague descriptions cause Claude to misuse tools
```

## Queue Architecture — When to Use What
```
SQS (Amazon SQS):
  Use for: Job search requests, auto-apply submissions, resume optimization triggers
  Pattern: Lambda consumer with partial batch failure reporting
  Retry: 3x with DLQ on failure

EventBridge:
  Use for: Scheduled recurring jobs (weekly reports Sunday 23:00 UTC,
           daily cap reset at midnight, S3 cleanup jobs, voice file deletion)
  Pattern: EventBridge rule → Lambda target
  NOT for: User-triggered workflows

Step Functions:
  NOT used in Phase 1. Reserved for Phase 2 multi-step orchestration workflows
  that need visual state machine debugging. SQS + LangGraph covers all Phase 1 needs.
```

## Agent Error Handling
```python
# Every tool call must have a fallback — never crash silently
try:
    result = await search_linkedin_jobs(query, location)
except LinkedInRateLimitError:
    await increment_rate_limit_backoff("linkedin", user_id)
    result = await search_indeed_jobs(query, location)   # Fallback platform
except LinkedInAPIError as e:
    await log_agent_action("error", {"tool": "linkedin", "error": str(e)})
    return AgentState(error=f"LinkedIn unavailable", partial_results=cached_results)
# ALWAYS return partial results with error context — never return empty on error
```

## Rate Limiting (Redis Token Bucket — Mandatory)
```python
from packages.shared.rate_limiter import check_and_consume

async def before_platform_request(platform: str, user_id: str):
    allowed = await check_and_consume(
        key=f"rate:{platform}:{user_id}",
        capacity=PLATFORM_LIMITS[platform]["daily"],
        refill_period_seconds=86400
    )
    if not allowed:
        raise PlatformRateLimitError(f"Daily limit reached for {platform}")
# Platform limits defined in packages/shared/constants/platform-limits.ts
# NEVER change limits without checking job board ToS
```

## ATS Scoring Rules (Resume Builder Agent Only)
- Score: 0–100, computed across exactly 23 checkpoints (see docs/agent-contracts.md)
- RED:   < 60  → block export, mandatory improvement required before applying
- YELLOW: 60–74 → warn user, allow export with disclaimer
- GREEN: 75+   → allow export, eligible for auto-apply
- Score must be recomputed after EVERY sub-agent run — never cache ATS scores
- Recompute trigger: any change to resume content, even a single word

## Human-in-the-Loop Gate (Auto-Apply — CRITICAL — Never Bypass)
```python
async def submit_application(application: Application, user_id: str):
    review = await create_review_gate(application, user_id)
    await notify_review_pending(user_id, review.id)   # All active channels
    approval = await wait_for_approval(review.id, timeout_hours=24)
    if not approval.approved:
        return ApplicationResult(status="skipped", reason=approval.skip_reason)
    return await execute_browser_submission(application, approval.edits)
# wait_for_approval polls DynamoDB every 30s — no busy-wait
# After 24h timeout: auto-expire and notify user the opportunity may have passed
```

## Claude Prompt Engineering Rules
- System prompt length: keep under 1500 tokens — test with `tiktoken` before merge
- Role first: always start system prompt with a single clear role sentence
- Negative constraints: explicitly state what Claude must NOT do
- Output format: specify JSON schema in system prompt when structured output required
- Authenticity: Resume Builder prompts MUST include: "Preserve the user's authentic voice — never over-genericize or add corporate buzzwords"
- Haiku model string for ALL fast/cheap calls: `claude-haiku-4-5-20251001`
