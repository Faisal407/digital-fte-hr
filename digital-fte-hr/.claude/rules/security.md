# Security & Compliance Rules
# Loaded by: CLAUDE.md @import
# Apply when: handling user data, auth, API keys, PII, or any external calls

## API Keys & Secrets (Zero Tolerance)
- NEVER hardcode API keys, tokens, or passwords anywhere in code
- NEVER log API keys, bearer tokens, or user passwords — use `redact(value)` helper
- All secrets live in AWS Secrets Manager — access via `packages/shared/secrets.ts`
- Local dev uses `.env.local` (gitignored) — never `.env` committed to git
- If you see a secret in code, stop and fix it before doing anything else

```typescript
// WRONG — never do this
const client = new Anthropic({ apiKey: "sk-ant-..." });

// CORRECT
import { getSecret } from '@digital-fte/shared/secrets';
const apiKey = await getSecret('anthropic/api-key');
const client = new Anthropic({ apiKey });
```

## PII Handling Rules
- **Resume data**: Encrypted AES-256 in S3 (SSE-KMS), never logged in plaintext
- **Phone numbers**: Stored in E.164 format, never logged — use `maskPhone(phone)` in logs
- **Email addresses**: Never in URL params or query strings — POST body only
- **Voice recordings**: Delete from S3 within 24hr of successful transcription
- **LLM inputs**: Strip PII identifiers (passport numbers, SSNs, bank details) before sending to Claude API
- Use `packages/shared/pii.ts` → `sanitizeForLLM(text)` before ALL Claude API calls

## Authentication Rules
```typescript
// Every API route must use this middleware
import { requireAuth } from '@digital-fte/api/middleware/auth';
import { requirePlan } from '@digital-fte/api/middleware/plans';

// Protect routes properly
router.post('/apply', requireAuth, requirePlan('pro'), applyHandler);

// Row-level security — ALWAYS scope queries to authenticated user
const resume = await db.resumeProfile.findFirst({
  where: { id: resumeId, userId: req.user.id }  // NEVER skip userId check
});
```

## GDPR Compliance (Non-Negotiable)
- Any new table storing user PII must be registered in `packages/db/gdpr-registry.ts`
- Deletion cascade: when user account deleted, ALL user data must be purged within 30 days
- Data export: every PII field must appear in `packages/db/gdpr-export.ts` export function
- Never store data beyond its stated retention period — use `expires_at` columns with cleanup jobs
- Right to erasure applies to: PostgreSQL rows, S3 files, Redis keys, OpenSearch documents, DynamoDB records

## WhatsApp / Telegram Compliance
- WhatsApp: never send messages outside 7 AM – 11 PM user local timezone
- WhatsApp: always check suppression list before any outbound message
- Telegram: bot must respond to /stop command within 3 seconds — unsubscribe immediately
- All opt-ins must be double-confirmed and timestamped in `user_channels` table

## Audit Logging (Mandatory for All Agent Actions)
```typescript
import { auditLog } from '@digital-fte/shared/audit';

// Log BEFORE and AFTER every significant agent action
await auditLog({
  userId: user.id,
  agentName: 'AutoApplyAgent',
  action: 'SUBMIT_APPLICATION',
  inputHash: hashObject(applicationData),  // Hash not raw data
  metadata: { jobId, platform, resumeVersionId },
  status: 'PENDING'
});
// ... do the action ...
await auditLog({ ...same, status: 'SUCCESS', outputHash: hashObject(result) });
```

## Job Board ToS Compliance
- Respect robots.txt — `packages/shared/robots-checker.ts` must be called before any scrape
- Rate limits are in `packages/shared/constants/platform-limits.ts` — never change without legal review
- Auto-apply: maximum 150 applications per user per day (hard stop in Redis)
- Playwright user agent must be rotated — use `packages/shared/browser-profiles.ts`
- Never create fake accounts on any platform — only operate on user's own authenticated session

## Input Validation
```typescript
// ALL API inputs validated with Zod before processing — no exceptions
import { z } from 'zod';
const JobSearchSchema = z.object({
  query: z.string().min(2).max(200),
  location: z.string().max(100).optional(),
  platforms: z.array(z.enum(SUPPORTED_PLATFORMS)).max(15),
});
// Always parse, never trust raw input
const validated = JobSearchSchema.parse(req.body);
```
