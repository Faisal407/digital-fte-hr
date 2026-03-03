---
name: pytest-agent
description: Writes pytest tests for Digital FTE's Python AI agents (job-search-agent, resume-builder-agent, auto-apply-agent). Use when testing LangGraph agent graphs, ATS scoring logic, Playwright scrapers, Claude API integrations, or Python utility functions. Knows how to mock Anthropic API, Playwright browser sessions, and LangGraph state machines. Coverage target is 75% Python, 100% on safety-critical paths.
---

# Pytest Agent Test Skill — Digital FTE Python Services

## Test Structure Per Agent

```
services/job-search-agent/
  tests/
    unit/
      test_ats_matcher.py      ← ATS scoring logic
      test_deduplicator.py     ← Deduplication
      test_ghost_detector.py   ← Ghost job detection
    integration/
      test_linkedin_scraper.py ← Playwright scraper (mock browser)
      test_agent_graph.py      ← LangGraph agent flow
    fixtures/
      resumes/
        perfect_resume.json    ← 90+ ATS score fixture
        mediocre_resume.json   ← 65 ATS score fixture
        terrible_resume.json   ← <50 ATS score fixture
      jobs/
        software_engineer.json
        product_manager.json
    conftest.py                ← Shared fixtures
```

## conftest.py (Shared Fixtures)

```python
# tests/conftest.py
import pytest
import asyncio
import json
from pathlib import Path
from unittest.mock import AsyncMock, MagicMock, patch

@pytest.fixture(scope="session")
def event_loop():
    """Use single event loop for all async tests."""
    loop = asyncio.new_event_loop()
    yield loop
    loop.close()

@pytest.fixture
def perfect_resume() -> dict:
    return json.loads((Path(__file__).parent / 'fixtures/resumes/perfect_resume.json').read_text())

@pytest.fixture
def mediocre_resume() -> dict:
    return json.loads((Path(__file__).parent / 'fixtures/resumes/mediocre_resume.json').read_text())

@pytest.fixture
def terrible_resume() -> dict:
    return json.loads((Path(__file__).parent / 'fixtures/resumes/terrible_resume.json').read_text())

@pytest.fixture
def mock_anthropic():
    """Mock Anthropic client — never hit real API in tests."""
    with patch('anthropic.AsyncAnthropic') as mock:
        client = AsyncMock()
        mock.return_value = client
        client.messages.create = AsyncMock(return_value=MagicMock(
            content=[MagicMock(type='text', text='{"score": 78, "improvements": []}')],
            usage=MagicMock(input_tokens=500, output_tokens=200),
        ))
        yield client

@pytest.fixture
async def mock_playwright():
    """Mock Playwright browser for scraper tests."""
    with patch('playwright.async_api.async_playwright') as mock:
        browser   = AsyncMock()
        context   = AsyncMock()
        page      = AsyncMock()
        browser.new_context.return_value  = context
        context.new_page.return_value     = page
        mock.return_value.__aenter__      = AsyncMock(return_value=MagicMock(chromium=MagicMock(launch=AsyncMock(return_value=browser))))
        yield page
```

## ATS Scorer Tests (100% Coverage Required)

```python
# tests/unit/test_ats_matcher.py
import pytest
from services.job_search_agent.scoring.matcher import ATSMatcher

class TestATSScorer:
    """
    ATS scoring is safety-critical — 100% branch coverage required.
    Tests cover all 23 checkpoints defined in the ATS specification.
    """

    @pytest.mark.asyncio
    async def test_perfect_resume_scores_above_75(self, perfect_resume, mock_anthropic):
        scorer = ATSMatcher()
        result = await scorer.score(
            resume=perfect_resume,
            job_description="Senior Python Engineer with 5+ years LangGraph experience"
        )
        assert result.score >= 75, f"Perfect resume scored {result.score}, expected >=75"
        assert result.zone == 'green'

    @pytest.mark.asyncio
    async def test_terrible_resume_scores_below_60(self, terrible_resume, mock_anthropic):
        scorer = ATSMatcher()
        result = await scorer.score(
            resume=terrible_resume,
            job_description="Senior Python Engineer"
        )
        assert result.score < 60, f"Terrible resume scored {result.score}, expected <60"
        assert result.zone == 'red'

    @pytest.mark.asyncio
    async def test_score_always_between_0_and_100(self, mediocre_resume, mock_anthropic):
        scorer = ATSMatcher()
        result = await scorer.score(resume=mediocre_resume, job_description="Any job")
        assert 0 <= result.score <= 100

    @pytest.mark.asyncio
    async def test_score_includes_breakdown_dimensions(self, perfect_resume, mock_anthropic):
        scorer = ATSMatcher()
        result = await scorer.score(resume=perfect_resume, job_description="Software Engineer")
        required_dims = ['keyword_match', 'format_compliance', 'quantification', 'experience_relevance', 'section_completeness', 'action_verbs']
        for dim in required_dims:
            assert dim in result.breakdown, f"Missing dimension: {dim}"

    @pytest.mark.asyncio
    async def test_score_provides_improvement_suggestions(self, mediocre_resume, mock_anthropic):
        scorer = ATSMatcher()
        result = await scorer.score(resume=mediocre_resume, job_description="Product Manager")
        assert len(result.improvements) > 0
        for imp in result.improvements:
            assert 'checkpoint' in imp
            assert 'suggestion' in imp
            assert 'priority' in imp
```

## LangGraph Agent Graph Tests

```python
# tests/integration/test_agent_graph.py
import pytest
from unittest.mock import AsyncMock, patch, MagicMock
from services.job_search_agent.agent.graph import JobSearchGraph, AgentState

class TestJobSearchGraph:

    @pytest.mark.asyncio
    async def test_full_agent_run_returns_jobs(self, mock_anthropic):
        """Full graph execution with mocked tools."""
        with patch('services.job_search_agent.scrapers.linkedin.LinkedInScraper.scrape') as mock_scrape, \
             patch('services.job_search_agent.scrapers.indeed.IndeedScraper.scrape') as mock_indeed:

            mock_scrape.return_value = [
                {'id': 'li-1', 'title': 'Software Engineer', 'platform': 'linkedin', 'postedAt': '2026-02-01T00:00:00Z'},
                {'id': 'li-2', 'title': 'Backend Engineer',  'platform': 'linkedin', 'postedAt': '2026-02-01T00:00:00Z'},
            ]
            mock_indeed.return_value = [
                {'id': 'in-1', 'title': 'Python Developer', 'platform': 'indeed', 'postedAt': '2026-02-01T00:00:00Z'},
            ]

            graph = JobSearchGraph()
            result = await graph.run(AgentState(
                user_id='test-user',
                query='Software Engineer',
                location='Dubai',
                platforms=['linkedin', 'indeed'],
            ))

            assert len(result.jobs) == 3
            assert all(hasattr(j, 'matchScore') for j in result.jobs)
            assert all(0 <= j.matchScore <= 100 for j in result.jobs)

    @pytest.mark.asyncio
    async def test_graph_deduplicates_cross_platform(self, mock_anthropic):
        """Same job appearing on multiple platforms should be deduplicated."""
        shared_url = 'https://company.com/careers/job-123'
        with patch('services.job_search_agent.scrapers.linkedin.LinkedInScraper.scrape') as li, \
             patch('services.job_search_agent.scrapers.indeed.IndeedScraper.scrape') as ind:
            li.return_value  = [{'id': 'li-1', 'title': 'Engineer', 'url': shared_url, 'platform': 'linkedin'}]
            ind.return_value = [{'id': 'in-1', 'title': 'Engineer', 'url': shared_url, 'platform': 'indeed'}]
            graph  = JobSearchGraph()
            result = await graph.run(AgentState(user_id='u1', query='Engineer', platforms=['linkedin', 'indeed']))
            assert len(result.jobs) == 1   # Deduped to one

    @pytest.mark.asyncio
    async def test_graph_returns_partial_on_platform_failure(self, mock_anthropic):
        """If one platform fails, return results from the others."""
        with patch('services.job_search_agent.scrapers.linkedin.LinkedInScraper.scrape') as li, \
             patch('services.job_search_agent.scrapers.indeed.IndeedScraper.scrape') as ind:
            li.return_value   = [{'id': 'li-1', 'title': 'Engineer', 'platform': 'linkedin'}]
            ind.side_effect   = Exception("Indeed rate limited")

            graph  = JobSearchGraph()
            result = await graph.run(AgentState(user_id='u1', query='Engineer', platforms=['linkedin', 'indeed']))

            assert len(result.jobs) >= 1            # LinkedIn results returned
            assert 'indeed' in result.failed_platforms  # Indeed failure recorded
```

## Auto-Apply Safety Tests (100% Coverage Required)

```python
# tests/unit/test_safety.py
import pytest
from services.auto_apply_agent.orchestrator import process_application
from services.auto_apply_agent.lib.approval_store import ApprovalStore
from unittest.mock import AsyncMock, patch

class TestApprovalSafety:
    """
    CRITICAL: Every auto-apply safety check must have 100% test coverage.
    These tests verify the human-in-loop gates can never be bypassed.
    """

    @pytest.mark.asyncio
    async def test_raises_if_not_approved(self):
        """Application MUST NOT proceed without explicit human approval."""
        with patch.object(ApprovalStore, 'is_approved', new=AsyncMock(return_value=False)):
            with pytest.raises(Exception, match='not been approved'):
                await process_application(
                    app=MagicMock(id='app-1', job_url='https://workday.com/job/1'),
                    user_id='user-1'
                )

    @pytest.mark.asyncio
    async def test_raises_when_daily_cap_reached(self):
        """Must not apply when user has hit 150 applications today."""
        with patch('services.auto_apply_agent.orchestrator.get_daily_application_count',
                   new=AsyncMock(return_value=150)), \
             patch.object(ApprovalStore, 'is_approved', new=AsyncMock(return_value=True)):
            with pytest.raises(Exception, match='Daily cap'):
                await process_application(app=MagicMock(id='app-2'), user_id='user-1')

    @pytest.mark.asyncio
    async def test_captcha_pauses_workflow(self, mock_playwright):
        """CAPTCHA must pause flow — never attempt bypass."""
        mock_playwright.locator.return_value.count = AsyncMock(return_value=1)  # CAPTCHA found
        with patch.object(ApprovalStore, 'is_approved', new=AsyncMock(return_value=True)):
            result = await process_application(app=MagicMock(id='app-3'), user_id='user-1')
            assert result.status.value == 'captcha_paused'
```

## Pytest Config

```ini
# pyproject.toml [tool.pytest.ini_options]
[tool.pytest.ini_options]
asyncio_mode = "auto"
testpaths    = ["tests"]
addopts      = "-v --tb=short"

[tool.coverage.run]
source  = ["services"]
omit    = ["tests/**", "**/conftest.py"]

[tool.coverage.report]
fail_under = 75    # CI fails below 75% (100% for safety-critical paths)
show_missing = true
```

## Run Commands

```bash
# Run all tests
uv run pytest tests/ -v

# Run with coverage
uv run pytest tests/ --cov=. --cov-report=html --cov-report=term-missing

# Run only safety-critical tests (must be 100%)
uv run pytest tests/ -m safety --cov=. --cov-fail-under=100

# Run specific service
uv run pytest services/auto-apply-agent/tests/ -v
```
