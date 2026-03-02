# API Service — Local Context
# This CLAUDE.md is for: apps/api/
# Inherits root CLAUDE.md + adds API-specific rules

## What This Service Does
The REST API layer for Digital FTE. Runs as AWS Lambda functions behind API Gateway.
Handles all client requests (web/mobile), validates inputs, triggers agent jobs via SQS,
and manages user data via Prisma. REST only — no GraphQL in Phase 1.

## Tech Stack (This Service)
- **Language**: TypeScript (strict mode)
- **Runtime**: Node.js 20.x on AWS Lambda
- **Framework**: No framework — raw Lambda handlers with middleware pattern
- **Validation**: Zod for all inputs and LLM outputs
- **DB Access**: Prisma ORM via @digital-fte/db package
- **Auth**: Amazon Cognito JWT verification via @digital-fte/shared/auth
- **Rate Limiting**: Redis token bucket via @digital-fte/shared/rate-limiter

## Directory Structure
```
apps/api/
├── src/
│   ├── handlers/           → Lambda handler files (one per endpoint group)
│   │   ├── jobs/           → search.ts, detail.ts
│   │   ├── resumes/        → create.ts, optimize.ts, tailor.ts, score.ts
│   │   ├── applications/   → queue.ts, approve.ts, list.ts
│   │   ├── dashboard/      → overview.ts, weekly.ts, monthly.ts
│   │   ├── channels/       → whatsapp-webhook.ts, telegram-webhook.ts, preferences.ts
│   │   ├── tasks/          → poll.ts
│   │   └── plans/          → list.ts, upgrade.ts
│   ├── middleware/
│   │   ├── auth.ts         → JWT verification (Cognito)
│   │   ├── rate-limit.ts   → Redis token bucket per endpoint
│   │   ├── plan-gate.ts    → requirePlan() — blocks by plan tier
│   │   ├── validation.ts   → Zod body/query parsing
│   │   └── index.ts        → withMiddleware() composer
│   └── lib/
│       ├── response.ts     → response200(), response202(), response400(), etc.
│       └── async-job.ts    → enqueueJob(), pollJob() helpers
├── tests/
│   ├── unit/               → Handler unit tests (Vitest)
│   └── integration/        → Integration tests (with test DB + Redis)
└── tsconfig.json
```

## Handler Pattern (Always Use withMiddleware)
```typescript
// Every handler follows this exact pattern
import { withMiddleware } from '../middleware'
import { z } from 'zod'

const SearchSchema = z.object({
  query:    z.string().min(2).max(200),
  location: z.string().optional(),
  page:     z.number().int().min(1).default(1),
  pageSize: z.number().int().min(1).max(50).default(20),
})

export const handler = withMiddleware(
  {
    auth:      true,
    planGate:  'free',    // 'free' | 'pro' | 'elite'
    rateLimit: { key: 'jobs-search', limit: 60, windowSeconds: 3600 },
    bodySchema: SearchSchema,
  },
  async (event, ctx, { user, body }) => {
    const taskId = await SQSQueue.enqueue('job-search-requests', { userId: user.id, ...body })
    return response202({ taskId, pollUrl: `/api/v1/tasks/${taskId}` })
  }
)
```

## Key Rules (This Service)
1. NEVER read `userId` from request body/query — always from verified JWT (`user.id`)
2. NEVER skip Row-Level Security — every DB query must include `userId: user.id` filter
3. ALL handlers must use `withMiddleware()` — never raw Lambda handler function
4. Webhooks (WhatsApp/Telegram) skip auth middleware but MUST verify platform signature
5. Return 202 for anything that takes >3 seconds — always async with SQS
6. Cover every handler with unit tests — 80% minimum, 100% for auth/plan paths

## Local Development
```bash
pnpm --filter api dev        # Start serverless-offline (port 4000)
pnpm --filter api test       # Vitest unit tests
pnpm --filter api typecheck  # TypeScript check
```
