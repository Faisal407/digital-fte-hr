---
name: api-route-builder
description: Designs and scaffolds complete REST API routes for Digital FTE — including URL structure, HTTP methods, request/response contracts, OpenAPI spec entries, and route handler stubs. Use when adding new API endpoints, designing new resource routes, documenting existing endpoints, or reviewing API consistency. Knows all 15 core Digital FTE API resources and naming conventions.
---

# API Route Builder Skill — Digital FTE REST API

## Base URL & Versioning
```
Production:  https://api.digitalfte.com/v1
Staging:     https://api-staging.digitalfte.com/v1
Local:        http://localhost:4000/v1
WebSocket:   wss://ws.digitalfte.com
```

## Complete API Surface (All 15 Resources)

### Auth Routes
```
POST   /auth/register            Register new user (email + password)
POST   /auth/login               Login → JWT + refresh token
POST   /auth/refresh             Refresh access token
POST   /auth/logout              Invalidate refresh token
POST   /auth/forgot-password     Send password reset email
POST   /auth/reset-password      Apply new password with reset token
GET    /auth/me                  Get current authenticated user
```

### User & Profile Routes
```
GET    /users/profile             Get full user profile
PUT    /users/profile             Update profile fields
POST   /users/profile/photo       Upload profile photo → S3
POST   /users/profile/voice       Upload voice recording for profile extraction
GET    /users/preferences         Get job search preferences
PUT    /users/preferences         Update preferences
GET    /users/subscription        Current plan + usage stats
POST   /users/subscription/upgrade Initiate plan upgrade
```

### Resume Routes
```
GET    /resumes                   List user's resumes (paginated)
POST   /resumes                   Create new resume (upload/form/linkedin)
GET    /resumes/:id               Get specific resume with ATS score
PUT    /resumes/:id               Update resume metadata
DELETE /resumes/:id               Delete resume (soft delete)
POST   /resumes/:id/optimize      Trigger optimization → returns taskId (202)
GET    /resumes/:id/ats-score     Get ATS score for specific job description
POST   /resumes/:id/export        Export as PDF or DOCX → returns download URL
GET    /resumes/:id/versions      List all optimization versions
POST   /resumes/:id/restore/:ver  Restore a specific version
```

### Job Search Routes
```
GET    /jobs                      Search jobs (triggers agent) → taskId (202)
GET    /jobs/:id                  Get job details
POST   /jobs/:id/save             Save job to wishlist
DELETE /jobs/:id/save             Remove from wishlist
GET    /jobs/saved                List saved jobs
GET    /jobs/recommended          Get AI-recommended jobs (cached)
POST   /jobs/:id/match-score      Calculate match score against specific resume
```

### Application Routes
```
GET    /applications              List applications with status (paginated)
POST   /applications              Create application record (manual)
GET    /applications/:id          Get application details + timeline
PUT    /applications/:id          Update application status or notes
DELETE /applications/:id          Remove from tracker (soft delete)
GET    /applications/pending-review  Applications awaiting user approval (CRITICAL)
POST   /applications/:id/approve  Approve auto-apply (human-in-loop gate)
POST   /applications/:id/reject   Reject auto-apply
POST   /applications/:id/defer    Defer review to scheduledAt timestamp
```

### Task Polling Routes (Async Operations)
```
GET    /tasks/:taskId             Poll async task status + progress
GET    /tasks                     List recent tasks for current user
```

### Analytics Routes
```
GET    /analytics/weekly          Weekly progress summary
GET    /analytics/monthly         Monthly career report
GET    /analytics/platforms       Performance breakdown by job platform
GET    /analytics/funnel          Application pipeline funnel data
GET    /analytics/ats-trend       ATS score over time
```

### Notification Routes
```
GET    /notifications/preferences    Get channel preferences (WhatsApp/Telegram/Email)
PUT    /notifications/preferences    Update channel preferences
POST   /notifications/test           Send test notification on each channel
POST   /notifications/unsubscribe    Opt-out from all notifications
```

### Channel Routes (Webhooks — Internal Only)
```
POST   /webhooks/whatsapp         Twilio WhatsApp incoming webhook
POST   /webhooks/telegram         Telegram Bot webhook
POST   /webhooks/email-bounce     SES bounce/complaint webhook
```

## Standard Response Envelope

Every API response follows this exact envelope — no exceptions:

```typescript
// packages/shared/src/types/api-response.ts

// Success response
interface SuccessResponse<T> {
  success: true
  data: T
  meta?: {
    page?:       number
    pageSize?:   number
    total?:      number
    totalPages?: number
    hasMore?:    boolean
    taskId?:     string      // For async operations
    pollUrl?:    string
    cached?:     boolean
    cacheAge?:   number      // seconds
  }
}

// Error response
interface ErrorResponse {
  success: false
  error: {
    code:    ErrorCode        // See enum below
    message: string           // Human readable
    details?: unknown         // Validation errors, field paths etc
    retryAfter?: number       // Seconds, for rate limit errors
    upgradeUrl?: string       // For plan errors
  }
}

// Error codes enum
type ErrorCode =
  | 'VALIDATION_ERROR'
  | 'UNAUTHORIZED'
  | 'FORBIDDEN'
  | 'NOT_FOUND'
  | 'CONFLICT'
  | 'RATE_LIMIT_EXCEEDED'
  | 'PLAN_UPGRADE_REQUIRED'
  | 'QUOTA_EXHAUSTED'
  | 'AGENT_UNAVAILABLE'
  | 'PLATFORM_RATE_LIMITED'
  | 'HUMAN_APPROVAL_REQUIRED'
  | 'INTERNAL_ERROR'
```

## Async Operation Pattern (202 → Poll → WebSocket Push)

For operations taking >3 seconds (job search, resume optimization, auto-apply):

```
Client                          API                      Agent (SQS)
  │                              │                           │
  │  POST /jobs?query=...        │                           │
  │ ────────────────────────────>│                           │
  │                              │ Publish to SQS            │
  │                              │ ─────────────────────────>│
  │  202 { taskId, pollUrl }     │                           │ Processing...
  │ <────────────────────────────│                           │
  │                              │                           │
  │  GET /tasks/:taskId          │                           │
  │ ────────────────────────────>│                           │
  │  200 { status: "processing", │                           │
  │        progress: 40 }        │                           │
  │ <────────────────────────────│                           │
  │                              │                           │ Done!
  │  WS: JOB_SEARCH_COMPLETE     │<──────────────────────────│
  │ <════════════════════════════│                           │
  │                              │                           │
  │  GET /tasks/:taskId          │                           │
  │ ────────────────────────────>│                           │
  │  200 { status: "complete",   │                           │
  │        data: { jobs: [...] }}│                           │
  │ <────────────────────────────│                           │
```

## Route Handler Stub Template

```typescript
// apps/api/src/handlers/{resource}/{action}.ts
import type { APIGatewayProxyHandlerV2 } from 'aws-lambda'
import { z } from 'zod'
import { withMiddleware } from '../../middleware'
// import services, schemas etc.

const RequestSchema = z.object({
  // Define input schema
})

export const handler: APIGatewayProxyHandlerV2 = withMiddleware(
  {
    auth:      true,
    rateLimit: { key: 'resource-action', limit: 60, window: 3600 },
    validate:  RequestSchema,
    plan:      'free',
  },
  async (event, context, { user, body }) => {
    // TODO: Implement handler logic

    return {
      statusCode: 200,
      body: JSON.stringify({ success: true, data: {} }),
    }
  }
)
```

## API Rules

- All timestamps in responses must be ISO 8601 with UTC timezone (`2024-03-15T10:30:00Z`)
- All IDs are UUIDs — never expose sequential integer IDs publicly
- DELETE operations are always soft-deletes (set `deletedAt`) — never hard-delete user data
- GET requests never mutate state — side effects only via POST/PUT/PATCH/DELETE
- Paginated endpoints default to `pageSize: 20`, max `pageSize: 50`
- CORS: `Access-Control-Allow-Origin` only for approved origins — not `*`
- All webhook endpoints must be in `/webhooks/` prefix and excluded from public rate limiting
