---
name: notification-dispatcher
description: Routes and dispatches notifications across all Digital FTE channels (WhatsApp, Telegram, Email, Push) from a single unified event. Use when implementing any notification sending logic — job alerts, application status updates, weekly reports, approval requests, or system messages. Handles channel priority, user preferences, quiet hours, deduplication, and fallback routing automatically.
---

# Notification Dispatcher Skill — Digital FTE

## Unified Notification Service

```typescript
// services/channel-orchestration/src/dispatcher.ts
import { SQSClient, SendMessageCommand } from '@aws-sdk/client-sqs'
import { getUserChannelPreferences } from './lib/preferences'
import { canSendNow } from './lib/quiet-hours'
import { dedupeCheck } from './lib/dedupe'
import { suppressionList } from './lib/suppression'
import type { NotificationEvent, ChannelPreference } from '@digital-fte/shared/types'

const sqs = new SQSClient({ region: process.env.AWS_REGION })

// ENTRY POINT — called by all agents to dispatch notifications
export async function dispatch(event: NotificationEvent): Promise<void> {
  const { userId, type, payload, channels, priority = 'normal' } = event

  // 1. Deduplication — prevent duplicate sends within TTL window
  const dedupeKey = `${userId}:${type}:${payload.jobId ?? payload.applicationId ?? ''}`
  if (await dedupeCheck.exists(dedupeKey, getTTL(type))) return

  // 2. Get user's channel preferences
  const prefs = await getUserChannelPreferences(userId)

  // 3. Determine which channels to use (requested ∩ enabled ∩ not suppressed)
  const activeChannels = await resolveChannels(userId, channels, prefs, priority)
  if (activeChannels.length === 0) return   // All channels suppressed or disabled

  // 4. Queue each channel dispatch (fan-out via SQS)
  await Promise.all(activeChannels.map(channel =>
    queueDispatch({ userId, channel, type, payload, priority })
  ))

  // 5. Mark as deduped
  await dedupeCheck.set(dedupeKey, getTTL(type))
}

async function resolveChannels(
  userId: string,
  requested: string[],
  prefs: ChannelPreference,
  priority: 'urgent' | 'normal' | 'low'
): Promise<string[]> {
  const resolved: string[] = []

  for (const channel of requested) {
    // Check user preference for this channel
    if (!prefs[channel]?.enabled) continue

    // Check suppression list
    if (await suppressionList.isBlocked(userId, channel)) continue

    // Check quiet hours (urgent messages bypass quiet hours)
    if (priority !== 'urgent' && !await canSendNow(userId, channel)) {
      await scheduleForLater(userId, channel, prefs)
      continue
    }

    resolved.push(channel)
  }

  return resolved
}
```

## Notification Event Types

```typescript
// @digital-fte/shared/types/notifications.ts

export type NotificationEventType =
  | 'JOB_ALERT_NEW'              // New job match found
  | 'JOB_ALERT_BATCH'            // Multiple jobs found (digest)
  | 'APPLICATION_QUEUED'         // New application waiting approval
  | 'APPLICATION_SUBMITTED'      // Application successfully submitted
  | 'APPLICATION_STATUS_CHANGED' // Recruiter viewed, shortlisted, etc.
  | 'RESUME_OPTIMIZATION_DONE'   // Resume scoring/optimization complete
  | 'ATS_SCORE_CHANGED'          // ATS score improved or dropped
  | 'WEEKLY_REPORT_READY'        // Sunday night report
  | 'INTERVIEW_REMINDER'         // 24hr before interview
  | 'PLAN_EXPIRING'              // Subscription renewal reminder
  | 'SYSTEM_MAINTENANCE'         // Scheduled downtime notice

export interface NotificationEvent {
  userId:    string
  type:      NotificationEventType
  payload:   Record<string, any>   // Type-specific data
  channels:  ('whatsapp' | 'telegram' | 'email' | 'push')[]
  priority:  'urgent' | 'normal' | 'low'
  dedupeKey?: string               // Override auto-generated dedup key
}
```

## Channel Priority Matrix

```typescript
// Default channel routing per event type
export const CHANNEL_PRIORITY: Record<NotificationEventType, {
  channels: string[]
  priority: 'urgent' | 'normal' | 'low'
  fallback?: string[]
}> = {
  JOB_ALERT_NEW:              { channels: ['whatsapp', 'telegram'],        priority: 'normal' },
  JOB_ALERT_BATCH:            { channels: ['whatsapp', 'telegram'],        priority: 'low'    },
  APPLICATION_QUEUED:         { channels: ['whatsapp', 'telegram', 'push'], priority: 'normal', fallback: ['email'] },
  APPLICATION_SUBMITTED:      { channels: ['telegram', 'email'],            priority: 'normal' },
  APPLICATION_STATUS_CHANGED: { channels: ['whatsapp', 'telegram', 'push'], priority: 'normal' },
  RESUME_OPTIMIZATION_DONE:   { channels: ['telegram', 'push'],             priority: 'normal' },
  ATS_SCORE_CHANGED:          { channels: ['telegram'],                     priority: 'low'    },
  WEEKLY_REPORT_READY:        { channels: ['email', 'whatsapp'],            priority: 'low'    },
  INTERVIEW_REMINDER:         { channels: ['whatsapp', 'push', 'email'],    priority: 'urgent' },
  PLAN_EXPIRING:              { channels: ['email', 'telegram'],             priority: 'normal' },
  SYSTEM_MAINTENANCE:         { channels: ['email'],                        priority: 'low'    },
}
```

## Deduplication TTL Strategy

```typescript
function getTTL(type: NotificationEventType): number {
  // Seconds to suppress duplicate notifications
  const TTL_MAP: Record<NotificationEventType, number> = {
    JOB_ALERT_NEW:              3600,        // 1hr — same job won't alert twice
    JOB_ALERT_BATCH:            86400,       // 24hr — one batch digest per day
    APPLICATION_QUEUED:         300,         // 5min — brief dedup window
    APPLICATION_SUBMITTED:      86400,       // 24hr — one confirmation per application
    APPLICATION_STATUS_CHANGED: 1800,        // 30min — status changes settle
    RESUME_OPTIMIZATION_DONE:   3600,        // 1hr
    ATS_SCORE_CHANGED:          86400,       // 24hr — once per day max
    WEEKLY_REPORT_READY:        604800,      // 7 days — one report per week
    INTERVIEW_REMINDER:         3600,        // 1hr — one reminder window
    PLAN_EXPIRING:              86400,       // 24hr — once per day
    SYSTEM_MAINTENANCE:         3600,        // 1hr
  }
  return TTL_MAP[type] ?? 3600
}
```

## Quiet Hours Scheduler

```typescript
// Schedule message for after quiet hours (7AM user's local time)
async function scheduleForLater(userId: string, channel: string, prefs: ChannelPreference) {
  const user = await getUser(userId)
  const userTz = user.timezone ?? 'UTC'
  const now = new Date()

  // Calculate next 7AM in user's timezone
  const sendAt = next7AM(userTz)
  const delaySeconds = Math.max(0, Math.floor((sendAt.getTime() - now.getTime()) / 1000))

  // SQS supports up to 900 seconds delay natively — for longer, use EventBridge
  if (delaySeconds <= 900) {
    await queueDispatch({ userId, channel, delaySeconds })
  } else {
    await scheduleEventBridge({ userId, channel, sendAt })
  }
}

function next7AM(timezone: string): Date {
  const now = new Date()
  // Use Intl to find next 7AM in user's tz
  const formatter = new Intl.DateTimeFormat('en', { timeZone: timezone, hour: 'numeric', hour12: false })
  const hour = parseInt(formatter.format(now))
  const msTill7 = ((7 - hour + 24) % 24) * 3600 * 1000
  return new Date(now.getTime() + msTill7)
}
```

## Usage by Agents

```typescript
// How agents call the dispatcher — one unified interface
import { dispatch } from '@digital-fte/channel-orchestration'

// Job Search Agent — new match found
await dispatch({
  userId:   user.id,
  type:     'JOB_ALERT_NEW',
  payload:  { jobId: job.id, title: job.title, company: job.company.name, matchScore: job.matchScore },
  channels: ['whatsapp', 'telegram'],
  priority: 'normal',
})

// Auto Apply Agent — needs approval
await dispatch({
  userId:   user.id,
  type:     'APPLICATION_QUEUED',
  payload:  { applicationId: app.id, jobTitle: app.jobTitle, company: app.company },
  channels: ['whatsapp', 'telegram', 'push'],
  priority: 'normal',
})

// Resume Builder Agent — optimization done
await dispatch({
  userId:   user.id,
  type:     'RESUME_OPTIMIZATION_DONE',
  payload:  { resumeId: resume.id, newScore: resume.atsScore, prevScore: resume.previousAtsScore },
  channels: ['telegram', 'push'],
  priority: 'normal',
})
```

## Rules

- NEVER call WhatsApp/Telegram/SES SDKs directly from agents — always use `dispatch()`
- ALWAYS include a `dedupeKey` or rely on auto-generation — never allow duplicate sends
- Urgent priority bypasses quiet hours but NOT suppression lists (/stop is permanent)
- Push notifications are supplementary — never use push as the only channel
- Log every dispatch attempt (success and suppressed) to DynamoDB for analytics
