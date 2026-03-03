# Channel Orchestration Service — Local Context
# This CLAUDE.md is for: services/channel-orchestration/
# Inherits root CLAUDE.md + adds channel/notification-specific rules
# NOTE: This is the ONLY notification/messaging service — there is no separate "notification-agent"

## What This Service Does
The unified messaging gateway for Digital FTE. ALL outbound notifications (WhatsApp,
Telegram, Email) and ALL inbound channel webhooks flow through this service.
Agents NEVER call channel SDKs directly — they dispatch via SQS to this service.

## Tech Stack (This Service)
- **Language**: TypeScript (Node.js 20.x)
- **WhatsApp**: Twilio SDK (Meta Cloud API via BSP)
- **Telegram**: node-telegram-bot-api (webhook mode — NEVER polling in production)
- **Email**: Amazon SES + React Email
- **Queue**: Consumes from SQS `channel-events`
- **Scheduling**: EventBridge for deferred messages (quiet hours, weekly reports)

## Directory Structure
```
services/channel-orchestration/
├── src/
│   ├── dispatcher.ts         → Main entry — route NotificationEvent to correct channel
│   ├── channels/
│   │   ├── whatsapp.ts       → Twilio sender + template formatting
│   │   ├── telegram.ts       → Telegram sender + 14 command handlers + inline keyboards
│   │   └── email.ts          → SES sender + React Email rendering
│   ├── webhooks/
│   │   ├── whatsapp.ts       → Incoming WhatsApp webhook handler (signature-verified Lambda)
│   │   └── telegram.ts       → Incoming Telegram webhook handler (secret-token-verified Lambda)
│   ├── lib/
│   │   ├── quiet-hours.ts    → canSendNow() — blocks 11PM-7AM user local time
│   │   ├── suppression.ts    → isBlocked(), add(), remove() — shared with all channels
│   │   ├── dedupe.ts         → TTL-based deduplication — prevents duplicate sends
│   │   └── scheduler.ts      → Defer messages via EventBridge when quiet hours active
│   └── templates/            → React Email templates (.tsx)
│       ├── BaseEmail.tsx
│       ├── WeeklyJobDigest.tsx
│       ├── ApplicationSubmitted.tsx
│       └── Welcome.tsx
└── tests/
```

## Service Boundary (M-2 Fix — Definitive Answer)
```
channel-orchestration owns:
  - ALL outbound message sending (WhatsApp, Telegram, Email)
  - ALL inbound webhook processing (WhatsApp, Telegram)
  - Quiet hours enforcement, suppression list management, deduplication
  - Message scheduling (deferred sends via EventBridge)
  - User notification preference management

The 3 AI agents own:
  - Deciding WHAT to send (content, timing trigger)
  - Calling dispatch() with a NotificationEvent
  - Nothing else related to messaging

There is NO separate notification-agent service. The root CLAUDE.md now reflects this.
```

## Critical Rules
1. Check suppression list BEFORE any render, API call, or SDK initialization
2. Check quiet hours BEFORE sending — defer to next 7AM if blocked
3. Deduplicate BEFORE sending — use TTL cache per event type (see notification-dispatcher skill)
4. /stop (Telegram) and STOP (WhatsApp) must trigger suppression within 3 seconds — no async delay
5. Webhook handlers must verify platform signature BEFORE processing any payload
6. Log every attempt (success, suppressed, deferred, failed) to DynamoDB notification_log

## Commands
```bash
pnpm --filter channel-orchestration dev    # Start dev server
pnpm --filter channel-orchestration test   # Tests
# WhatsApp local testing: ngrok → Twilio webhook URL
# Telegram local testing: setWebhook to ngrok tunnel URL
```
