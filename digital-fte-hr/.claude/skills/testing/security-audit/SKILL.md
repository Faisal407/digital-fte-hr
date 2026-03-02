---
name: security-audit
description: Audits Digital FTE code for security vulnerabilities — hardcoded secrets, SQL injection, missing auth checks, GDPR violations, unsafe rate limiting, exposed PII in logs, and insecure Playwright patterns. Use when reviewing PRs, auditing a service before release, or when asked to security-review any code in the Digital FTE codebase. Produces a prioritized finding report with CRITICAL/HIGH/MEDIUM/LOW severity.
---

# Security Audit Skill — Digital FTE

## Audit Checklist (Run In This Order)

### CRITICAL — Must Fix Before Merge

**1. Hardcoded Secrets**
```typescript
// ❌ CRITICAL — Any of these patterns in source code
const API_KEY     = 'sk-ant-...'
const DB_PASSWORD = 'postgres123'
const JWT_SECRET  = 'my-secret'
process.env.SECRET = '...'   // Setting secrets in env, not reading

// ✅ CORRECT
const apiKey = await getSecret('ANTHROPIC_API_KEY')  // AWS Secrets Manager always
```

**2. Missing Authentication**
```typescript
// ❌ CRITICAL — Lambda handler without auth
export const handler: APIGatewayProxyHandlerV2 = async (event) => {
  const userId = event.queryStringParameters?.userId  // Trust user input!
  return getApplications(userId)
}

// ✅ CORRECT — withMiddleware enforces auth
export const handler = withMiddleware({ auth: true }, async (event, ctx, { user }) => {
  return getApplications(user.id)  // User ID from verified JWT only
})
```

**3. Missing Row-Level Security**
```typescript
// ❌ CRITICAL — Gets ANY user's data if ID is guessed
const apps = await db.application.findMany({ where: { id: applicationId } })

// ✅ CORRECT — Always scope to authenticated user
const apps = await db.application.findMany({
  where: { id: applicationId, userId: user.id }  // BOTH conditions required
})
```

**4. SQL / NoSQL Injection**
```typescript
// ❌ CRITICAL — Never interpolate user input into queries
const result = await db.$queryRaw(`SELECT * FROM jobs WHERE title = '${userInput}'`)

// ✅ CORRECT — Always use parameterized queries
const result = await db.$queryRaw`SELECT * FROM jobs WHERE title = ${userInput}`
// Or Prisma ORM methods (safe by design)
const result = await db.job.findMany({ where: { title: userInput } })
```

### HIGH — Fix This Sprint

**5. PII in Logs**
```typescript
// ❌ HIGH — SSN, email, name logged in plaintext
logger.info('Processing user', { ssn: user.ssn, fullName: user.name, email: user.email })

// ✅ CORRECT — Log only non-PII identifiers
logger.info('Processing user', { userId: user.id, requestId })
// PII in logs violates GDPR Article 32
```

**6. Missing Webhook Signature Verification**
```typescript
// ❌ HIGH — Accepting webhook without verifying sender
export const handler = async (event) => {
  const body = JSON.parse(event.body)
  await processWebhook(body)  // Anyone can call this!
}

// ✅ CORRECT — Verify signature before processing
export const handler = async (event) => {
  if (!verifyTwilioSignature(event)) return { statusCode: 403 }
  if (!verifyTelegramToken(event.headers)) return { statusCode: 403 }
  // Then process
}
```

**7. Missing Rate Limiting**
```typescript
// ❌ HIGH — Expensive operations without rate limiting
export const handler = withMiddleware({ auth: true }, ...)  // No rateLimit config!

// ✅ CORRECT — All authenticated endpoints must have rate limiting
export const handler = withMiddleware({
  auth: true,
  rateLimit: { key: 'endpoint-name', limit: 60, window: 3600 }
}, ...)
```

**8. Unsafe Playwright — Sensitive Field Auto-Fill**
```python
# ❌ HIGH — Filling all fields including sensitive ones
for field_name, selector in FIELD_MAP.items():
    await page.fill(selector, profile.get(field_name, ''))

# ✅ CORRECT — Use safe_fill() which blocks SSN, passport, bank fields
for field_name, selector in FIELD_MAP.items():
    await self.safe_fill(selector, profile.get(field_name, ''), field_name)
```

### MEDIUM — Fix This Month

**9. GDPR — Missing Data Deletion Cascade**
```typescript
// ❌ MEDIUM — Deleting user without cascading
await db.user.delete({ where: { id: userId } })

// ✅ CORRECT — Register and execute full deletion cascade
await GDPRDeletionCascade.execute(userId, [
  'application', 'resume', 'jobAlert', 'conversationState',
  'notificationLog', 'auditLog', 'pushToken',
])
```

**10. Unvalidated Redirect**
```typescript
// ❌ MEDIUM — Open redirect vulnerability
const returnUrl = event.queryStringParameters?.returnTo
return redirect(returnUrl)  // Attacker can redirect to phishing site

// ✅ CORRECT — Whitelist allowed redirect destinations
const ALLOWED_HOSTS = ['app.digitalfte.com', 'digitalfte.com']
if (!ALLOWED_HOSTS.some(h => returnUrl?.startsWith(`https://${h}`))) {
  returnUrl = 'https://app.digitalfte.com/dashboard'
}
```

**11. Missing CAPTCHA — Auto-Apply Bypass**
```python
# ❌ MEDIUM — Continuing form fill after CAPTCHA detection
if 'recaptcha' in page.content():
    pass   # Ignore CAPTCHA and continue!

# ✅ CORRECT — Stop and notify user
if await self.check_captcha():
    raise CAPTCHADetected("CAPTCHA at form step — workflow paused")
```

### LOW — Fix Next Quarter

**12. Missing X-Frame-Options / CSP Headers**
```typescript
// ✅ Add to Next.js next.config.ts
const securityHeaders = [
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'Content-Security-Policy', value: "default-src 'self'; script-src 'self' 'unsafe-inline'" },
]
```

## Automated Security Scan Commands

```bash
# TypeScript/Node.js
pnpm audit --audit-level=high
npx snyk test --severity-threshold=high

# Python
uv run pip-audit --desc --fix
uv run bandit -r services/ -ll   # Python security linting

# Secrets scanning (run before every PR)
trufflehog git file://. --since-commit HEAD --only-verified

# OWASP Dependency Check
npx owasp-dependency-check --project "DigitalFTE" --scan .
```

## Security Finding Report Format

```markdown
## Security Audit Report — [Service Name] — [Date]

### Summary
| Severity | Count | Fixed | Outstanding |
|----------|-------|-------|-------------|
| CRITICAL |   0   |   0   |      0      |
| HIGH     |   2   |   1   |      1      |
| MEDIUM   |   3   |   3   |      0      |
| LOW      |   5   |   0   |      5      |

### Findings

#### [CRITICAL] Hardcoded API Key in services/resume-builder/config.ts:42
- **File:** `services/resume-builder/config.ts`, line 42
- **Code:** `const key = 'sk-ant-abc123...'`
- **Impact:** Full Anthropic API access compromise
- **Fix:** Use `await getSecret('ANTHROPIC_API_KEY')` via AWS Secrets Manager
- **Status:** ⚠️ Outstanding
```

## Rules

- CRITICAL findings block all merges — must be fixed before PR can land
- HIGH findings must be fixed in the same sprint as discovery
- Run secret scan (`trufflehog`) on every commit — pre-commit hook recommended
- Audit logs for every data access must be written to DynamoDB (GDPR Article 30)
- Any finding involving auto-apply safety checks is automatically elevated to CRITICAL
