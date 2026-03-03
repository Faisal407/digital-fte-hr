# Job Search Agent — Local Context
# This CLAUDE.md is for: services/job-search-agent/
# Inherits root CLAUDE.md + adds agent-specific rules

## What This Service Does
Searches 15+ job platforms simultaneously, scores every listing against the user's profile
(0-100 semantic match score), deduplicates cross-platform results, enriches with company
data, and detects ghost jobs. Runs as AWS ECS Fargate container triggered via SQS.

## Tech Stack (This Service)
- **Language**: Python 3.12
- **Package Manager**: uv (not pip, not poetry)
- **Agent Framework**: LangGraph 0.2+
- **Browser**: Playwright (async) for Tier 2 scrapers
- **LLM**: Claude 3 Haiku for scoring (fast + cheap), Sonnet for reasoning
- **Queue**: Consumes from SQS queue `job-search-requests`

## Run Locally
```bash
cd services/job-search-agent
uv run python main.py                    # Run agent
uv run pytest tests/                    # Run tests
uv run playwright install chromium      # Install browser (first time)
uv run python -m scripts.test_scraper linkedin  # Test a specific scraper
```

## Key Files
```
services/job-search-agent/
├── main.py               → Entry point, SQS consumer
├── agent/
│   ├── graph.py          → LangGraph state machine definition
│   ├── state.py          → AgentState TypedDict
│   └── tools.py          → All tool implementations
├── scrapers/
│   ├── linkedin.py       → LinkedIn API wrapper
│   ├── indeed.py         → Indeed API wrapper
│   ├── naukrigulf.py     → Playwright scraper
│   ├── bayt.py           → Playwright scraper
│   └── base.py           → BaseScraper abstract class
├── scoring/
│   ├── matcher.py        → Claude Haiku match scoring
│   └── deduplicator.py   → Cross-platform deduplication
├── prompts/
│   ├── system.md         → Agent system prompt
│   └── scoring.md        → Match scoring prompt
└── tests/
    ├── unit/             → Mocked unit tests
    └── integration/      → Tests with stub API server
```

## Critical Rules (This Service Only)
1. **Deduplication is mandatory** — every search MUST call `deduplicator.deduplicate(results)` before returning
2. **Ghost job detection** — flag any job posted >30 days with `is_ghost_job=True`
3. **Match score always 0-100** — never return raw LLM output without validating range
4. **Never call a platform if user has hit daily rate limit** — check BEFORE API call
5. **Partial results on failure** — if LinkedIn fails, still return Indeed + NaukriGulf results
6. **All scrapers extend BaseScraper** — never write standalone Playwright code
7. **Company enrichment is async non-blocking** — don't wait for it before returning job list

## Scraper Development Protocol
When adding a new scraper:
1. Create `scrapers/{platform_name}.py` extending `BaseScraper`
2. Add rate limit config to `packages/shared/constants/platform-limits.py`
3. Add field mapping to `scrapers/field-mappings/{platform}.json`
4. Write unit tests with mocked Playwright responses in `tests/unit/scrapers/`
5. Add to `SUPPORTED_PLATFORMS` enum in `packages/shared/types.py`
6. Update platform-integrations.md with selector documentation
