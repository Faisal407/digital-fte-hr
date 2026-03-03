---
name: lambda-handler
description: Generates production-ready AWS Lambda handlers for the Digital FTE API layer. Use when building any API endpoint, webhook receiver, SQS processor, EventBridge listener, or scheduled job. Automatically applies middleware chain (auth, rate limiting, validation, error handling), structured logging, and X-Ray tracing. Knows Digital FTE's async job pattern and standard response envelope.
---

# AWS Lambda Handler Skill — Digital FTE Backend

## Standard REST Handler (API Gateway → Lambda)

```typescript
// apps/api/src/handlers/jobs/search.ts
import type { APIGatewayProxyHandlerV2 } from 'aws-lambda'
import { z } from 'zod'
import { withMiddleware } from '../../middleware'
import { JobSearchService } from '../../services/job-search'
import { publishToSQS } from '../../lib/sqs'
import { logger } from '../../lib/logger'
import { ErrorCodes } from '@digital-fte/shared/error-codes'

// 1. Define input schema with Zod
const SearchSchema = z.object({
  query:     z.string().min(2).max(200),
  location:  z.string().max(100).optional(),
  platforms: z.array(z.string()).max(15).optional(),
  page:      z.number().int().min(1).max(100).default(1),
  pageSize:  z.number().int().min(1).max(50).default(20),
})

// 2. Handler with full middleware
export const handler: APIGatewayProxyHandlerV2 = withMiddleware(
  {
    auth:       true,       // Require JWT
    rateLimit:  { key: 'job-search', limit: 60, window: 3600 },  // 60/hr
    validate:   SearchSchema,
    plan:       'free',     // Minimum plan required
    log:        true,
  },
  async (event, context, { user, body }) => {
    const requestId = context.awsRequestId
    logger.info('Job search started', { requestId, userId: user.id, query: body.query })

    // 3. Async pattern — enqueue heavy work, return jobId immediately
    const jobId = await publishToSQS('job-search-requests', {
      userId: user.id, requestId, ...body,
    })

    logger.info('Job search queued', { requestId, jobId })

    // 4. Return 202 Accepted with tracking ID
    return {
      statusCode: 202,
      body: JSON.stringify({
        success: true,
        data: {
          jobId,
          status: 'queued',
          pollUrl: `/api/v1/tasks/${jobId}`,
          estimatedSeconds: 8,
        },
      }),
    }
  }
)
```

## Middleware Builder Pattern

```typescript
// apps/api/src/middleware/index.ts
import { APIGatewayProxyHandlerV2 } from 'aws-lambda'
import { verifyJWT } from './auth'
import { checkRateLimit } from './rate-limit'
import { validateBody } from './validate'
import { checkPlan } from './plans'
import { AuditLogger } from '../lib/audit'
import { logger } from '../lib/logger'
import { z } from 'zod'

interface MiddlewareConfig {
  auth?:      boolean
  rateLimit?: { key: string; limit: number; window: number }
  validate?:  z.ZodType<any>
  plan?:      'free' | 'pro' | 'elite'
  log?:       boolean
}

export function withMiddleware<T>(
  config: MiddlewareConfig,
  handler: (event: any, context: any, ctx: { user: any; body: T }) => Promise<any>
): APIGatewayProxyHandlerV2 {
  return async (event, context) => {
    const startTime = Date.now()
    let user = null

    try {
      // Auth
      if (config.auth) {
        user = await verifyJWT(event.headers?.authorization)
      }

      // Rate limit
      if (config.rateLimit && user) {
        await checkRateLimit(user.id, config.rateLimit)
      }

      // Plan check
      if (config.plan && user) {
        await checkPlan(user.id, config.plan)
      }

      // Body validation
      const body = config.validate
        ? config.validate.parse(JSON.parse(event.body ?? '{}'))
        : JSON.parse(event.body ?? '{}')

      // Execute handler
      const result = await handler(event, context, { user, body })

      if (config.log) {
        logger.info('Request completed', {
          path: event.rawPath,
          duration: Date.now() - startTime,
          status: result.statusCode,
        })
      }

      return result

    } catch (error: any) {
      return handleError(error, context.awsRequestId)
    }
  }
}
```

## SQS Worker Handler Pattern

```typescript
// services/job-search-agent/lambda/worker.ts
import type { SQSHandler, SQSRecord } from 'aws-lambda'
import { logger } from '../../lib/logger'
import { JobSearchAgent } from '../agent/graph'
import { updateTaskStatus } from '../../lib/tasks'
import { notifyUser } from '../../lib/notifications'

export const handler: SQSHandler = async (event) => {
  const results = await Promise.allSettled(
    event.Records.map(processRecord)
  )

  // SQS partial batch failure — only report failed messages
  const failedItems = results
    .map((r, i) => r.status === 'rejected' ? { itemIdentifier: event.Records[i].messageId } : null)
    .filter(Boolean)

  return { batchItemFailures: failedItems }
}

async function processRecord(record: SQSRecord) {
  const payload = JSON.parse(record.body)
  const { userId, requestId, query, location, platforms, page } = payload

  logger.info('Processing job search', { requestId, userId, query })

  try {
    await updateTaskStatus(requestId, 'processing')

    // Run LangGraph agent
    const result = await JobSearchAgent.run({ userId, query, location, platforms })

    await updateTaskStatus(requestId, 'complete', result)

    // Push real-time update via WebSocket
    await notifyUser(userId, {
      type: 'JOB_SEARCH_COMPLETE',
      payload: { requestId, jobCount: result.jobs.length },
    })

    logger.info('Job search complete', { requestId, count: result.jobs.length })

  } catch (error: any) {
    logger.error('Job search failed', { requestId, error: error.message })
    await updateTaskStatus(requestId, 'failed', { error: error.message })
    throw error  // Re-throw — SQS will retry up to maxReceiveCount
  }
}
```

## Webhook Handler (Signature Verification Required)

```typescript
// apps/api/src/handlers/webhooks/whatsapp.ts
import crypto from 'crypto'
import type { APIGatewayProxyHandlerV2 } from 'aws-lambda'
import { ChannelOrchestrationService } from '../../services/channel-orchestration'

export const handler: APIGatewayProxyHandlerV2 = async (event) => {
  // 1. ALWAYS verify signature first — reject before any processing
  const signature = event.headers?.['x-twilio-signature'] ?? ''
  const url = `https://${event.requestContext.domainName}${event.rawPath}`
  const isValid = verifyTwilioSignature(
    process.env.TWILIO_AUTH_TOKEN!,
    signature,
    url,
    parseUrlEncoded(event.body ?? '')
  )

  if (!isValid) {
    return { statusCode: 403, body: 'Invalid signature' }
  }

  // 2. Process webhook asynchronously (respond fast — WhatsApp timeout is 15s)
  const body = parseUrlEncoded(event.body ?? '')
  await ChannelOrchestrationService.handleWhatsAppMessage(body)

  // 3. Always respond with empty 200 to WhatsApp
  return { statusCode: 200, body: '' }
}
```

## Scheduled Job Handler (EventBridge)

```typescript
// apps/api/src/handlers/scheduled/weekly-reports.ts
import type { ScheduledHandler } from 'aws-lambda'
import { generateWeeklyReportsForAllUsers } from '../../services/reports'
import { logger } from '../../lib/logger'

// Runs every Sunday at 23:00 UTC — generates Monday morning reports
export const handler: ScheduledHandler = async (event) => {
  logger.info('Weekly report generation started', { scheduledTime: event.time })

  const result = await generateWeeklyReportsForAllUsers({
    batchSize: 100,      // Process 100 users at a time
    dryRun: false,
  })

  logger.info('Weekly reports complete', {
    total: result.total,
    succeeded: result.succeeded,
    failed: result.failed,
  })
}
```

## Error Response Builder

```typescript
// apps/api/src/lib/errors.ts
export function handleError(error: any, requestId: string) {
  if (error.name === 'ZodError') {
    return { statusCode: 400, body: JSON.stringify({ success: false, error: { code: 'VALIDATION_ERROR', message: 'Invalid request body', details: error.errors } }) }
  }
  if (error.name === 'UnauthorizedError') {
    return { statusCode: 401, body: JSON.stringify({ success: false, error: { code: 'UNAUTHORIZED', message: error.message } }) }
  }
  if (error.name === 'PlanUpgradeRequired') {
    return { statusCode: 402, body: JSON.stringify({ success: false, error: { code: 'PLAN_UPGRADE_REQUIRED', message: error.message, upgradeUrl: '/pricing' } }) }
  }
  if (error.name === 'RateLimitError') {
    return { statusCode: 429, body: JSON.stringify({ success: false, error: { code: 'RATE_LIMIT_EXCEEDED', message: error.message, retryAfter: error.retryAfter } }) }
  }
  // Unknown errors — never expose stack trace
  logger.error('Unhandled error', { requestId, error: error.message, stack: error.stack })
  return { statusCode: 500, body: JSON.stringify({ success: false, error: { code: 'INTERNAL_ERROR', message: 'Something went wrong' } }) }
}
```

## Rules

- ALWAYS use `withMiddleware()` wrapper — never write raw Lambda handlers
- ALWAYS return within 25 seconds — Lambda timeout is 30s for API routes
- ALWAYS use async SQS pattern for operations >3 seconds (job search, resume optimization, apply)
- NEVER expose raw error messages to client — sanitize via handleError()
- NEVER use console.log — always use `logger.info/warn/error` (structured JSON logs to CloudWatch)
- X-Ray tracing is auto-enabled in production via Lambda layer
