# API Conventions & Patterns
# Loaded by: CLAUDE.md @import
# Apply when: building API routes, Lambda handlers, or service interfaces

## Phase 1 API Strategy: REST Only
GraphQL is NOT in Phase 1 scope. Do not create GraphQL resolvers, schemas, or types.
All endpoints are REST over API Gateway → Lambda. See architecture.md for data flow.

## REST API Endpoint Registry
```
# Auth
POST   /api/v1/auth/signup               → Create account
POST   /api/v1/auth/login                → Cognito auth
POST   /api/v1/auth/refresh              → Token refresh

# Jobs
POST   /api/v1/jobs/search               → Job Search Agent trigger (async, returns jobId)
GET    /api/v1/jobs/{id}                 → Single job detail
GET    /api/v1/jobs/search/{jobId}       → Poll async search status

# Resumes
POST   /api/v1/resumes                   → Upload/create resume
GET    /api/v1/resumes                   → List user resumes
GET    /api/v1/resumes/{id}              → Get resume with ATS score
POST   /api/v1/resumes/{id}/optimize     → Trigger optimization pipeline (async)
POST   /api/v1/resumes/{id}/tailor       → Tailor to specific job (async)
GET    /api/v1/resumes/{id}/score        → Get current ATS score + checkpoints

# Applications
GET    /api/v1/applications              → List all user applications (paginated)
POST   /api/v1/applications/queue        → Add job to auto-apply queue
PATCH  /api/v1/applications/{id}/approve → Human approval gate — triggers submission
PATCH  /api/v1/applications/{id}/skip    → Skip application
GET    /api/v1/applications/{id}         → Single application detail + status

# Dashboard
GET    /api/v1/dashboard/overview        → KPI summary (jobSearchScore, responseRate, etc.)
GET    /api/v1/dashboard/weekly          → Weekly metrics + chart data
GET    /api/v1/dashboard/monthly         → Monthly progress report
GET    /api/v1/dashboard/platforms       → Platform performance breakdown

# Channels
POST   /api/v1/channels/whatsapp/webhook → Twilio webhook (signature-verified)
POST   /api/v1/channels/telegram/webhook → Telegram webhook (secret-token-verified)
GET    /api/v1/channels/preferences      → User notification preferences
PATCH  /api/v1/channels/preferences      → Update notification preferences

# Tasks (async polling)
GET    /api/v1/tasks/{taskId}            → Poll async task status + result

# Plans
GET    /api/v1/plans                     → Available plans + current user plan
POST   /api/v1/plans/upgrade             → Initiate upgrade (Stripe redirect)

# GDPR
POST   /api/v1/account/delete            → Trigger full GDPR deletion cascade
GET    /api/v1/account/export            → Request PII data export
```

## Plan Tier Gates (requirePlan Middleware)
```typescript
// packages/shared/plans.ts
export const PLAN_TIERS = {
  free:  { applyDailyLimit: 0,   resumeCount: 1,  optimization: false, reporting: false },
  pro:   { applyDailyLimit: 50,  resumeCount: 10, optimization: true,  reporting: false },
  elite: { applyDailyLimit: 150, resumeCount: 999,optimization: true,  reporting: true  },
} as const

export type PlanTier = keyof typeof PLAN_TIERS

// Usage in handlers — always use withMiddleware({ planGate: 'pro' })
export const handler = withMiddleware({ auth: true, planGate: 'pro', rateLimit: { ... } }, async (event, ctx, { user }) => {
  // user.plan is guaranteed to be 'pro' or 'elite' here
})

// Plan gate behavior:
// - User is on wrong plan → 403 FORBIDDEN with { code: 'PLAN_UPGRADE_REQUIRED', requiredPlan: 'pro', upgradeUrl: '/plans' }
```

## Standard Response Envelope (All Responses — No Exceptions)
```typescript
type ApiResponse<T> = {
  success: boolean
  data?:   T
  error?:  { code: string; message: string; details?: unknown; retryAfter?: number; upgradeUrl?: string }
  meta?:   { page?: number; total?: number; processingTime?: number; taskId?: string }
}

// 200 Success
{ success: true, data: { jobs: [...], total: 47 }, meta: { processingTime: 2340 } }

// 202 Accepted (async job queued)
{ success: true, data: { taskId: 'task-abc', status: 'queued', pollUrl: '/api/v1/tasks/task-abc' } }

// 400 Validation error
{ success: false, error: { code: 'VALIDATION_ERROR', message: 'query is required', details: [{ field: 'query', issue: 'Required' }] } }

// 403 Plan gate
{ success: false, error: { code: 'PLAN_UPGRADE_REQUIRED', message: 'Auto-apply requires Pro plan', requiredPlan: 'pro', upgradeUrl: '/plans' } }

// 429 Rate limit
{ success: false, error: { code: 'RATE_LIMIT_EXCEEDED', message: 'Daily limit reached', retryAfter: 3600 } }
```

## Error Codes (Use Only These — Never Invent New Codes)
```typescript
// packages/shared/error-codes.ts
export const ErrorCodes = {
  VALIDATION_ERROR:        'VALIDATION_ERROR',        // 400 — Zod validation failed
  UNAUTHORIZED:            'UNAUTHORIZED',             // 401 — No/invalid JWT
  FORBIDDEN:               'FORBIDDEN',                // 403 — Auth OK but not permitted
  PLAN_UPGRADE_REQUIRED:   'PLAN_UPGRADE_REQUIRED',   // 403 — Feature requires higher plan
  NOT_FOUND:               'NOT_FOUND',                // 404
  CONFLICT:                'CONFLICT',                 // 409 — e.g. duplicate resume
  RATE_LIMIT_EXCEEDED:     'RATE_LIMIT_EXCEEDED',      // 429 — Redis token bucket empty
  PLATFORM_UNAVAILABLE:    'PLATFORM_UNAVAILABLE',    // 503 — Job platform is down
  LLM_ERROR:               'LLM_ERROR',                // 502 — Claude API error
  ATS_SCORE_TOO_LOW:       'ATS_SCORE_TOO_LOW',        // 422 — Resume blocked from export
  APPROVAL_REQUIRED:       'APPROVAL_REQUIRED',        // 422 — Application needs review
  DAILY_CAP_REACHED:       'DAILY_CAP_REACHED',        // 429 — 150 apps/day reached
} as const
```

## Async Pattern (Anything > 3 Seconds)
```typescript
// 1. Receive request → validate → enqueue → return 202 immediately
export const handler = withMiddleware({ auth: true }, async (event, ctx, { user }) => {
  const body   = parseBody(event)
  const taskId = await SQSQueue.enqueue('job-search-requests', { userId: user.id, ...body })
  return response202({ taskId, status: 'queued', pollUrl: `/api/v1/tasks/${taskId}` })
})

// 2. Client polls GET /api/v1/tasks/{taskId}
// → { status: 'queued' | 'processing' | 'complete' | 'failed', progress: 0.6, result?: {...} }

// ALWAYS async (never block Lambda beyond 25s):
// - Job search (scrapes multiple platforms)
// - Resume optimization (6 sub-agents)
// - Auto-apply submission (Playwright form fill)
```

## Pagination Standard
```typescript
// All list endpoints accept these query params:
// ?page=1&pageSize=20&sortBy=postedAt&sortDir=desc

type PaginatedResponse<T> = {
  success: true
  data: { items: T[]; total: number; page: number; pageSize: number; totalPages: number }
}
```
