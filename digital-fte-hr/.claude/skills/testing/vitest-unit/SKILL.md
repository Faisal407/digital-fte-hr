---
name: vitest-unit
description: Writes Vitest unit and integration tests for Digital FTE TypeScript services (Next.js frontend, Lambda handlers, API routes, utility functions). Use when asked to write tests, improve coverage, or when creating a new module that needs tests. Knows Digital FTE's test structure, mock patterns for AWS SDK, database, and external APIs, and coverage targets (80% TypeScript, 100% critical paths).
---

# Vitest Unit Test Skill — Digital FTE TypeScript

## Test File Structure

```
apps/web/
  src/
    components/jobs/JobMatchCard.tsx
    components/jobs/__tests__/
      JobMatchCard.test.tsx       ← Component test
  app/(dashboard)/jobs/
    page.tsx
    __tests__/
      page.test.tsx               ← Page/route test
apps/api/
  src/
    handlers/jobs/search.ts
    handlers/jobs/__tests__/
      search.test.ts              ← Lambda handler test
    services/job-search/
      job-search.service.ts
      __tests__/
        job-search.service.test.ts
```

## Lambda Handler Test Pattern

```typescript
// apps/api/src/handlers/jobs/__tests__/search.test.ts
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { handler } from '../search'
import { publishToSQS } from '@/lib/sqs'
import { verifyJWT } from '@/middleware/auth'
import { checkRateLimit } from '@/middleware/rate-limit'

// Mock AWS SDK and internal modules
vi.mock('@/lib/sqs')
vi.mock('@/middleware/auth')
vi.mock('@/middleware/rate-limit')

const mockPublishToSQS = vi.mocked(publishToSQS)
const mockVerifyJWT    = vi.mocked(verifyJWT)
const mockRateLimit    = vi.mocked(checkRateLimit)

// Factory for mock API Gateway events
function buildEvent(body: object = {}, headers: Record<string, string> = {}) {
  return {
    rawPath:    '/api/v1/jobs/search',
    body:       JSON.stringify(body),
    headers:    { authorization: 'Bearer test-token', ...headers },
    requestContext: { domainName: 'api.digitalfte.com' },
  } as any
}

const mockContext = { awsRequestId: 'test-request-123' } as any

describe('Job Search Handler', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockVerifyJWT.mockResolvedValue({ id: 'user-123', email: 'test@example.com', plan: 'pro' })
    mockRateLimit.mockResolvedValue(true)
    mockPublishToSQS.mockResolvedValue('job-123')
  })

  describe('Happy Path', () => {
    it('should return 202 Accepted with jobId for valid search', async () => {
      const result = await handler(buildEvent({ query: 'Software Engineer', location: 'Dubai' }), mockContext)

      expect(result.statusCode).toBe(202)
      const body = JSON.parse(result.body)
      expect(body.success).toBe(true)
      expect(body.data.jobId).toBe('job-123')
      expect(body.data.status).toBe('queued')
      expect(body.data.pollUrl).toBe('/api/v1/tasks/job-123')
    })

    it('should publish correct payload to SQS', async () => {
      await handler(buildEvent({ query: 'Product Manager', location: 'Riyadh', page: 2 }), mockContext)

      expect(mockPublishToSQS).toHaveBeenCalledWith('job-search-requests', {
        userId:    'user-123',
        requestId: 'test-request-123',
        query:     'Product Manager',
        location:  'Riyadh',
        page:      2,
        pageSize:  20,
        platforms: undefined,
      })
    })
  })

  describe('Validation', () => {
    it('should return 400 for query shorter than 2 chars', async () => {
      const result = await handler(buildEvent({ query: 'a' }), mockContext)
      expect(result.statusCode).toBe(400)
      const body = JSON.parse(result.body)
      expect(body.error.code).toBe('VALIDATION_ERROR')
    })

    it('should return 400 for missing query', async () => {
      const result = await handler(buildEvent({}), mockContext)
      expect(result.statusCode).toBe(400)
    })

    it('should reject pageSize over 50', async () => {
      const result = await handler(buildEvent({ query: 'Engineer', pageSize: 51 }), mockContext)
      expect(result.statusCode).toBe(400)
    })
  })

  describe('Auth', () => {
    it('should return 401 when JWT is invalid', async () => {
      mockVerifyJWT.mockRejectedValue(Object.assign(new Error('Invalid token'), { name: 'UnauthorizedError' }))
      const result = await handler(buildEvent({ query: 'Engineer' }), mockContext)
      expect(result.statusCode).toBe(401)
    })
  })

  describe('Rate Limiting', () => {
    it('should return 429 when rate limit exceeded', async () => {
      mockRateLimit.mockRejectedValue(Object.assign(
        new Error('Rate limit exceeded'),
        { name: 'RateLimitError', retryAfter: 3600 }
      ))
      const result = await handler(buildEvent({ query: 'Engineer' }), mockContext)
      expect(result.statusCode).toBe(429)
      const body = JSON.parse(result.body)
      expect(body.error.code).toBe('RATE_LIMIT_EXCEEDED')
      expect(body.error.retryAfter).toBe(3600)
    })
  })
})
```

## React Component Test Pattern

```typescript
// apps/web/src/components/jobs/__tests__/JobMatchCard.test.tsx
import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { JobMatchCard } from '../JobMatchCard'
import type { JobMatch } from '@digital-fte/shared/types'

const mockJob: JobMatch = {
  id:         'job-abc',
  title:      'Senior Product Manager',
  company:    { id: 'co-1', name: 'Acme Corp' },
  location:   'Dubai, UAE',
  matchScore: 82,
  platform:   'linkedin',
  postedAt:   new Date().toISOString(),
  salary: { currency: 'AED', min: 20000, max: 30000, period: 'month' },
}

describe('JobMatchCard', () => {
  it('renders job title and company', () => {
    render(<JobMatchCard job={mockJob} />)
    expect(screen.getByText('Senior Product Manager')).toBeInTheDocument()
    expect(screen.getByText(/Acme Corp/)).toBeInTheDocument()
  })

  it('displays ATS score with correct color for green zone (75+)', () => {
    render(<JobMatchCard job={mockJob} />)
    const scoreEl = screen.getByTitle('ATS Score: 82/100 (green)')
    expect(scoreEl).toBeInTheDocument()
  })

  it('displays ATS score with warning color for yellow zone (60-74)', () => {
    render(<JobMatchCard job={{ ...mockJob, matchScore: 65 }} />)
    expect(screen.getByTitle('ATS Score: 65/100 (yellow)')).toBeInTheDocument()
  })

  it('displays salary range when provided', () => {
    render(<JobMatchCard job={mockJob} />)
    expect(screen.getByText(/AED 20,000/)).toBeInTheDocument()
  })

  it('calls onApply with jobId when Quick Apply clicked', async () => {
    const user = userEvent.setup()
    const onApply = vi.fn()
    render(<JobMatchCard job={mockJob} onApply={onApply} />)
    await user.click(screen.getByRole('button', { name: /quick apply/i }))
    expect(onApply).toHaveBeenCalledWith('job-abc')
  })

  it('disables save button while saving', async () => {
    const user = userEvent.setup()
    // onSave is a slow async operation
    const onSave = vi.fn(() => new Promise(r => setTimeout(r, 100)))
    render(<JobMatchCard job={mockJob} onSave={onSave} />)
    await user.click(screen.getByRole('button', { name: /save/i }))
    expect(screen.getByRole('button', { name: /saving/i })).toBeDisabled()
  })
})
```

## Service / Business Logic Tests

```typescript
// apps/api/src/services/job-search/__tests__/job-search.service.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { JobSearchService } from '../job-search.service'
import { jobRepository } from '@/repositories/job.repository'

vi.mock('@/repositories/job.repository')
const mockJobRepo = vi.mocked(jobRepository)

describe('JobSearchService', () => {
  describe('deduplication', () => {
    it('removes duplicate jobs across platforms by URL fingerprint', async () => {
      const rawJobs = [
        { id: '1', url: 'https://linkedin.com/jobs/123', title: 'Engineer' },
        { id: '2', url: 'https://indeed.com/viewjob?jk=abc', title: 'Engineer' },
        { id: '3', url: 'https://linkedin.com/jobs/123', title: 'Engineer' },  // Duplicate
      ]
      const result = await JobSearchService.deduplicate(rawJobs)
      expect(result).toHaveLength(2)
    })
  })

  describe('ghost job detection', () => {
    it('marks jobs posted more than 30 days ago as ghost jobs', async () => {
      const oldDate = new Date()
      oldDate.setDate(oldDate.getDate() - 31)
      const result = await JobSearchService.detectGhostJob({ postedAt: oldDate.toISOString() })
      expect(result.isGhost).toBe(true)
    })

    it('does not mark recent jobs as ghost jobs', async () => {
      const result = await JobSearchService.detectGhostJob({ postedAt: new Date().toISOString() })
      expect(result.isGhost).toBe(false)
    })
  })
})
```

## Vitest Config

```typescript
// vitest.config.ts (root)
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  test: {
    globals:     true,
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    coverage: {
      provider:   'v8',
      reporter:   ['text', 'lcov', 'json-summary'],
      thresholds: {
        lines:    80,    // Fail CI below 80%
        branches: 75,
        functions:80,
      },
      exclude: ['**/*.test.*', '**/test/**', '**/__mocks__/**', 'src/test/**'],
    },
  },
  resolve: {
    alias: { '@': path.resolve(__dirname, './src') },
  },
})
```

## Coverage Targets

```
TypeScript (Lambda handlers, services, utils):  80% minimum
React components:                               80% minimum
Critical paths (auth, rate limit, ATS scoring): 100% required
Python agents:                                  75% minimum (see pytest-agent skill)
```

## Rules

- ALWAYS mock external services (SQS, RDS, Redis, Anthropic API) — never hit real services in tests
- ALWAYS use `userEvent` (not `fireEvent`) for user interaction tests — more realistic
- NEVER use `any` type in test files — mock return types must be typed
- Test file must live in `__tests__/` folder adjacent to the file under test
- Run: `pnpm test` (watch), `pnpm test:ci` (once with coverage), `pnpm test:ui` (Vitest UI)
