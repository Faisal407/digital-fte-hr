# Job Search Agent

Multi-platform job scraping service with semantic matching, deduplication, and ghost job detection using LangGraph and Claude AI.

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                   Job Search Workflow                        │
│                   (LangGraph Pipeline)                       │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  1. SEARCH JOBS                                              │
│     ├─ LinkedIn (Tier 1: Official API)                      │
│     ├─ Indeed (Tier 1: Official API)                        │
│     ├─ Glassdoor (Tier 2: Playwright scraper)               │
│     ├─ NaukriGulf (Tier 2: Playwright scraper)              │
│     ├─ Bayt (Tier 2: Playwright scraper)                    │
│     └─ Rozee.pk (Tier 2: Playwright scraper)                │
│        [+ Tier 3: Workday, Taleo, LinkedIn ATS...]          │
│                                                               │
│  2. DEDUPLICATE                                              │
│     └─ Identify same job on multiple platforms              │
│        (Uses Claude Haiku for semantic matching)             │
│                                                               │
│  3. SCORE JOBS                                               │
│     └─ Match against user profile                           │
│        (Uses Claude Haiku for semantic matching)             │
│        - Semantic match (overall fit)                        │
│        - Skills match (required vs user)                     │
│        - Role match (title match)                            │
│        - Location match (preference)                         │
│                                                               │
│  4. DETECT GHOST JOBS                                        │
│     └─ Flag suspicious postings                             │
│        - Posted >30 days (no updates)                        │
│        - Zero applications (suspicious)                      │
│        - Generic descriptions                                │
│        - Reposted frequently                                 │
│                                                               │
│  5. RETURN RESULTS                                           │
│     └─ Ranked by match score, ghost-jobs flagged             │
│                                                               │
└─────────────────────────────────────────────────────────────┘
```

## Features

### Multi-Platform Support (15+)

**Tier 1: Official APIs** (fast, reliable)
- LinkedIn
- Indeed
- Greenhouse
- Lever

**Tier 2: Playwright Scrapers** (medium speed)
- Glassdoor
- NaukriGulf (Middle East)
- Bayt (Middle East)
- Rozee.pk (South Asia)
- ZipRecruiter
- CareerBuilder

**Tier 3: Enterprise ATS** (slow, complex)
- Workday
- Taleo
- iCIMS
- SAP SuccessFactors

### Intelligent Scoring

- **Claude Haiku** for fast, cheap semantic matching
- Evaluates 4 dimensions: semantic, skills, role, location
- Combines scores into 0-100 match rating
- Filters by minimum threshold (default: 30)

### Deduplication

- Identifies same job posted on multiple platforms
- Keeps most authoritative source
- Uses Claude for semantic matching
- Reduces redundant applications

### Ghost Job Detection

- **Heuristic checks**: Posted >30 days, zero applications, generic titles
- **Claude analysis**: Deep semantic review for suspicious patterns
- Flags but doesn't filter (user sees warnings)
- Tracks reposting patterns by company

### Rate Limiting

- Respects platform rate limits (10-20 requests/hour per platform)
- Uses Redis token bucket for distributed systems
- Prevents IP bans and blacklisting
- Graceful degradation on rate limit hit

## Installation

```bash
# Install with uv
uv venv
. .venv/bin/activate
uv sync

# Or with pip
pip install -e ".[dev]"
```

## Configuration

Copy `.env.example` to `.env`:

```bash
cp .env.example .env
```

Required:
```
ANTHROPIC_API_KEY=sk-ant-...
REDIS_URL=redis://localhost:6379
```

Optional (platform APIs):
```
LINKEDIN_ACCESS_TOKEN=...
INDEED_API_KEY=...
```

## Usage

### As Python Script

```python
from digital_fte_job_search import JobSearchGraph, JobSearchInput
import asyncio

async def main():
    graph = JobSearchGraph()

    results = await graph.run(
        JobSearchInput(
            user_id="user123",
            correlation_id="req-456",
            target_roles=["Software Engineer", "Backend Developer"],
            target_locations=["San Francisco, CA"],
            target_industries=["Technology"],
            years_of_experience=5,
            skills=["Python", "JavaScript", "AWS"],
        )
    )

    for job in results["matches"]:
        print(f"{job['title']} at {job['company']}: {job['match_score']}/100")

asyncio.run(main())
```

### Run Main

```bash
python src/main.py
```

### API Integration

```bash
# API calls job search agent
POST /jobs/search HTTP/1.1
Content-Type: application/json

{
  "target_roles": ["Software Engineer"],
  "target_locations": ["San Francisco, CA"],
  "skills": ["Python", "AWS"],
  "years_of_experience": 5
}

# Returns:
{
  "success": true,
  "matches": [
    {
      "id": "linkedin#...",
      "title": "Senior Software Engineer",
      "company": "Google",
      "location": "San Francisco, CA",
      "match_score": 92,
      "score_breakdown": {
        "semantic_score": 90,
        "skills_match": 95,
        "role_match": 88,
        "location_match": 100
      }
    }
  ],
  "total_found": 42,
  "platforms_searched": ["linkedin", "indeed", "glassdoor"],
  "deduplicatedCount": 5,
  "ghost_count": 2,
  "completedAt": "2026-03-02T14:30:00Z"
}
```

## Performance

### Speed Targets
- Single role/location: 30-60 seconds
- 5 platforms in parallel: 2 API calls (fast) + 3 Playwright (slower)
- Scoring: ~100 jobs/minute (Claude Haiku)
- Dedup: ~50 jobs/minute (Claude Haiku)

### Optimization Tips
1. Use rate limits (10-20 req/hour per platform)
2. Run searches off-peak
3. Batch multiple user searches
4. Cache results (jobs valid 24h)
5. Use simple dedup for development

## Development

### Test Job Search

```python
# Direct LangGraph testing
from digital_fte_job_search.workflow.graph import JobSearchGraph, JobSearchInput

async def test():
    graph = JobSearchGraph()
    state = await graph.execute(
        JobSearchInput(
            user_id="test",
            correlation_id="test-123",
            target_roles=["Engineer"],
            target_locations=["SF"],
            target_industries=["Tech"],
            years_of_experience=5,
            skills=["Python"],
            platforms=["linkedin", "indeed"],  # Test specific platforms
        )
    )
    print(state)
```

### Test Individual Scrapers

```python
from digital_fte_job_search.scrapers import LinkedInScraper
import asyncio

async def test():
    scraper = LinkedInScraper()
    result = await scraper.search(
        roles=["Software Engineer"],
        locations=["San Francisco"],
        limit=10
    )
    print(f"Found {result.total_found} jobs")
    for job in result.jobs:
        print(f"  - {job.title} at {job.company}")

asyncio.run(test())
```

### Test Scoring

```python
from digital_fte_job_search.scoring.matcher import JobMatcher, UserProfile
import asyncio

async def test():
    matcher = JobMatcher()
    profile = UserProfile(
        user_id="user1",
        target_roles=["Software Engineer"],
        target_locations=["SF"],
        target_industries=["Tech"],
        years_of_experience=5,
        skills=["Python", "AWS"],
    )

    score = await matcher.score_job(
        job_title="Senior Backend Engineer",
        job_description="...",
        job_company="Google",
        job_location="San Francisco",
        user_profile=profile,
    )

    print(f"Match score: {score.overall_score}/100")
    print(score.reasoning)

asyncio.run(test())
```

## Architecture Details

### LangGraph Workflow

The job search uses LangGraph state machine:

```
search_jobs
    ↓
deduplicate
    ↓
score_jobs
    ↓
detect_ghosts
    ↓
finalize → END
```

Each node is async and can run in parallel where applicable.

### Scraper Hierarchy

All scrapers extend `BaseScraper`:

```python
class BaseScraper:
    async def search(roles, locations, limit) -> ScraperResult
    def parse_job(raw_data) -> JobPosting
```

Platform-specific scrapers implement these methods.

### Scoring Pipeline

**Matcher** evaluates 4 dimensions:
1. **Semantic score** (40%): Overall fit via Claude Haiku
2. **Skills match** (30%): Overlap of required vs user skills
3. **Role match** (15%): Job title alignment
4. **Location match** (15%): Geography preference

Result: Weighted 0-100 score

### Deduplication

**DeduplicatorFilters**:
1. Fast: Group by (company, title) → 80% recall
2. Deep: Claude semantic check → high precision
3. Result: Keep first posted (authoritative)

## Monitoring & Logging

```python
import logging
logging.basicConfig(level="DEBUG")
logger = logging.getLogger("digital_fte_job_search")
```

Logs track:
- Scraper start/completion
- Jobs found per platform
- Scoring progress
- Dedup matches
- Ghost job flags
- Errors & retries

## Dependencies

- **langgraph** >= 0.1.0 - Workflow orchestration
- **anthropic** >= 0.25.0 - Claude API
- **playwright** >= 1.40.0 - Browser automation
- **httpx** >= 0.25.0 - Async HTTP
- **redis** >= 5.0.0 - Rate limiting
- **pydantic** >= 2.5.0 - Data validation

## License

Part of Digital FTE HR Platform
