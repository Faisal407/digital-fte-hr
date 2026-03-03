# Compliance & Legal Framework — Digital FTE for HR
# Reference doc — load with @docs/compliance.md
# NEVER build features that violate these rules — they are legal requirements

## GDPR Compliance (EU/UK Users — Mandatory)

### Data Subject Rights Implementation
```typescript
// packages/db/gdpr-registry.ts — EVERY table storing PII must be registered here
export const PII_TABLES = [
  'user_profile',         // name, email, phone, location, preferences
  'resume_profile',       // full resume content — highly sensitive
  'job_application',      // application history — behavioral data
  'conversation_state',   // WhatsApp/Telegram conversation context
  'notification_log',     // delivery records with channel + timestamp
  'answer_memory_bank',   // user's screening question answers
  'push_notification_token',
  'audit_log',            // contains userId + action — must be anonymized on deletion
] as const

// Deletion SLA: ALL user data must be purged within 30 days of deletion request
// Right to erasure applies to: PostgreSQL, S3, Redis, OpenSearch, DynamoDB
```

### Deletion Cascade (Mandatory for All New PII Tables)
```typescript
// packages/db/gdpr-deletion.ts
export async function executeGDPRDeletion(userId: string): Promise<void> {
  // 1. Mark account as deletion-pending (user cannot re-register for 30 days)
  await db.user.update({ where: { id: userId }, data: { status: 'deletion_pending', deletionRequestedAt: new Date() } })
  // 2. Immediate: revoke all active sessions (Cognito + Redis)
  await revokeAllSessions(userId)
  // 3. Queue full cascade (async — completes within 30 days max, target 24hrs)
  await SQSQueue.enqueue('gdpr-deletion', { userId, requestedAt: new Date() })
  // Cascade deletes: all PII_TABLES rows, S3 resume files, S3 screenshots,
  // OpenSearch documents, Redis keys, voice recordings, push tokens
}
```

### Data Minimization Rules
- **Resume data**: Encrypted AES-256 in S3 (SSE-KMS) — never stored in database as text
- **Phone numbers**: E.164 format, never in logs — use `maskPhone('+971501234567')` → `'+971***4567'`
- **Email addresses**: Never in URL parameters — POST body only
- **Voice recordings**: Auto-deleted from S3 within 24 hours of successful transcription
- **LLM inputs**: Strip PII (passport numbers, SSNs, bank details) via `sanitizeForLLM()` before every Claude API call
- **Screening answers**: Never log raw answers — log only `questionFingerprint + answerHash`

### Retention Periods
```
Resume files:        Active account + 2 years after last login
Application data:    Active account + 1 year after last login
Audit logs:          7 years (legal compliance) → anonymize userId after 2 years
Voice recordings:    24 hours maximum
Browser screenshots: 90 days (application proof)
Conversation state:  30 days inactivity
Redis session data:  24 hours rolling
```

## CAN-SPAM Compliance (US Email)

### Required Headers (All Outbound Emails)
```typescript
// MANDATORY on every SES send — email-composer skill enforces this
Headers: [
  { Name: 'List-Unsubscribe', Value: `<${unsubUrl}>, <mailto:unsubscribe@digitalfte.com?subject=unsubscribe>` },
  { Name: 'List-Unsubscribe-Post', Value: 'List-Unsubscribe=One-Click' },  // RFC 8058
]
// Physical address must appear in every email footer: "Digital FTE · 123 Innovation Drive · Dubai, UAE"
// Unsubscribe link: must work within 10 business days of click (target: immediate)
// Subject lines: must not be deceptive — no misleading preview text
```

### Email Categories
```
Transactional (CAN-SPAM exempt — always send):
  welcome, email-verification, password-reset, application-submitted, plan-upgrade-confirmation

Subscription (user-controlled — check suppression list BEFORE sending):
  weekly-job-digest, job-alert, resume-score-report, monthly-progress-report

RULE: Transactional emails bypass suppression list. Subscription emails do NOT.
```

## WhatsApp Policy Compliance (Meta Cloud API)

### Messaging Rules
- **Approved templates only**: All outbound messages outside 24-hour session window MUST use Meta-approved template SIDs
- **Quiet hours**: Never send between 11PM–7AM user local timezone
- **Suppression**: Always check suppression list — /STOP keyword removes user immediately
- **Double opt-in**: Users must confirm WhatsApp subscription via welcome flow before any alerts
- **No bulk broadcast**: WhatsApp is 1-to-1 only — never loop-send identical messages to multiple users simultaneously
- **Template re-approval**: Any change to template wording requires new Meta approval before use

### Approved Template SIDs (Do Not Modify Without Meta Re-approval)
```typescript
export const WA_TEMPLATES = {
  JOB_ALERT:          'HX_JOB_ALERT_V1',
  APP_REVIEW:         'HX_APP_REVIEW_V1',
  APP_STATUS_CHANGED: 'HX_STATUS_CHANGE_V1',
  WEEKLY_REPORT:      'HX_WEEKLY_REPORT_V1',
  WELCOME:            'HX_WELCOME_V1',
  HIGH_MATCH_ALERT:   'HX_HIGH_MATCH_V1',
} as const
```

## Job Board Terms of Service Compliance

### Scraping Rules
```typescript
// ALWAYS call before any scrape — packages/shared/robots-checker.ts
await checkRobotsTxt(platform, targetUrl)  // Throws if disallowed

// Rate limits — packages/shared/constants/platform-limits.ts
// NEVER change without legal review
export const PLATFORM_LIMITS = {
  linkedin:    { requestsPerMinute: 10, dailyPerUser: 100 },
  indeed:      { requestsPerMinute: 20, dailyPerUser: 200 },
  naukrigulf:  { requestsPerMinute: 5,  dailyPerUser: 50  },
  bayt:        { requestsPerMinute: 5,  dailyPerUser: 50  },
  glassdoor:   { requestsPerMinute: 8,  dailyPerUser: 80  },
} as const

// User agent rotation: packages/shared/browser-profiles.ts
// NEVER create fake accounts — only operate on user's own authenticated session
// Auto-apply daily hard cap: 150 applications across ALL platforms (enforced in Redis)
```

### Ghost Job Policy
- Jobs posted > 30 days without removal are flagged `isGhost: true`
- Ghost jobs shown with warning badge — user can still apply but is informed
- Never suppress ghost jobs from results entirely — user decides

## AI Bias & Fair Hiring Compliance

### Anti-Discrimination Rules for LLM Outputs
```
Claude prompts for job matching MUST include:
  "Do not adjust match scores based on candidate name, implied gender, age,
   nationality, religion, or any protected characteristic.
   Base scoring only on skills, experience, and stated job requirements."

Resume optimization MUST include:
  "Do not remove, alter, or suggest changes to content that reveals the
   candidate's protected characteristics (university name, location, languages).
   Only optimize for clarity, impact, and ATS keyword matching."
```

### Bias Audit (Quarterly)
- Sample 1,000 applications across demographic segments
- Compare average match scores, optimization suggestions, and application outcomes
- Flag any statistically significant disparity for manual review
- Document findings in compliance log

## Telegram Compliance
- `/stop` command must trigger immediate suppression (within 3 seconds, no delays)
- Bot must respond to `/start` command and show privacy notice before first interaction
- No unsolicited messages — user must initiate first interaction
- All opt-ins timestamped in `user_channels` table with explicit consent record
