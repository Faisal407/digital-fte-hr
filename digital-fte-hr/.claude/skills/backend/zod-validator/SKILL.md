---
name: zod-validator
description: Creates Zod validation schemas for all Digital FTE API inputs, database models, agent payloads, and shared types. Use when defining any TypeScript type that crosses a boundary — API request/response, SQS message, agent input/output, webhook payload, or environment variable. Generates runtime-safe schemas with descriptive error messages and OpenAPI-compatible definitions.
---

# Zod Validator Skill — Digital FTE Schema Library

## Core Schema Patterns

### API Request Schemas (Always Validate These First)

```typescript
// packages/shared/src/schemas/api.ts
import { z } from 'zod'

// --- Pagination (reused everywhere) ---
export const PaginationSchema = z.object({
  page:     z.coerce.number().int().min(1).max(500).default(1),
  pageSize: z.coerce.number().int().min(1).max(50).default(20),
  cursor:   z.string().optional(),
})

// --- Job Search Request ---
export const JobSearchRequestSchema = z.object({
  query:     z.string().trim().min(2, 'Search query must be at least 2 characters').max(200),
  location:  z.string().trim().max(100).optional(),
  platforms: z.array(
    z.enum(['linkedin','indeed','naukrigulf','bayt','rozee_pk','greenhouse',
            'lever','workday','taleo','icims','ziprecruiter','glassdoor',
            'monster','careerbuilder','wuzzuf','tanqeeb'])
  ).max(15).optional(),
  salaryMin: z.coerce.number().min(0).max(10_000_000).optional(),
  salaryMax: z.coerce.number().min(0).max(10_000_000).optional(),
  jobType:   z.enum(['full_time','part_time','contract','freelance','internship']).optional(),
  remote:    z.boolean().optional(),
}).refine(
  (d) => !d.salaryMin || !d.salaryMax || d.salaryMin <= d.salaryMax,
  { message: 'salaryMin must be less than or equal to salaryMax', path: ['salaryMin'] }
).merge(PaginationSchema)

// --- Resume Optimization Request ---
export const ResumeOptimizeRequestSchema = z.object({
  resumeId:   z.string().uuid('Invalid resume ID format'),
  targetJobId: z.string().uuid().optional(),
  jobDescription: z.string().max(10_000).optional(),
  optimizationLevel: z.enum(['light', 'standard', 'aggressive']).default('standard'),
  preserveFormatting: z.boolean().default(true),
})

// --- Application Approval Request ---
export const ApplicationApprovalSchema = z.object({
  reviewId:    z.string().uuid(),
  decision:    z.enum(['approve', 'reject', 'defer']),
  notes:       z.string().max(1000).optional(),
  scheduledAt: z.string().datetime({ offset: true }).optional(), // ISO 8601 with timezone
}).refine(
  (d) => d.decision !== 'defer' || !!d.scheduledAt,
  { message: 'scheduledAt is required when decision is defer', path: ['scheduledAt'] }
)

// --- User Profile Update ---
export const UserProfileUpdateSchema = z.object({
  fullName:      z.string().trim().min(2).max(100).optional(),
  headline:      z.string().trim().max(200).optional(),
  phone:         z.string().regex(/^\+?[1-9]\d{6,14}$/, 'Invalid phone number').optional(),
  location:      z.string().trim().max(100).optional(),
  linkedinUrl:   z.string().url().startsWith('https://linkedin.com').optional(),
  skills:        z.array(z.string().trim().max(60)).max(50).optional(),
  targetSalary:  z.object({
    min:      z.number().min(0),
    max:      z.number().min(0),
    currency: z.string().length(3).toUpperCase(),
    period:   z.enum(['monthly', 'annual']),
  }).optional(),
  jobPreferences: z.object({
    titles:     z.array(z.string()).max(10),
    locations:  z.array(z.string()).max(10),
    remote:     z.boolean(),
    jobTypes:   z.array(z.enum(['full_time','part_time','contract','freelance'])),
    industries: z.array(z.string()).max(10),
  }).optional(),
})
```

### Agent Payload Schemas (SQS Message Bodies)

```typescript
// packages/shared/src/schemas/agents.ts

// --- Job Search Agent Input ---
export const JobSearchAgentInputSchema = z.object({
  userId:    z.string().uuid(),
  requestId: z.string().uuid(),
  query:     z.string().min(2).max(200),
  location:  z.string().optional(),
  platforms: z.array(z.string()).optional(),
  pageSize:  z.number().int().positive().max(50).default(20),
  deduplicate: z.boolean().default(true),
})

// --- Job Match Output ---
export const JobMatchSchema = z.object({
  id:          z.string(),
  externalId:  z.string(),
  platform:    z.string(),
  title:       z.string(),
  company: z.object({
    name:     z.string(),
    logoUrl:  z.string().url().optional(),
    size:     z.string().optional(),
    industry: z.string().optional(),
  }),
  location:    z.string(),
  remote:      z.boolean(),
  postedAt:    z.string().datetime(),
  applyUrl:    z.string().url(),
  matchScore:  z.number().int().min(0).max(100),
  scoreBreakdown: z.object({
    skills:        z.number().min(0).max(100),
    experience:    z.number().min(0).max(100),
    education:     z.number().min(0).max(100),
    location:      z.number().min(0).max(100),
    salary:        z.number().min(0).max(100),
    culture:       z.number().min(0).max(100),
  }),
  isGhostJob:  z.boolean().default(false),
  salary: z.object({
    min:      z.number(),
    max:      z.number(),
    currency: z.string(),
    period:   z.enum(['monthly','annual']),
  }).optional(),
})

export type JobMatch = z.infer<typeof JobMatchSchema>

// --- ATS Score Result ---
export const ATSScoreResultSchema = z.object({
  overall:    z.number().int().min(0).max(100),
  grade:      z.enum(['red', 'yellow', 'green']),
  canExport:  z.boolean(),  // false if overall < 60
  checkpoints: z.array(z.object({
    id:       z.number().int().min(1).max(23),
    name:     z.string(),
    passed:   z.boolean(),
    score:    z.number().min(0).max(10),
    feedback: z.string(),
  })).length(23),
  recommendations: z.array(z.string()).max(10),
})
```

### Environment Variable Schemas (Startup Validation)

```typescript
// apps/api/src/env.ts
import { z } from 'zod'

const EnvSchema = z.object({
  // AWS
  AWS_REGION:              z.string().default('us-east-1'),
  AWS_ACCOUNT_ID:          z.string().regex(/^\d{12}$/),
  // Database
  DATABASE_URL:            z.string().startsWith('postgresql://'),
  REDIS_URL:               z.string().startsWith('redis://'),
  // Secrets (from AWS Secrets Manager — resolved at runtime)
  ANTHROPIC_API_KEY:       z.string().startsWith('sk-ant-'),
  TWILIO_ACCOUNT_SID:      z.string().startsWith('AC'),
  TWILIO_AUTH_TOKEN:       z.string().min(32),
  TELEGRAM_BOT_TOKEN:      z.string().regex(/^\d+:[A-Za-z0-9_-]+$/),
  AWS_SES_FROM_EMAIL:      z.string().email(),
  // Feature flags
  ENABLE_AUTO_APPLY:       z.coerce.boolean().default(false),
  ENABLE_LINKEDIN_APPLY:   z.coerce.boolean().default(false),
  MAX_DAILY_APPLICATIONS:  z.coerce.number().int().min(1).max(500).default(150),
  // App
  NODE_ENV:                z.enum(['development','test','production']).default('development'),
  LOG_LEVEL:               z.enum(['debug','info','warn','error']).default('info'),
  NEXT_PUBLIC_API_URL:     z.string().url(),
  NEXT_PUBLIC_WS_URL:      z.string().startsWith('wss://'),
})

// Validate at startup — crash immediately if misconfigured
export const env = EnvSchema.parse(process.env)
export type Env = z.infer<typeof EnvSchema>
```

### Schema Utilities

```typescript
// packages/shared/src/schemas/utils.ts
import { z } from 'zod'

// Safely parse with typed error handling
export function safeParseSchema<T>(
  schema: z.ZodType<T>,
  data: unknown
): { success: true; data: T } | { success: false; errors: z.ZodError['errors'] } {
  const result = schema.safeParse(data)
  if (result.success) return { success: true, data: result.data }
  return { success: false, errors: result.error.errors }
}

// Strip unknown keys from objects before saving to DB
export function strictParse<T>(schema: z.ZodObject<any>, data: unknown): T {
  return schema.strict().parse(data) as T
}

// UUID validation helper
export const UUIDSchema = z.string().uuid('Must be a valid UUID v4')

// ISO datetime with timezone (required for all timestamps)
export const DateTimeSchema = z.string().datetime({ offset: true })

// Pagination response wrapper
export function paginatedSchema<T extends z.ZodTypeAny>(itemSchema: T) {
  return z.object({
    items:      z.array(itemSchema),
    total:      z.number().int().nonnegative(),
    page:       z.number().int().positive(),
    pageSize:   z.number().int().positive(),
    totalPages: z.number().int().nonnegative(),
    hasMore:    z.boolean(),
  })
}
```

## Rules

- Every SQS message body MUST have a Zod schema — never trust queue messages blindly
- Use `.refine()` for cross-field validation — never do this in business logic
- Always use `z.coerce.number()` for values coming from query strings (they arrive as strings)
- Export the inferred type alongside every schema: `export type X = z.infer<typeof XSchema>`
- Use `.superRefine()` for async validation (e.g. checking if email is already taken)
- Never use `z.any()` — if the shape is unknown use `z.record(z.unknown())` with explicit parsing downstream
