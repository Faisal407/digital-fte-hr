# Database Package — Local Context
# This CLAUDE.md is for: packages/db/
# Inherits root CLAUDE.md + adds database-specific rules

## What This Package Does
Shared database access layer for all services. Contains the Prisma schema, migrations,
seed data, GDPR registry, and typed database client exported to all other packages.

## Tech Stack
- **ORM**: Prisma 5.x (TypeScript-first)
- **Database**: Aurora PostgreSQL v15 (Serverless v2)
- **Migrations**: Prisma Migrate (never db push in production)
- **Seed**: TypeScript seed script for local dev + test environments

## Directory Structure
```
packages/db/
├── prisma/
│   ├── schema.prisma       → Full schema (see docs/database-schema.md)
│   └── migrations/         → Migration files (auto-generated — never hand-edit)
├── src/
│   ├── client.ts           → Singleton PrismaClient export
│   ├── gdpr-registry.ts    → All PII tables registered for deletion cascade
│   ├── gdpr-deletion.ts    → GDPR deletion cascade execution
│   ├── gdpr-export.ts      → User data export (right of access)
│   └── seed/
│       ├── index.ts        → Master seed runner
│       ├── users.ts        → Test user accounts
│       └── jobs.ts         → Sample job listings
└── tsconfig.json
```

## Client Singleton Pattern
```typescript
// packages/db/src/client.ts
import { PrismaClient } from '@prisma/client'

const globalForPrisma = global as unknown as { prisma: PrismaClient }

export const db = globalForPrisma.prisma ?? new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['query', 'error'] : ['error'],
})

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = db
// ALWAYS import { db } from '@digital-fte/db' — never create new PrismaClient() in services
```

## Migration Rules (CRITICAL)
```bash
# ✅ Creating a migration (dev)
pnpm --filter db migrate:new <descriptive_name>   # e.g. add_ats_score_to_resume

# ✅ Applying migrations
pnpm --filter db migrate          # Dev environment
# Production: GitHub Actions runs prisma migrate deploy automatically on merge to main

# ❌ NEVER do these
prisma db push                    # Bypasses migration history — FORBIDDEN in all envs
prisma migrate reset              # Drops all data — only in local dev with confirmation
```

## Row-Level Security Rule (Applies to ALL Services Using This Package)
```typescript
// EVERY query that returns user data MUST include userId filter
// ❌ Wrong — exposes other users' data if ID is guessed
const resume = await db.resumeProfile.findFirst({ where: { id: resumeId } })

// ✅ Correct — always scope to authenticated user
const resume = await db.resumeProfile.findFirst({
  where: { id: resumeId, userId: authenticatedUser.id }
})
```

## GDPR Registry (Add New PII Tables Here)
```typescript
// packages/db/src/gdpr-registry.ts
// When you add a new table that stores PII, add it here immediately
export const PII_TABLES = [
  { table: 'user_profile',          userIdField: 'id',      cascadeDelete: true },
  { table: 'resume_profile',        userIdField: 'user_id', cascadeDelete: true, s3KeyFields: ['s3_key_original', 's3_key_optimized', 's3_key_docx'] },
  { table: 'job_application',       userIdField: 'user_id', cascadeDelete: true, s3KeyFields: ['s3_key_pre_submit', 's3_key_confirmation'] },
  { table: 'channel_subscription',  userIdField: 'user_id', cascadeDelete: true },
  { table: 'answer_memory_bank',    userIdField: 'user_id', cascadeDelete: true },
  { table: 'notification_log',      userIdField: 'user_id', cascadeDelete: true },
  // ADD NEW PII TABLES HERE — audit_log is in DynamoDB, handled separately
]
```

## Commands
```bash
pnpm --filter db migrate              # Apply pending migrations
pnpm --filter db migrate:new <name>   # Create new migration
pnpm --filter db studio               # Open Prisma Studio GUI (port 5555)
pnpm --filter db seed                 # Seed dev database
pnpm --filter db generate             # Regenerate Prisma client after schema change
```
