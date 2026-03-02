---
name: langgraph-agent
description: Scaffolds production-ready LangGraph agents for Digital FTE using Python 3.12. Use when building or extending any of the four core agents — Job Search, Resume Builder, Auto-Apply, or Notification Agent. Generates the full graph structure, node functions, state schema, edge conditions, tool definitions, and error recovery patterns. Enforces human-in-loop gates for auto-apply.
---

# LangGraph Agent Skill — Digital FTE Agent Architecture

## Stack: Python 3.12 + LangGraph 0.2+ + Anthropic SDK + uv package manager

## Standard Agent Structure

```
services/{agent-name}/
├── agent/
│   ├── __init__.py
│   ├── graph.py          ← Main LangGraph graph definition
│   ├── state.py          ← TypedDict state schema
│   ├── nodes/
│   │   ├── __init__.py
│   │   ├── search.py     ← One file per node
│   │   ├── score.py
│   │   └── dedupe.py
│   ├── tools/
│   │   ├── __init__.py
│   │   └── platform_search.py
│   └── edges.py          ← Conditional edge logic
├── prompts/
│   ├── search/classify.md
│   ├── scoring/match.md
│   └── report/summary.md
├── tests/
│   ├── test_graph.py
│   └── test_nodes.py
├── pyproject.toml
└── main.py               ← Lambda entry point
```

## State Schema Template

```python
# agent/state.py
from typing import TypedDict, Annotated, Literal, Optional
from langchain_core.messages import BaseMessage
import operator

class JobSearchState(TypedDict):
    # Input
    user_id: str
    request_id: str
    query: str
    location: Optional[str]
    platforms: list[str]
    page_size: int

    # Processing
    messages: Annotated[list[BaseMessage], operator.add]  # Append-only message history
    current_platform: Optional[str]
    raw_results: list[dict]
    deduplicated_results: list[dict]
    scored_results: list[dict]
    errors: Annotated[list[str], operator.add]

    # Output
    final_jobs: list[dict]
    is_complete: bool
    error_message: Optional[str]

    # Routing signals
    next_action: Literal["search", "score", "dedupe", "enrich", "complete", "error"]
```

## Graph Builder Pattern

```python
# agent/graph.py
from langgraph.graph import StateGraph, END
from langgraph.checkpoint.memory import MemorySaver
from .state import JobSearchState
from .nodes.search import search_platforms_node
from .nodes.score import score_jobs_node
from .nodes.dedupe import deduplicate_node
from .nodes.enrich import enrich_companies_node
from .edges import route_after_search, route_after_score

def build_job_search_graph() -> StateGraph:
    """Build and compile the Job Search agent graph."""
    graph = StateGraph(JobSearchState)

    # Register nodes
    graph.add_node("search",   search_platforms_node)
    graph.add_node("dedupe",   deduplicate_node)
    graph.add_node("score",    score_jobs_node)
    graph.add_node("enrich",   enrich_companies_node)

    # Define flow
    graph.set_entry_point("search")
    graph.add_conditional_edges("search", route_after_search, {
        "dedupe":  "dedupe",
        "error":   END,
    })
    graph.add_edge("dedupe", "score")
    graph.add_conditional_edges("score", route_after_score, {
        "enrich":   "enrich",
        "complete": END,
    })
    graph.add_edge("enrich", END)

    # Compile with checkpointing for resumability
    return graph.compile(checkpointer=MemorySaver())

# Singleton — compiled once at Lambda cold start
job_search_graph = build_job_search_graph()
```

## Node Function Pattern

```python
# agent/nodes/score.py
from anthropic import Anthropic
from ..state import JobSearchState
from ...lib.prompts import load_prompt
from ...lib.rate_limit import check_rate_limit
from ...lib.logger import logger

client = Anthropic()  # Initialized once

async def score_jobs_node(state: JobSearchState) -> dict:
    """Score each job against user profile using Claude Haiku."""
    user_id = state["user_id"]
    jobs = state["deduplicated_results"]

    if not jobs:
        logger.info("No jobs to score", extra={"user_id": user_id})
        return {"scored_results": [], "next_action": "complete"}

    # Rate limit check before every Anthropic API call
    await check_rate_limit(user_id, "claude-haiku-4-5-20251001 , limit=100, window=3600)

    # Load prompt from file (never hardcode prompts in Python)
    prompt_template = load_prompt("scoring/match.md")

    scored = []
    for job in jobs:
        try:
            prompt = prompt_template.render(
                job=job,
                user_skills=state.get("user_skills", []),
                target_titles=state.get("target_titles", []),
            )

            # Use Haiku for scoring (fast + cheap — not generation)
            response = client.messages.create(
                model="claude-haiku-4-5-20251001",
                max_tokens=300,
                messages=[{"role": "user", "content": prompt}],
            )

            score_data = parse_score_response(response.content[0].text)
            scored.append({**job, **score_data})

        except Exception as e:
            logger.error("Failed to score job", extra={"job_id": job.get("id"), "error": str(e)})
            scored.append({**job, "match_score": 0, "score_error": str(e)})

    # Sort by match score descending
    scored.sort(key=lambda j: j.get("match_score", 0), reverse=True)

    logger.info("Jobs scored", extra={"user_id": user_id, "count": len(scored)})
    return {"scored_results": scored, "next_action": "enrich"}
```

## Human-in-Loop Gate (MANDATORY for Auto-Apply)

```python
# agent/nodes/human_review.py — NEVER bypass this node for auto-apply
from langgraph.types import interrupt

async def request_human_approval_node(state: AutoApplyState) -> dict:
    """
    CRITICAL: Pause graph execution and send application to user for review.
    Graph resumes ONLY when user explicitly approves via API.
    This node MUST exist in every auto-apply graph.
    """
    application = state["prepared_application"]

    # Persist review request to DB (with expiry)
    review_id = await create_review_request(
        user_id=state["user_id"],
        application=application,
        expires_in_hours=48,
    )

    # Send notification to user via preferred channel
    await notify_user_of_pending_review(
        user_id=state["user_id"],
        review_id=review_id,
        job_title=application["job_title"],
        company=application["company"],
        review_url=f"https://app.digitalfte.com/review/{review_id}",
    )

    # INTERRUPT — graph pauses here until external resume signal
    # Resume via: graph.invoke(Command(resume={"approved": True}), config)
    decision = interrupt({
        "review_id": review_id,
        "message": "Awaiting user approval before submitting application",
    })

    if not decision.get("approved"):
        return {"status": "rejected_by_user", "next_action": "cancelled"}

    return {"status": "approved", "review_id": review_id, "next_action": "submit"}
```

## Prompt Loader

```python
# lib/prompts.py
from pathlib import Path
from jinja2 import Environment, FileSystemLoader

_prompt_dir = Path(__file__).parent.parent / "prompts"
_jinja_env = Environment(loader=FileSystemLoader(str(_prompt_dir)), autoescape=False)

def load_prompt(name: str) -> 'Template':
    """Load and return a Jinja2 template from the prompts directory."""
    return _jinja_env.get_template(name)
```

## Error Recovery Pattern

```python
# agent/edges.py
from .state import JobSearchState

def route_after_search(state: JobSearchState) -> str:
    errors = state.get("errors", [])
    results = state.get("raw_results", [])

    if not results and len(errors) >= len(state.get("platforms", [])):
        # All platforms failed — route to error
        return "error"

    if not results:
        # Partial failure — continue with what we have
        return "dedupe"

    return "dedupe"
```

## Lambda Entry Point

```python
# main.py
import asyncio
from agent.graph import job_search_graph
from lib.logger import logger

def handler(event: dict, context) -> dict:
    """AWS Lambda entry point for Job Search Agent."""
    logger.info("Agent invoked", extra={"request_id": event.get("requestId")})

    try:
        result = asyncio.run(job_search_graph.ainvoke(
            input=event,
            config={"configurable": {"thread_id": event["requestId"]}},
        ))
        return {"success": True, "data": result["final_jobs"]}

    except Exception as e:
        logger.error("Agent failed", extra={"error": str(e)}, exc_info=True)
        return {"success": False, "error": str(e)}
```

## Model Selection Rules

| Task | Model | Reason |
|---|---|---|
| Job scoring / classification | `claude-haiku-4-5-20251001` | Fast, cheap, handles structured output |
| Resume optimization | `claude-sonnet-4-6` | Best reasoning for content quality |
| ATS analysis | `claude-sonnet-4-6` | Nuanced 23-checkpoint evaluation |
| Screening question answers | `claude-sonnet-4-6` | Context-aware, personalized |
| Intent classification (channels) | `claude-haiku-4-5-20251001` | Low latency for chat UX |

## Rules

- NEVER call `anthropic.Anthropic()` directly in node functions — always use the singleton client
- EVERY Anthropic API call MUST be preceded by `check_rate_limit()`
- Human-in-loop interrupt MUST exist in auto-apply graph — never submit without user approval
- All prompts MUST be `.md` files in `prompts/` — never hardcode prompts as Python strings
- Use `logger.info/error` with `extra={}` for structured CloudWatch logs — never `print()`
- Agents must handle partial platform failures gracefully — return whatever results are available
