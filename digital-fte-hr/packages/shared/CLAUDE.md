# Shared Package — Local Context
# This CLAUDE.md is for: packages/shared/
# Inherits root CLAUDE.md + adds shared utilities context

## What This Package Does
Shared TypeScript utilities, types, constants, and helpers used across ALL services.
If something is needed by more than one service, it lives here. Never duplicate code.

## Directory Structure
```
packages/shared/
├── src/
│   ├── types/
│   │   ├── index.ts            → Re-exports all types
│   │   ├── jobs.ts             → JobMatch, SupportedPlatform, JobSearchInput/Output
│   │   ├── resumes.ts          → ResumeProfile, ATSCheckpoint, ResumeOptimizationOutput
│   │   ├── applications.ts     → ApplicationQueueItem, SubmissionResult, ApplicationStatus
│   │   ├── notifications.ts    → NotificationEvent, NotificationEventType, ChannelPreference
│   │   └── plans.ts            → PlanTier, PLAN_TIERS feature matrix
│   ├── constants/
│   │   ├── platform-limits.ts  → PLATFORM_LIMITS per job board (rate limits)
│   │   ├── error-codes.ts      → ErrorCodes enum (single source of truth)
│   │   └── ats-thresholds.ts   → ATS_THRESHOLDS: RED=60, GREEN=75
│   ├── validation/
│   │   └── schemas.ts          → Shared Zod schemas (reused by API + agents)
│   ├── auth.ts                 → JWT verification, Cognito token parsing
│   ├── secrets.ts              → AWS Secrets Manager wrapper — getSecret(name)
│   ├── rate-limiter.ts         → Redis token bucket — check_and_consume()
│   ├── pii.ts                  → sanitizeForLLM(), maskPhone(), maskEmail()
│   ├── robots-checker.ts       → checkRobotsTxt(platform, url) before any scrape
│   ├── browser-profiles.ts     → Playwright user agent rotation pool
│   ├── audit.ts                → auditLog() — writes to DynamoDB audit_log table
│   └── suppression-list.ts     → isBlocked(), add(), remove() — all channels
└── tsconfig.json
```

## Key Exports (Import from @digital-fte/shared)
```typescript
// Types
import type { JobMatch, SupportedPlatform, PlanTier } from '@digital-fte/shared/types'

// Constants
import { PLATFORM_LIMITS, ErrorCodes, ATS_THRESHOLDS } from '@digital-fte/shared/constants'
// ATS_THRESHOLDS = { RED: 60, YELLOW_MIN: 60, YELLOW_MAX: 74, GREEN: 75 }
// NEVER hardcode 60 or 75 in agent code — always import ATS_THRESHOLDS

// Utilities
import { getSecret }          from '@digital-fte/shared/secrets'
import { sanitizeForLLM }     from '@digital-fte/shared/pii'
import { check_and_consume }  from '@digital-fte/shared/rate-limiter'
import { auditLog }           from '@digital-fte/shared/audit'
import { isBlocked, add }     from '@digital-fte/shared/suppression-list'
import { checkRobotsTxt }     from '@digital-fte/shared/robots-checker'
```

## ATS Thresholds (Single Source of Truth)
```typescript
// packages/shared/src/constants/ats-thresholds.ts
export const ATS_THRESHOLDS = {
  RED:    60,   // Below this: block export, mandatory improvement
  GREEN:  75,   // At or above: fully optimized, eligible for auto-apply
} as const

export function getATSZone(score: number): 'red' | 'yellow' | 'green' {
  if (score >= ATS_THRESHOLDS.GREEN) return 'green'
  if (score >= ATS_THRESHOLDS.RED)   return 'yellow'
  return 'red'
}
```

## Rules
- NEVER hardcode ATS score thresholds (60/75) — always import from ATS_THRESHOLDS
- NEVER hardcode platform rate limits — always import from PLATFORM_LIMITS
- NEVER hardcode error code strings — always import from ErrorCodes
- ALL PII sanitization must go through this package's pii.ts utilities
- getSecret() caches values for 5 minutes — safe to call on every Lambda cold start
