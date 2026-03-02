---
name: whatsapp-sender
description: Builds WhatsApp Business API integrations for Digital FTE using Twilio. Use when sending WhatsApp notifications, handling incoming WhatsApp messages, building message templates, implementing quiet hours enforcement, or processing /stop commands. Knows all 6 approved WhatsApp template SIDs and the complete message handling flow.
---

# WhatsApp Sender Skill — Digital FTE Channel Integration

## Tech Stack: Twilio WhatsApp Business API + Node.js TypeScript

## Approved Message Templates (Use EXACT Template SIDs)

| Template Name | SID | When to Use |
|---|---|---|
| `JOB_ALERT` | `HN_JOB_ALERT_V2` | New job matches found (max 3 jobs per message) |
| `APPLICATION_REVIEW` | `HN_APP_REVIEW_V1` | User must approve/reject a pending application |
| `WEEKLY_REPORT` | `HN_WEEKLY_RPT_V1` | Sunday evening weekly progress digest |
| `RESUME_SCORE` | `HN_RESUME_SCORE_V1` | ATS score result after optimization |
| `INTERVIEW_REMINDER` | `HN_INTERVIEW_V1` | Interview scheduled (24hr + 1hr before) |
| `ACCOUNT_ALERT` | `HN_ACCOUNT_V1` | Plan expiry, quota warnings, security alerts |

## Sending Outbound Messages

```typescript
// services/channel-orchestration/src/channels/whatsapp.ts
import twilio from 'twilio'
import { getSecret } from '../lib/secrets'
import { canSendNow } from '../lib/quiet-hours'
import { isOnSuppressionList } from '../lib/suppression'
import { logger } from '../lib/logger'
import { AuditLogger } from '../lib/audit'

const twilioClient = twilio(
  process.env.TWILIO_ACCOUNT_SID!,
  process.env.TWILIO_AUTH_TOKEN!,
)

const WHATSAPP_FROM = `whatsapp:${process.env.TWILIO_WHATSAPP_NUMBER}` // 'whatsapp:+14155238886'

interface WhatsAppMessage {
  to: string           // Phone with country code: '+923001234567'
  templateSid: string  // One of the 6 approved SIDs
  variables: Record<string, string>  // Template variable substitutions
  userId: string       // For audit logging
}

export async function sendWhatsAppMessage(msg: WhatsAppMessage): Promise<void> {
  const { to, templateSid, variables, userId } = msg
  const toAddress = `whatsapp:${to}`

  // 1. Check suppression list (MUST check before anything else)
  if (await isOnSuppressionList(userId, 'whatsapp')) {
    logger.info('WhatsApp suppressed — user opted out', { userId, to })
    return
  }

  // 2. Check quiet hours (11PM – 7AM user local time)
  const userTimezone = await getUserTimezone(userId)
  if (!canSendNow(userTimezone)) {
    // Queue for next morning at 7AM local time
    await queueForLater(msg, '07:00', userTimezone)
    logger.info('WhatsApp deferred — quiet hours', { userId, timezone: userTimezone })
    return
  }

  // 3. Audit log BEFORE sending
  await AuditLogger.log({
    userId,
    action: 'whatsapp.send',
    resourceId: to,
    before: null,
    after: { templateSid, variables },
  })

  // 4. Send via Twilio
  try {
    const message = await twilioClient.messages.create({
      from:               toAddress,
      to:                 toAddress,
      contentSid:         templateSid,
      contentVariables:   JSON.stringify(variables),
    })

    logger.info('WhatsApp sent', {
      userId,
      messageSid: message.sid,
      templateSid,
      status: message.status,
    })

  } catch (error: any) {
    logger.error('WhatsApp send failed', {
      userId, templateSid, to, error: error.message,
    })
    throw error
  }
}
```

## Template Variable Mappings

```typescript
// Template variable format for each approved template

// JOB_ALERT — up to 3 jobs
const jobAlertVariables = {
  '1': userName,          // "Ahmed"
  '2': jobCount.toString(), // "3"
  '3': jobs[0]?.title,   // "Senior Product Manager"
  '4': jobs[0]?.company, // "Careem"
  '5': jobs[0]?.score,   // "87"
  '6': jobs[1]?.title,   // "Product Lead"
  '7': jobs[1]?.company, // "Noon.com"
  '8': jobs[1]?.score,   // "82"
  '9': dashboardUrl,      // "https://app.digitalfte.com/jobs"
}

// APPLICATION_REVIEW — human-in-loop notification
const appReviewVariables = {
  '1': userName,          // "Fatima"
  '2': jobTitle,          // "Marketing Manager"
  '3': companyName,       // "Jumia"
  '4': atsScore,          // "78"
  '5': reviewUrl,         // "https://app.digitalfte.com/review/uuid"
  '6': expiresIn,         // "48 hours"
}

// WEEKLY_REPORT
const weeklyReportVariables = {
  '1': userName,
  '2': appsThisWeek,      // "12"
  '3': responseRate,      // "25%"
  '4': atsScore,          // "82"
  '5': weeklyScore,       // "76"  (composite KPI)
  '6': trend,             // "↑ 8pts from last week"
  '7': topPlatform,       // "LinkedIn (42% response rate)"
  '8': reportUrl,
}
```

## Incoming Message Handler (Webhook)

```typescript
// Process incoming WhatsApp messages from users
export async function handleIncomingWhatsApp(body: TwilioWebhookBody): Promise<void> {
  const from = body.From.replace('whatsapp:', '')  // '+923001234567'
  const messageText = body.Body?.trim().toLowerCase() ?? ''
  const userId = await getUserIdByPhone(from)

  if (!userId) {
    logger.warn('Unknown WhatsApp sender', { from })
    return
  }

  // Handle opt-out commands immediately (MUST be processed regardless of quiet hours)
  if (['stop', 'unsubscribe', 'cancel', 'quit', 'optout', 'opt out', 'opt-out'].includes(messageText)) {
    await addToSuppressionList(userId, 'whatsapp')
    await sendWhatsAppMessage({
      userId,
      to: from,
      templateSid: 'HN_ACCOUNT_V1',
      variables: {
        '1': 'You have been unsubscribed from WhatsApp notifications.',
        '2': 'You can re-enable them anytime in app Settings.',
      },
    })
    logger.info('User opted out of WhatsApp', { userId, from })
    return
  }

  // Handle 'START' — re-subscribe
  if (['start', 'subscribe', 'yes'].includes(messageText)) {
    await removeFromSuppressionList(userId, 'whatsapp')
    return
  }

  // Classify intent using Claude Haiku
  const intent = await classifyMessageIntent(messageText)

  // Route to appropriate agent/action
  await routeWhatsAppIntent(userId, intent, body)
}
```

## Quiet Hours Implementation

```typescript
// lib/quiet-hours.ts
import { DateTime } from 'luxon'

const QUIET_START = 23  // 11 PM
const QUIET_END   = 7   // 7 AM

export function canSendNow(timezone: string): boolean {
  const now = DateTime.now().setZone(timezone)
  const hour = now.hour

  // Quiet hours: 11PM (23:00) to 7AM (07:00)
  if (hour >= QUIET_START || hour < QUIET_END) {
    return false
  }
  return true
}

export function nextSendTime(timezone: string): DateTime {
  const now = DateTime.now().setZone(timezone)
  if (now.hour < QUIET_END) {
    // Already past midnight — send at 7AM today
    return now.set({ hour: QUIET_END, minute: 0, second: 0, millisecond: 0 })
  }
  // Before midnight — send at 7AM tomorrow
  return now.plus({ days: 1 }).set({ hour: QUIET_END, minute: 0, second: 0, millisecond: 0 })
}
```

## Signature Verification (Webhook Security)

```typescript
import twilio from 'twilio'

export function verifyTwilioSignature(
  authToken: string,
  signature: string,
  url: string,
  params: Record<string, string>
): boolean {
  return twilio.validateRequest(authToken, signature, url, params)
}

// ALWAYS call this before processing any webhook — return 403 if invalid
```

## Rules

- ALWAYS check suppression list before sending — opt-outs are legally binding (TCPA/GDPR)
- ALWAYS enforce quiet hours (11PM–7AM user local time) — defer, never skip
- ONLY use the 6 pre-approved Twilio template SIDs — free-form WhatsApp messages not allowed for business
- ALWAYS verify Twilio signature on incoming webhooks — reject 403 without processing
- Maximum 3 job listings per `JOB_ALERT` message — never exceed
- `/stop` and variants MUST be processed immediately — no quiet hours delay for opt-outs
- Audit log every sent message to DynamoDB — required for GDPR compliance
