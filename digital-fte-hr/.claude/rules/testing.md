# Testing Requirements & Patterns
# Loaded by: CLAUDE.md @import
# Apply when: writing tests or asked to test any feature

## Coverage Targets (Enforced in CI)
- TypeScript packages: 80% line coverage minimum
- Python agent services: 75% line coverage minimum
- Critical paths (apply gate, ATS scoring, auth): 100% coverage required
- Run: `pnpm test --coverage` — CI blocks merge if targets not met

## Test File Location Convention
```
service/
├── src/
│   └── job-search/searcher.ts
└── tests/
    ├── unit/
    │   └── job-search/searcher.test.ts    # Unit tests
    ├── integration/
    │   └── job-search/searcher.int.ts     # Integration tests
    └── e2e/
        └── job-search/flow.e2e.ts         # E2E Playwright tests
```

## Unit Test Pattern (Vitest)
```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { computeMatchScore } from '../src/matching/scorer';

// Mock external dependencies — never call real APIs in unit tests
vi.mock('@digital-fte/llm/claude', () => ({
  claudeCall: vi.fn().mockResolvedValue({ matchScore: 87, breakdown: {...} })
}));

describe('computeMatchScore', () => {
  it('returns score between 0 and 100', async () => {
    const score = await computeMatchScore(mockJob, mockUserProfile);
    expect(score).toBeGreaterThanOrEqual(0);
    expect(score).toBeLessThanOrEqual(100);
  });

  it('returns 0 for completely mismatched profiles', async () => {
    const score = await computeMatchScore(techJob, marketingProfile);
    expect(score).toBeLessThan(20);
  });
});
```

## Agent Testing Pattern (LangGraph Agents)
```python
# services/*/tests/test_agent.py
import pytest
from unittest.mock import AsyncMock, patch

@pytest.mark.asyncio
async def test_job_search_agent_returns_deduplicated_results():
    """Agent must deduplicate jobs appearing on multiple platforms"""
    with patch('services.job_search_agent.tools.search_linkedin', new_callable=AsyncMock) as mock_li:
        with patch('services.job_search_agent.tools.search_indeed', new_callable=AsyncMock) as mock_in:
            mock_li.return_value = [SAMPLE_JOB_1, SAMPLE_JOB_2]
            mock_in.return_value = [SAMPLE_JOB_1, SAMPLE_JOB_3]  # JOB_1 is duplicate
            
            result = await job_search_agent.run(query="python developer", location="dubai")
            
            # Must deduplicate SAMPLE_JOB_1
            assert len(result.jobs) == 3  # Not 4
            assert result.jobs[0].match_score >= result.jobs[1].match_score  # Sorted by score

@pytest.mark.asyncio
async def test_auto_apply_agent_blocks_without_approval():
    """Human approval gate must NEVER be bypassed"""
    with patch('services.auto_apply_agent.review.wait_for_approval') as mock_approve:
        mock_approve.return_value = ApprovalResult(approved=False, skip_reason="user_skipped")
        result = await auto_apply_agent.process_application(SAMPLE_APPLICATION, user_id="test_user")
        assert result.status == "skipped"
        # Verify browser automation was NEVER called
        mock_browser.assert_not_called()
```

## ATS Score Test Suite
```typescript
// tests/ats/scoring.test.ts — Test all 23 checkpoints
const TEST_RESUMES = {
  perfect: loadFixture('resumes/perfect-score.pdf'),    // Should score 95+
  mediocre: loadFixture('resumes/mediocre.pdf'),        // Should score 55-70
  terrible: loadFixture('resumes/terrible.pdf'),        // Should score <30
};

it('perfect resume scores above 90', async () => {
  const score = await computeATSScore(TEST_RESUMES.perfect, SAMPLE_JD);
  expect(score.overall).toBeGreaterThan(90);
});

it('tables-based resume fails formatting checkpoint', async () => {
  const score = await computeATSScore(TABLE_BASED_RESUME, SAMPLE_JD);
  const formatCheck = score.checkpoints.find(c => c.id === 'no_tables');
  expect(formatCheck.passed).toBe(false);
});
```

## Platform Integration Tests (Use Stubs — Never Hit Real Platforms in Tests)
```typescript
// Use MSW (Mock Service Worker) for HTTP mocks
import { setupServer } from 'msw/node';
import { linkedinHandlers } from './mocks/linkedin';

const server = setupServer(...linkedinHandlers);
beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());
```

## E2E Test Pattern (Playwright — Scheduled Monthly)
```typescript
// tests/e2e/apply-flow.e2e.ts
// Runs against staging environment only — never production
test('complete apply flow: search → review → approve → submit', async ({ page }) => {
  await page.goto(STAGING_URL);
  await loginAsTestUser(page);
  await page.fill('[data-testid="job-search"]', 'product manager dubai');
  await page.click('[data-testid="search-btn"]');
  await expect(page.locator('[data-testid="job-result"]')).toHaveCount({ min: 1 });
  // ... complete flow
});
```
