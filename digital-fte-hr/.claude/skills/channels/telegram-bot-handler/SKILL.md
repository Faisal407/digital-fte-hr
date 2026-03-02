---
name: telegram-bot-handler
description: Builds Telegram bot command handlers, inline keyboards, conversation flows, and Mini App integration for Digital FTE. Use when implementing any Telegram bot feature — slash commands (/jobs, /apply, /resume, /status, /stop), inline keyboards for job approval, callback query handlers, or the Telegram Mini App launch button. Enforces quiet hours, suppression list checks, and GDPR /stop command.
---

# Telegram Bot Handler Skill — Digital FTE

## Bot Setup (Webhook Mode — NOT polling)

```typescript
// services/channel-orchestration/src/telegram/bot.ts
import TelegramBot from 'node-telegram-bot-api'
import { getSecret } from '../lib/secrets'

let bot: TelegramBot

export async function getTelegramBot(): Promise<TelegramBot> {
  if (bot) return bot
  const token = await getSecret('TELEGRAM_BOT_TOKEN')
  bot = new TelegramBot(token, { webHook: true })  // Webhook — never polling in production
  return bot
}

// Set webhook on deploy
export async function setWebhook(url: string) {
  const b = await getTelegramBot()
  await b.setWebHook(`${url}/webhooks/telegram`, {
    secret_token: await getSecret('TELEGRAM_WEBHOOK_SECRET'),
    allowed_updates: ['message', 'callback_query', 'inline_query'],
    drop_pending_updates: true,
  })
}
```

## Webhook Handler (Lambda)

```typescript
// Verify secret token FIRST — reject before processing
export const handler: APIGatewayProxyHandlerV2 = async (event) => {
  const secretToken = event.headers?.['x-telegram-bot-api-secret-token']
  if (secretToken !== process.env.TELEGRAM_WEBHOOK_SECRET) {
    return { statusCode: 403, body: 'Forbidden' }
  }

  const update = JSON.parse(event.body ?? '{}')

  if (update.message) {
    await handleMessage(update.message)
  } else if (update.callback_query) {
    await handleCallbackQuery(update.callback_query)
  }

  return { statusCode: 200, body: 'ok' }
}
```

## Command Router (All 14 Commands)

```typescript
// services/channel-orchestration/src/telegram/commands.ts
const COMMAND_MAP: Record<string, CommandHandler> = {
  '/start':     handleStart,       // Onboarding flow — register user, show main menu
  '/jobs':      handleJobs,        // Trigger job search with current preferences
  '/resume':    handleResume,      // Show ATS score + optimization options
  '/score':     handleScore,       // Quick ATS score check
  '/apply':     handleApply,       // Show pending applications for approval
  '/status':    handleStatus,      // Application pipeline status
  '/alerts':    handleAlerts,      // Configure job alert preferences
  '/report':    handleReport,      // Weekly report on demand
  '/dashboard': handleDashboard,   // Open web dashboard link
  '/upgrade':   handleUpgrade,     // Show plan options
  '/settings':  handleSettings,    // Notification preferences
  '/help':      handleHelp,        // Command list
  '/stop':      handleStop,        // GDPR — disable ALL notifications immediately
  '/resume_upload': handleResumeUpload,  // Prompt user to send resume file
}

export async function handleMessage(message: TelegramMessage) {
  const text = message.text?.trim() ?? ''
  const userId = await getUserIdFromTelegramId(message.from.id)

  // Extract command (handle commands with @botname suffix)
  const command = text.split(' ')[0].split('@')[0].toLowerCase()
  const handler = COMMAND_MAP[command]

  if (handler) {
    await handler(message, userId)
  } else if (message.document || message.photo) {
    await handleFileUpload(message, userId)
  } else {
    await handleFreeText(message, userId)
  }
}
```

## /stop Command (GDPR — CRITICAL — Never Modify)

```typescript
async function handleStop(message: TelegramMessage, userId: string) {
  // 1. Add to suppression list — must happen BEFORE any response
  await suppressionList.add({ userId, channel: 'telegram', reason: 'user_stop_command' })

  // 2. Cancel all pending scheduled messages for this user
  await cancelPendingMessages(userId, 'telegram')

  // 3. Confirm to user (this is the ONLY message allowed after /stop)
  const bot = await getTelegramBot()
  await bot.sendMessage(message.chat.id,
    '✅ You have been unsubscribed from all Telegram notifications.\n\n' +
    'To re-enable, visit your dashboard settings or type /start again.'
  )

  // 4. Audit log (GDPR requirement)
  await auditLog({ userId, action: 'TELEGRAM_UNSUBSCRIBED', timestamp: new Date() })
}
```

## Job Approval Inline Keyboard

```typescript
// services/channel-orchestration/src/telegram/keyboards.ts
export function buildJobApprovalKeyboard(application: ApplicationReview): TelegramInlineKeyboard {
  return {
    inline_keyboard: [
      [
        { text: '✅ Approve & Apply', callback_data: `approve:${application.id}` },
        { text: '❌ Skip',            callback_data: `skip:${application.id}` },
      ],
      [
        { text: '📋 View Job Details', url: application.jobUrl },
        { text: '✏️ Edit Answers',    callback_data: `edit:${application.id}` },
      ],
    ]
  }
}

// Callback query handler
export async function handleCallbackQuery(query: TelegramCallbackQuery) {
  const [action, id] = (query.data ?? '').split(':')
  const userId = await getUserIdFromTelegramId(query.from.id)
  const bot = await getTelegramBot()

  switch (action) {
    case 'approve':
      await AutoApplyQueue.approve(id, userId)
      await bot.answerCallbackQuery(query.id, { text: '✅ Application approved! Submitting now...' })
      await bot.editMessageReplyMarkup({ inline_keyboard: [] }, {
        chat_id: query.message?.chat.id,
        message_id: query.message?.message_id,
      })
      break

    case 'skip':
      await AutoApplyQueue.skip(id, userId)
      await bot.answerCallbackQuery(query.id, { text: '⏭️ Skipped' })
      break

    case 'edit':
      // Enter edit flow
      await ConversationState.set(userId, { flow: 'edit_answers', applicationId: id, step: 0 })
      await bot.answerCallbackQuery(query.id)
      await bot.sendMessage(query.message!.chat.id, 'What would you like to change? Send your updated answer:')
      break
  }
}
```

## Job Alert Message Format

```typescript
export function buildJobAlertMessage(job: JobMatch): string {
  const score = job.matchScore
  const emoji = score >= 75 ? '🟢' : score >= 60 ? '🟡' : '🔴'

  return [
    `${emoji} *New Job Match — ${score}/100*`,
    '',
    `*${escapeMarkdown(job.title)}*`,
    `🏢 ${escapeMarkdown(job.company.name)}`,
    `📍 ${escapeMarkdown(job.location)}`,
    job.salary ? `💰 ${job.salary.currency} ${job.salary.min.toLocaleString()}–${job.salary.max.toLocaleString()}` : '',
    `🔗 Via ${job.platform}`,
    '',
    `_Posted ${formatRelativeTime(job.postedAt)}_`,
  ].filter(Boolean).join('\n')
}
```

## Quiet Hours Enforcement (MANDATORY on ALL outbound messages)

```typescript
// ALWAYS call this before ANY sendMessage call
export async function canSendNow(userId: string): Promise<boolean> {
  const user = await getUser(userId)
  const userTime = new Date().toLocaleTimeString('en', {
    timeZone: user.timezone ?? 'UTC',
    hour: 'numeric', hour12: false
  })
  const hour = parseInt(userTime)
  if (hour >= 23 || hour < 7) return false   // 11PM–7AM local — do not disturb

  return !await suppressionList.isBlocked(userId, 'telegram')
}

// Wrapper for all outbound sends
export async function safeSend(chatId: number, userId: string, text: string, options = {}) {
  if (!await canSendNow(userId)) {
    await scheduleMessage({ chatId, userId, text, options, sendAfter: next7AM(userId) })
    return
  }
  const bot = await getTelegramBot()
  await bot.sendMessage(chatId, text, { parse_mode: 'MarkdownV2', ...options })
}
```

## Telegram Mini App Launch Button

```typescript
export function buildMainMenuKeyboard(webAppUrl: string): TelegramInlineKeyboard {
  return {
    inline_keyboard: [
      [{ text: '🚀 Open Digital FTE Dashboard', web_app: { url: webAppUrl } }],
      [
        { text: '🔍 Job Search',    callback_data: 'quick:jobs' },
        { text: '📄 My Resume',     callback_data: 'quick:resume' },
      ],
      [
        { text: '📋 Pending Apps',  callback_data: 'quick:apply' },
        { text: '📊 My Progress',   callback_data: 'quick:report' },
      ],
    ]
  }
}
```

## Markdown Escaping (MarkdownV2 Required Characters)

```typescript
export function escapeMarkdown(text: string): string {
  return text.replace(/[_*[\]()~`>#+\-=|{}.!\\]/g, '\\$&')
}
// ALWAYS escape user-provided text before including in Telegram messages
// Unescaped special characters cause Telegram API 400 errors
```

## Rules

- ALWAYS use `MarkdownV2` parse mode (not Markdown or HTML) — escape all user text
- ALWAYS verify webhook secret token before processing any update
- ALWAYS check `canSendNow()` before every outbound message
- NEVER use polling (`webHook: false`) in production
- NEVER store chat_id as the user identifier — always map to internal userId
- `/stop` command must suppress immediately — cannot be deferred or delayed
