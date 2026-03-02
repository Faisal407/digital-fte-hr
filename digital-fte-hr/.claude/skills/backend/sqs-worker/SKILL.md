---
name: sqs-worker
description: Builds SQS queue consumers, dead-letter queue handlers, and message routing logic for Digital FTE's async processing layer. Use when creating or modifying queue processors for job search, resume optimization, auto-apply, notifications, or report generation. Knows queue names, message schemas, retry policies, and partial batch failure patterns.
---

# SQS Worker Skill — Digital FTE Async Processing

## Queue Inventory

| Queue Name | Trigger | DLQ | Max Retries | Visibility Timeout |
|---|---|---|---|---|
| `fte-job-search-requests` | API /jobs | `fte-job-search-dlq` | 3 | 120s |
| `fte-resume-optimize` | API /resumes/:id/optimize | `fte-resume-dlq` | 2 | 300s |
| `fte-auto-apply` | User approval | `fte-apply-dlq` | 1 | 600s |
| `fte-notifications` | Agent completions | `fte-notify-dlq` | 5 | 30s |
| `fte-report-generate` | Scheduler | `fte-report-dlq` | 2 | 600s |
| `fte-platform-scrape` | Job search fan-out | `fte-scrape-dlq` | 3 | 90s |

## Standard SQS Worker Pattern

```typescript
// services/{service}/src/workers/{name}.worker.ts
import type { SQSHandler, SQSRecord, SQSBatchResponse } from 'aws-lambda'
import { logger } from '../lib/logger'
import { updateTaskStatus } from '../lib/tasks'
import { MessageSchema } from '../schemas/messages'  // Always validate!

export const handler: SQSHandler = async (event): Promise<SQSBatchResponse> => {
  logger.info('Batch received', { batchSize: event.Records.length })

  const results = await Promise.allSettled(
    event.Records.map(record => processRecord(record))
  )

  // Partial batch failure — SQS will retry only failed messages
  const batchItemFailures = results
    .flatMap((result, index) =>
      result.status === 'rejected'
        ? [{ itemIdentifier: event.Records[index].messageId }]
        : []
    )

  if (batchItemFailures.length > 0) {
    logger.warn('Partial batch failure', {
      total: event.Records.length,
      failed: batchItemFailures.length,
      failedIds: batchItemFailures.map(f => f.itemIdentifier),
    })
  }

  return { batchItemFailures }
}

async function processRecord(record: SQSRecord): Promise<void> {
  const messageId = record.messageId
  const receiveCount = Number(record.attributes.ApproximateReceiveCount)

  // Parse and validate message
  const raw = JSON.parse(record.body)
  const message = MessageSchema.parse(raw)   // Throws ZodError if invalid

  logger.info('Processing message', {
    messageId,
    receiveCount,
    type: message.type,
    userId: message.userId,
  })

  // Mark as processing in DB
  await updateTaskStatus(message.taskId, 'processing', { receiveCount })

  try {
    await processMessage(message)
    logger.info('Message processed', { messageId })

  } catch (error: any) {
    const isLastAttempt = receiveCount >= MAX_ATTEMPTS[message.type] ?? 3

    logger.error('Message processing failed', {
      messageId, receiveCount, isLastAttempt, error: error.message
    })

    if (isLastAttempt) {
      // Final attempt — update task to failed before going to DLQ
      await updateTaskStatus(message.taskId, 'failed', { error: error.message })
      await notifyUserOfFailure(message.userId, message.taskId)
    }

    throw error  // Re-throw to trigger SQS retry / DLQ
  }
}

const MAX_ATTEMPTS: Record<string, number> = {
  JOB_SEARCH:        3,
  RESUME_OPTIMIZE:   2,
  AUTO_APPLY:        1,   // Never retry apply automatically
  NOTIFICATION:      5,
  REPORT_GENERATE:   2,
}
```

## Message Publisher Utility

```typescript
// packages/shared/src/lib/sqs.ts
import { SQSClient, SendMessageCommand, SendMessageBatchCommand } from '@aws-sdk/client-sqs'
import { randomUUID } from 'crypto'
import { logger } from './logger'

const sqs = new SQSClient({ region: process.env.AWS_REGION })

const QUEUE_URLS: Record<string, string> = {
  'job-search-requests': process.env.SQS_JOB_SEARCH_URL!,
  'resume-optimize':     process.env.SQS_RESUME_OPTIMIZE_URL!,
  'auto-apply':          process.env.SQS_AUTO_APPLY_URL!,
  'notifications':       process.env.SQS_NOTIFICATIONS_URL!,
  'report-generate':     process.env.SQS_REPORT_GENERATE_URL!,
  'platform-scrape':     process.env.SQS_PLATFORM_SCRAPE_URL!,
}

export async function publishToSQS<T extends Record<string, unknown>>(
  queueName: keyof typeof QUEUE_URLS,
  payload: T,
  options?: {
    deduplicationId?: string  // FIFO queues only
    groupId?: string           // FIFO queues only
    delaySeconds?: number      // 0-900
  }
): Promise<string> {
  const messageId = randomUUID()
  const url = QUEUE_URLS[queueName]

  if (!url) throw new Error(`Unknown queue: ${queueName}`)

  const command = new SendMessageCommand({
    QueueUrl:               url,
    MessageBody:            JSON.stringify({ ...payload, _messageId: messageId, _publishedAt: new Date().toISOString() }),
    MessageGroupId:         options?.groupId,
    MessageDeduplicationId: options?.deduplicationId,
    DelaySeconds:           options?.delaySeconds,
    MessageAttributes: {
      queueName: { DataType: 'String', StringValue: queueName },
    },
  })

  await sqs.send(command)
  logger.info('Published to SQS', { queueName, messageId, payloadKeys: Object.keys(payload) })
  return messageId
}

// Fan-out: publish same message to multiple queues
export async function fanOutToQueues<T>(
  queues: Array<keyof typeof QUEUE_URLS>,
  payload: T
): Promise<void> {
  await Promise.all(queues.map(q => publishToSQS(q, payload as Record<string, unknown>)))
}
```

## Dead Letter Queue Handler (Alerting + Manual Recovery)

```typescript
// services/dlq-processor/src/handler.ts
import type { SQSHandler } from 'aws-lambda'
import { publishMetric } from '../lib/cloudwatch'
import { sendSlackAlert } from '../lib/slack'
import { logger } from '../lib/logger'

// Triggered when messages fail all retries and land in DLQ
export const handler: SQSHandler = async (event) => {
  for (const record of event.Records) {
    const body = JSON.parse(record.body)
    const sourceQueue = record.eventSourceARN.split(':').pop()?.replace('-dlq', '') ?? 'unknown'

    logger.error('Message landed in DLQ', {
      sourceQueue,
      messageId: record.messageId,
      receiveCount: record.attributes.ApproximateReceiveCount,
      userId: body.userId,
      taskId: body.taskId,
    })

    // Emit CloudWatch metric for alerting
    await publishMetric('DLQ_MESSAGE_RECEIVED', 1, { queue: sourceQueue })

    // Alert engineering team for critical queues
    if (['auto-apply', 'resume-optimize'].includes(sourceQueue)) {
      await sendSlackAlert({
        channel: '#alerts-dlq',
        severity: 'HIGH',
        title: `DLQ message: ${sourceQueue}`,
        body: `userId: ${body.userId}\ntaskId: ${body.taskId}\nerror: ${body.error ?? 'unknown'}`,
      })
    }

    // DLQ records are left in DLQ for manual inspection — not auto-deleted
    // Use AWS console or fte-dlq-recover CLI tool for manual replay
  }
}
```

## Job Search Fan-Out Pattern

```typescript
// When a user searches, we fan out to all requested platforms in parallel
export async function fanOutJobSearch(request: JobSearchRequest): Promise<void> {
  const platforms = request.platforms ?? DEFAULT_ACTIVE_PLATFORMS
  const batchSize = 3  // Max 3 platforms per SQS message for Lambda concurrency

  const batches = chunk(platforms, batchSize)

  await Promise.all(batches.map((platformBatch, batchIndex) =>
    publishToSQS('platform-scrape', {
      ...request,
      platforms: platformBatch,
      batchIndex,
      totalBatches: batches.length,
    }, {
      delaySeconds: batchIndex * 2,   // Stagger to avoid burst
    })
  ))
}
```

## Rules

- ALWAYS return `batchItemFailures` from SQS handlers — never silently swallow errors
- ALWAYS validate message body with Zod before processing — invalid messages → immediate DLQ
- Auto-apply queue: `maxReceiveCount: 1` — failed applications must NEVER auto-retry
- Notification queue: use FIFO + deduplication ID to prevent duplicate sends
- DLQ messages are NEVER auto-deleted — always alert on DLQ activity and recover manually
- Set `visibilityTimeout` 6x the expected processing time (Lambda timeout + agent runtime)
