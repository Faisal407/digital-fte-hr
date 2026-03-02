# Database Schema — Digital FTE for HR
# Reference doc — load with @docs/database-schema.md
# Primary DB: Aurora PostgreSQL v15 via Prisma ORM

## Core Tables Overview
```
user_profile            → Account, preferences, plan tier
resume_profile          → ATS-optimized resume versions (S3 reference)
job_listing             → Scraped/API job data (deduplicated cross-platform)
job_application         → Application queue, status tracking, review gate
channel_subscription    → WhatsApp/Telegram/Email opt-ins per user
notification_log        → Outbound message delivery records
answer_memory_bank      → Learned screening question answers
audit_log               → DynamoDB — every agent action (not Prisma)
```

## Prisma Schema (Core Tables)

```prisma
// packages/db/prisma/schema.prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

// ── Users ──────────────────────────────────────────────────────
model UserProfile {
  id                String   @id @default(cuid())
  email             String   @unique
  cognitoId         String   @unique @map("cognito_id")
  firstName         String   @map("first_name")
  lastName          String   @map("last_name")
  phoneE164         String?  @unique @map("phone_e164")  // E.164 format, null until verified
  timezone          String   @default("UTC")              // e.g. "Asia/Dubai"
  plan              PlanTier @default(free)
  planExpiresAt     DateTime? @map("plan_expires_at")
  status            UserStatus @default(active)
  deletionRequestedAt DateTime? @map("deletion_requested_at")
  preferredJobTitles String[] @map("preferred_job_titles")
  preferredLocations String[] @map("preferred_locations")
  salaryMin         Int?     @map("salary_min")
  salaryMax         Int?     @map("salary_max")
  salaryCurrency    String   @default("USD") @map("salary_currency")
  lastActiveAt      DateTime @default(now()) @map("last_active_at")
  createdAt         DateTime @default(now()) @map("created_at")
  updatedAt         DateTime @updatedAt @map("updated_at")

  resumes            ResumeProfile[]
  applications       JobApplication[]
  channelSubscriptions ChannelSubscription[]
  answerMemoryBank   AnswerMemoryBank[]

  @@map("user_profile")
}

// ── Resumes ────────────────────────────────────────────────────
model ResumeProfile {
  id              String   @id @default(cuid())
  userId          String   @map("user_id")
  versionNumber   Int      @map("version_number")
  sourceType      ResumeSource @map("source_type")  // upload | linkedin | form | voice
  s3KeyOriginal   String?  @map("s3_key_original")   // Original file
  s3KeyOptimized  String?  @map("s3_key_optimized")  // ATS-optimized PDF
  s3KeyDocx       String?  @map("s3_key_docx")       // DOCX version
  atsScore        Int?     @map("ats_score")          // 0-100, null until scored
  checkpoints     Json?                               // ATSCheckpoint[] JSON
  isActive        Boolean  @default(false) @map("is_active")  // One active per user
  createdAt       DateTime @default(now()) @map("created_at")

  user         UserProfile      @relation(fields: [userId], references: [id], onDelete: Cascade)
  applications JobApplication[]

  @@unique([userId, versionNumber])
  @@index([userId, isActive])
  @@map("resume_profile")
}

// ── Jobs ───────────────────────────────────────────────────────
model JobListing {
  id              String   @id @default(cuid())
  externalId      String   @map("external_id")
  platform        JobPlatform
  title           String
  companyName     String   @map("company_name")
  companyLogoUrl  String?  @map("company_logo_url")
  location        String
  isRemote        Boolean  @default(false) @map("is_remote")
  salaryMin       Int?     @map("salary_min")
  salaryMax       Int?     @map("salary_max")
  salaryCurrency  String?  @map("salary_currency")
  salaryPeriod    String?  @map("salary_period")   // month | year
  description     String   // Full JD text
  applicationUrl  String   @map("application_url")
  atsType         String?  @map("ats_type")         // workday | greenhouse | lever | etc.
  isGhostJob      Boolean  @default(false) @map("is_ghost_job")
  postedAt        DateTime @map("posted_at")
  expiresAt       DateTime? @map("expires_at")
  urlFingerprint  String   @unique @map("url_fingerprint")  // SHA256 of normalized URL
  embedding       Unsupported("vector(1536)")?  // Titan embedding — stored in OpenSearch not here
  createdAt       DateTime @default(now()) @map("created_at")

  applications JobApplication[]

  @@unique([platform, externalId])
  @@index([platform, postedAt])
  @@index([isGhostJob])
  @@map("job_listing")
}

// ── Applications ───────────────────────────────────────────────
model JobApplication {
  id                String   @id @default(cuid())
  userId            String   @map("user_id")
  jobListingId      String   @map("job_listing_id")
  resumeProfileId   String   @map("resume_profile_id")
  status            ApplicationStatus @default(pending_review)
  reviewToken       String?  @unique @map("review_token")    // For approval link
  approvedAt        DateTime? @map("approved_at")
  submittedAt       DateTime? @map("submitted_at")
  skippedAt         DateTime? @map("skipped_at")
  skipReason        String?  @map("skip_reason")
  coverLetterText   String?  @map("cover_letter_text")
  s3KeyPreSubmit    String?  @map("s3_key_pre_submit")        // Pre-submit screenshot
  s3KeyConfirmation String?  @map("s3_key_confirmation")      // Confirmation screenshot
  failureReason     String?  @map("failure_reason")
  matchScore        Int      @map("match_score")              // 0-100 at time of queuing
  source            String   @default("auto") // auto | manual
  createdAt         DateTime @default(now()) @map("created_at")
  updatedAt         DateTime @updatedAt @map("updated_at")

  user         UserProfile  @relation(fields: [userId], references: [id], onDelete: Cascade)
  jobListing   JobListing   @relation(fields: [jobListingId], references: [id])
  resume       ResumeProfile @relation(fields: [resumeProfileId], references: [id])

  @@index([userId, status])
  @@index([userId, createdAt])
  @@map("job_application")
}

// ── Channels ───────────────────────────────────────────────────
model ChannelSubscription {
  id              String  @id @default(cuid())
  userId          String  @map("user_id")
  channel         Channel
  channelUserId   String? @map("channel_user_id")  // Telegram chat_id or WhatsApp number
  isEnabled       Boolean @default(true) @map("is_enabled")
  optInAt         DateTime @map("opt_in_at")
  optOutAt        DateTime? @map("opt_out_at")
  preferences     Json    @default("{}")            // Frequency, types, quiet hour overrides
  createdAt       DateTime @default(now()) @map("created_at")

  user UserProfile @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([userId, channel])
  @@map("channel_subscription")
}

// ── Answer Memory ──────────────────────────────────────────────
model AnswerMemoryBank {
  id               String   @id @default(cuid())
  userId           String   @map("user_id")
  questionHash     String   @map("question_hash")    // SHA256 of normalized question
  questionText     String   @map("question_text")
  answerText       String   @map("answer_text")
  usageCount       Int      @default(1) @map("usage_count")
  lastUsedAt       DateTime @default(now()) @map("last_used_at")
  createdAt        DateTime @default(now()) @map("created_at")

  user UserProfile @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([userId, questionHash])
  @@map("answer_memory_bank")
}

// ── Enums ──────────────────────────────────────────────────────
enum PlanTier          { free pro elite }
enum UserStatus        { active suspended deletion_pending deleted }
enum ResumeSource      { upload linkedin form voice }
enum ApplicationStatus { pending_review approved submitted viewed shortlisted rejected skipped failed expired }
enum Channel           { whatsapp telegram email push }
enum JobPlatform       { linkedin indeed glassdoor monster naukrigulf bayt rozee_pk naukri reed_co_uk totaljobs stepstone greenhouse lever workday taleo icims }
```

## Key Indexes & Performance Notes

```sql
-- High-frequency queries — these indexes must exist
CREATE INDEX idx_application_user_status  ON job_application(user_id, status);
CREATE INDEX idx_application_user_created ON job_application(user_id, created_at DESC);
CREATE INDEX idx_job_listing_platform     ON job_listing(platform, posted_at DESC);
CREATE INDEX idx_job_listing_ghost        ON job_listing(is_ghost_job) WHERE is_ghost_job = true;
CREATE INDEX idx_resume_user_active       ON resume_profile(user_id, is_active);

-- Full text search on job listings (for keyword-based matching)
CREATE INDEX idx_job_fts ON job_listing USING gin(to_tsvector('english', title || ' ' || description));
```

## DynamoDB Tables (Audit + Task State)

```typescript
// audit_log table
// PK: userId | SK: timestamp#actionId
// TTL: 7 years for legal records, 2 years then userId anonymized

// task_status table
// PK: taskId | SK: createdAt
// TTL: 7 days (tasks auto-expire)
// Attributes: status, progress (0-1), result (JSON), error

// rate_limit table
// PK: rateKey (e.g. "rate:linkedin:user-123")
// TTL: refill_period_seconds
// Attributes: tokensRemaining, lastRefill

// approval_gate table
// PK: applicationId
// TTL: 24 hours (auto-expire unapproved applications)
// Attributes: userId, approved (bool | null), editedAnswers, expiresAt
```

## Migration Workflow
```bash
# Create a new migration
pnpm --filter db migrate:new add_column_xyz

# Apply in dev
pnpm --filter db migrate

# Apply in production (via CI only — never manually)
# GitHub Actions runs: pnpm --filter db migrate:deploy
# NEVER use prisma db push in production — always use migrate deploy
```
