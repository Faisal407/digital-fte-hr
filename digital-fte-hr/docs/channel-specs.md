# Channel Specifications
# Reference — load with @docs/channel-specs.md when building notification/channel code

## WhatsApp (Meta Cloud API via Twilio)

### Sending Messages
```typescript
// packages/shared/channels/whatsapp.ts
import twilio from 'twilio';
const client = twilio(process.env.TWILIO_SID, process.env.TWILIO_AUTH);

// Template message (only way to initiate outside 24hr session window)
await client.messages.create({
  from: 'whatsapp:+14155238886',        // Your Twilio WhatsApp number
  to: `whatsapp:${user.phoneE164}`,
  contentSid: 'HX...',                  // Meta-approved template SID
  contentVariables: JSON.stringify({
    "1": job.title,
    "2": job.company,
    "3": String(job.matchScore),
    "4": job.location,
    "5": job.salary || 'Not disclosed',
  }),
});
```

### Template SIDs (Approved — Do Not Change Without Meta Re-approval)
```typescript
export const WA_TEMPLATES = {
  JOB_ALERT:           'HX_JOB_ALERT_V1',         // New job alert card
  APP_REVIEW:          'HX_APP_REVIEW_V1',          // Application review request
  APP_STATUS_CHANGED:  'HX_STATUS_CHANGE_V1',       // Applied/Viewed/Shortlisted
  WEEKLY_REPORT:       'HX_WEEKLY_REPORT_V1',       // Weekly progress summary
  WELCOME:             'HX_WELCOME_V1',              // Onboarding welcome
  HIGH_MATCH_ALERT:    'HX_HIGH_MATCH_V1',          // >90% match instant alert
} as const;
```

### Incoming Webhook Handler
```typescript
// apps/api/src/webhooks/whatsapp.ts
export async function handleWhatsAppWebhook(req: Request) {
  const { Body, From, MessageType } = req.body;
  const phoneNumber = From.replace('whatsapp:', '');
  const user = await getUserByPhone(phoneNumber);

  if (!user) return handleUnknownUser(From);

  // Parse intent from message
  const intent = await classifyIntent(Body, user.conversationState);

  switch (intent.type) {
    case 'JOB_SEARCH':    return handleJobSearch(user, intent.query);
    case 'APPROVE_ALL':   return handleApproveAll(user);
    case 'VIEW_REPORT':   return handleSendWeeklyReport(user);
    case 'STOP':          return handleOptOut(user);
    default:              return handleConversational(user, Body);
  }
}
```

## Telegram Bot

### Bot Setup
```typescript
// services/channel-orchestration/src/telegram-gateway.ts
import TelegramBot from 'node-telegram-bot-api';
const bot = new TelegramBot(process.env.TELEGRAM_BOT_TOKEN, { polling: false });
// Webhook mode in production (not polling) — registered at startup
```

### Command Handlers Map
```typescript
const COMMAND_HANDLERS: Record<string, CommandHandler> = {
  '/start':     handleStart,        // Onboarding flow
  '/jobs':      handleJobSearch,    // Interactive job search
  '/resume':    handleResumeMenu,   // Resume management
  '/score':     handleATSScore,     // Run ATS score check
  '/apply':     handleReviewQueue,  // Open application queue
  '/status':    handleAppStatus,    // Application tracker
  '/alerts':    handleAlertSettings,// Notification preferences
  '/report':    handleReport,       // Instant progress report
  '/dashboard': handleOpenMiniApp,  // Launch Telegram Mini App
  '/upgrade':   handleUpgrade,      // Plan upgrade
  '/settings':  handleSettings,     // Profile settings
  '/help':      handleHelp,         // Command menu
  '/stop':      handleStop,         // Pause notifications
};
```

### Sending Rich Messages
```typescript
// Inline keyboard with job results
await bot.sendMessage(chatId, formatJobResults(jobs), {
  parse_mode: 'MarkdownV2',
  reply_markup: {
    inline_keyboard: [
      jobs.slice(0, 3).map((job, i) => ({
        text: `${i + 1}️⃣ ${job.company}`,
        callback_data: `job_detail:${job.id}`
      })),
      [
        { text: '✅ Save All', callback_data: 'save_all_jobs' },
        { text: '🔍 Refine', callback_data: 'refine_search' }
      ]
    ]
  }
});

// Mini App button
await bot.sendMessage(chatId, '📊 Open your full dashboard:', {
  reply_markup: {
    inline_keyboard: [[{
      text: '📈 Open Dashboard',
      web_app: { url: `${MINI_APP_URL}?userId=${encodeToken(user.id)}` }
    }]]
  }
});
```

## Email (Amazon SES + React Email)

### Sending Emails
```typescript
// packages/shared/channels/email.ts
import { SESClient, SendEmailCommand } from '@aws-sdk/client-ses';
import { render } from '@react-email/render';

async function sendEmail(to: string, template: EmailTemplate, vars: Record<string, unknown>) {
  const Component = EMAIL_TEMPLATES[template];
  const html = render(<Component {...vars} />);
  const text = render(<Component {...vars} />, { plainText: true });

  // Check suppression list first
  if (await isInSuppressionList(to)) return;

  await sesClient.send(new SendEmailCommand({
    Source: 'notifications@digitalfte.com',
    Destination: { ToAddresses: [to] },
    Message: {
      Subject: { Data: await generateSubjectLine(template, vars) },
      Body: {
        Html: { Data: html },
        Text: { Data: text },
      },
    },
    Tags: [
      { Name: 'template', Value: template },
      { Name: 'userId', Value: vars.userId as string },
    ],
  }));
}
```

### Email Template Registry
```typescript
// apps/email/src/templates/index.ts
export const EMAIL_TEMPLATES = {
  // Transactional (always send)
  'welcome':            WelcomeEmail,
  'verify-email':       VerifyEmail,
  'password-reset':     PasswordResetEmail,
  'application-sent':   ApplicationSentEmail,
  'status-changed':     StatusChangedEmail,

  // Subscription (respect user preferences)
  'job-alert-digest':   JobAlertDigestEmail,
  'weekly-report':      WeeklyReportEmail,
  'monthly-report':     MonthlyReportEmail,
  'follow-up-reminder': FollowUpReminderEmail,
  'high-match-alert':   HighMatchAlertEmail,
  'inactivity-reengagement': ReengagementEmail,
} as const;
```

### Unsubscribe Header (Required on All Non-Transactional Emails)
```typescript
// Must include on every marketing/subscription email
const headers = {
  'List-Unsubscribe': `<https://api.digitalfte.com/unsubscribe?token=${generateUnsubToken(userId, template)}>`,
  'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click',
};
```

## Quiet Hours Enforcement (All Channels)
```typescript
// packages/shared/quiet-hours.ts — call before EVERY notification send
export async function canSendNow(userId: string, channel: Channel): Promise<boolean> {
  const user = await getUserTimezone(userId);
  const localHour = getCurrentHourInTimezone(user.timezone);
  // Never send 11 PM – 7 AM local time
  if (localHour >= 23 || localHour < 7) return false;
  // Check if user has 24/7 alerts enabled
  const prefs = await getNotificationPreferences(userId);
  return prefs.allowAllHours ?? false;
}
```
