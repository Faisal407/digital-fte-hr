---
name: prisma-schema
description: Designs and evolves the Prisma database schema for Digital FTE — Aurora PostgreSQL with row-level security, soft deletes, audit trails, and GDPR compliance. Use when adding new models, modifying existing fields, creating migrations, or designing relationships. Knows all existing Digital FTE entities, their relationships, and data retention policies.
---

# Prisma Schema Skill — Digital FTE Database Design

## Technology: Prisma ORM → Aurora PostgreSQL 15 (Serverless v2)

## Core Schema

```prisma
// packages/database/prisma/schema.prisma
generator client {
  provider        = "prisma-client-js"
  previewFeatures = ["postgresqlExtensions", "driverAdapters"]
}

datasource db {
  provider   = "postgresql"
  url        = env("DATABASE_URL")
  extensions = [pgcrypto, pg_trgm, vector]  // vector for future ML embeddings
}

// ─── USER & AUTH ────────────────────────────────────────────

model User {
  id               String    @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  email            String    @unique @db.VarChar(320)
  passwordHash     String?   @db.VarChar(255)  // null for SSO-only accounts
  fullName         String    @db.VarChar(200)
  phone            String?   @db.VarChar(30)
  avatarUrl        String?   @db.VarChar(500)
  emailVerified    Boolean   @default(false)
  plan             UserPlan  @default(FREE)
  planExpiresAt    DateTime? @db.Timestamptz
  timezone         String    @default("Asia/Karachi") @db.VarChar(60)
  locale           String    @default("en") @db.VarChar(10)
  // GDPR fields
  gdprConsentAt    DateTime? @db.Timestamptz
  dataExportedAt   DateTime? @db.Timestamptz
  deletionRequestedAt DateTime? @db.Timestamptz
  // Audit
  createdAt        DateTime  @default(now()) @db.Timestamptz
  updatedAt        DateTime  @updatedAt @db.Timestamptz
  deletedAt        DateTime? @db.Timestamptz  // Soft delete
  lastActiveAt     DateTime  @default(now()) @db.Timestamptz

  // Relations
  profile          UserProfile?
  resumes          Resume[]
  jobs             SavedJob[]
  applications     Application[]
  tasks            Task[]
  notifications    NotificationLog[]
  channelSettings  ChannelSetting[]
  auditLogs        AuditLog[]
  sessions         UserSession[]
  subscription     Subscription?

  @@index([email])
  @@index([deletedAt])
  @@map("users")
}

enum UserPlan {
  FREE
  PRO
  ELITE
  ENTERPRISE
}

model UserProfile {
  id              String   @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  userId          String   @unique @db.Uuid
  headline        String?  @db.VarChar(300)
  summary         String?  @db.Text
  location        String?  @db.VarChar(150)
  linkedinUrl     String?  @db.VarChar(500)
  githubUrl       String?  @db.VarChar(500)
  portfolioUrl    String?  @db.VarChar(500)
  skills          String[] @db.VarChar(80)
  languages       String[] @db.VarChar(60)
  completionScore Int      @default(0) @db.SmallInt  // 0-100
  targetSalary    Json?    // { min, max, currency, period }
  jobPreferences  Json?    // { titles[], locations[], remote, jobTypes[], industries[] }
  workHistory     Json?    // Structured work experience array
  education       Json?    // Structured education array
  certifications  Json?    // Array of cert objects
  updatedAt       DateTime @updatedAt @db.Timestamptz

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@map("user_profiles")
}

// ─── RESUME ────────────────────────────────────────────────

model Resume {
  id              String       @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  userId          String       @db.Uuid
  name            String       @db.VarChar(200)
  sourceType      ResumeSource
  originalFileUrl String?      @db.VarChar(500)  // S3 URL of uploaded file
  parsedContent   Json         // Structured resume data
  atsScore        Int?         @db.SmallInt   // 0-100, null = not yet scored
  atsGrade        ATSGrade?
  isDefault       Boolean      @default(false)
  isLocked        Boolean      @default(false)  // true = export blocked (score < 60)
  wordCount       Int?         @db.SmallInt
  pageCount       Int?         @db.SmallInt
  createdAt       DateTime     @default(now()) @db.Timestamptz
  updatedAt       DateTime     @updatedAt @db.Timestamptz
  deletedAt       DateTime?    @db.Timestamptz

  user             User          @relation(fields: [userId], references: [id], onDelete: Cascade)
  versions         ResumeVersion[]
  optimizationLogs ResumeOptimizationLog[]
  applications     Application[]

  @@index([userId, deletedAt])
  @@index([userId, isDefault])
  @@map("resumes")
}

enum ResumeSource { UPLOAD   LINKEDIN_IMPORT   FORM_BUILDER   VOICE_RECORD }
enum ATSGrade    { RED      YELLOW             GREEN }

model ResumeVersion {
  id          String   @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  resumeId    String   @db.Uuid
  version     Int      @db.SmallInt
  content     Json     // Full resume content snapshot
  atsScore    Int?     @db.SmallInt
  changesSummary String? @db.VarChar(500)
  createdAt   DateTime @default(now()) @db.Timestamptz

  resume Resume @relation(fields: [resumeId], references: [id], onDelete: Cascade)

  @@unique([resumeId, version])
  @@index([resumeId, createdAt])
  @@map("resume_versions")
}

// ─── JOBS ──────────────────────────────────────────────────

model JobListing {
  id           String   @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  externalId   String   @db.VarChar(200)  // Platform's own job ID
  platform     String   @db.VarChar(50)
  title        String   @db.VarChar(300)
  company      Json     // { name, logoUrl, size, industry, website }
  location     String   @db.VarChar(200)
  remote       Boolean  @default(false)
  description  String?  @db.Text
  requirements String?  @db.Text
  salary       Json?    // { min, max, currency, period }
  jobType      String?  @db.VarChar(50)
  applyUrl     String   @db.VarChar(1000)
  postedAt     DateTime @db.Timestamptz
  expiresAt    DateTime? @db.Timestamptz
  isGhostJob   Boolean  @default(false)
  isActive     Boolean  @default(true)
  rawData      Json?    // Original scraped payload for debugging
  scrapedAt    DateTime @default(now()) @db.Timestamptz

  savedByUsers SavedJob[]
  applications Application[]

  @@unique([platform, externalId])
  @@index([platform, isActive])
  @@index([postedAt])
  @@map("job_listings")
}

model SavedJob {
  userId     String   @db.Uuid
  jobId      String   @db.Uuid
  savedAt    DateTime @default(now()) @db.Timestamptz
  notes      String?  @db.VarChar(500)

  user Job JobListing @relation(fields: [jobId], references: [id], onDelete: Cascade)
  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@id([userId, jobId])
  @@map("saved_jobs")
}

// ─── APPLICATIONS ──────────────────────────────────────────

model Application {
  id             String            @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  userId         String            @db.Uuid
  jobId          String?           @db.Uuid   // null for manually tracked apps
  resumeId       String?           @db.Uuid
  status         ApplicationStatus @default(MATCHED)
  source         ApplicationSource @default(MANUAL)
  isAutoApply    Boolean           @default(false)
  submittedAt    DateTime?         @db.Timestamptz
  screenshotUrl  String?           @db.VarChar(500)  // Proof of submission (S3)
  notes          String?           @db.VarChar(2000)
  nextFollowUpAt DateTime?         @db.Timestamptz
  matchScore     Int?              @db.SmallInt
  createdAt      DateTime          @default(now()) @db.Timestamptz
  updatedAt      DateTime          @updatedAt @db.Timestamptz
  deletedAt      DateTime?         @db.Timestamptz

  user         User          @relation(fields: [userId], references: [id], onDelete: Cascade)
  job          JobListing?   @relation(fields: [jobId], references: [id])
  resume       Resume?       @relation(fields: [resumeId], references: [id])
  reviewQueue  ReviewQueue?
  timeline     ApplicationTimeline[]

  @@index([userId, status, deletedAt])
  @@index([userId, submittedAt])
  @@map("applications")
}

enum ApplicationStatus {
  MATCHED QUEUED REVIEW_PENDING APPROVED APPLYING APPLIED
  VIEWED SHORTLISTED INTERVIEW OFFER REJECTED WITHDRAWN
}
enum ApplicationSource { MANUAL AUTO_AGENT IMPORT }

model ReviewQueue {
  id            String      @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  applicationId String      @unique @db.Uuid
  userId        String      @db.Uuid
  expiresAt     DateTime    @db.Timestamptz  // Auto-reject if not reviewed in time
  decision      ReviewDecision?
  decidedAt     DateTime?   @db.Timestamptz
  deferredTo    DateTime?   @db.Timestamptz
  createdAt     DateTime    @default(now()) @db.Timestamptz

  application Application @relation(fields: [applicationId], references: [id], onDelete: Cascade)

  @@index([userId, decision])
  @@map("review_queue")
}

enum ReviewDecision { APPROVED REJECTED DEFERRED }

// ─── TASKS (Async Operations) ─────────────────────────────

model Task {
  id          String     @id @db.VarChar(36)  // UUID from requestId
  userId      String     @db.Uuid
  type        TaskType
  status      TaskStatus @default(QUEUED)
  progress    Int        @default(0) @db.SmallInt  // 0-100
  input       Json       // Original request payload
  output      Json?      // Result when complete
  errorMsg    String?    @db.VarChar(1000)
  retryCount  Int        @default(0) @db.SmallInt
  createdAt   DateTime   @default(now()) @db.Timestamptz
  updatedAt   DateTime   @updatedAt @db.Timestamptz
  completedAt DateTime?  @db.Timestamptz

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId, status, createdAt])
  @@map("tasks")
}

enum TaskType   { JOB_SEARCH RESUME_OPTIMIZE AUTO_APPLY REPORT_GENERATE }
enum TaskStatus { QUEUED PROCESSING COMPLETE FAILED CANCELLED }

// ─── AUDIT LOG (GDPR & Security) ─────────────────────────

model AuditLog {
  id         BigInt   @id @default(autoincrement())
  userId     String?  @db.Uuid
  action     String   @db.VarChar(100)  // e.g. 'application.approve'
  resourceId String?  @db.Uuid
  before     Json?    // State before action
  after      Json?    // State after action
  ipAddress  String?  @db.VarChar(45)
  userAgent  String?  @db.VarChar(300)
  createdAt  DateTime @default(now()) @db.Timestamptz

  user User? @relation(fields: [userId], references: [id])

  @@index([userId, action, createdAt])
  @@index([createdAt])      // For retention cleanup jobs
  @@map("audit_logs")
}
```

## Migration Best Practices

```bash
# Create migration (always review SQL before applying)
npx prisma migrate dev --name add_voice_profile_support

# Dry-run in CI
npx prisma migrate deploy --preview-feature

# NEVER use migrate reset in production — use manual SQL for destructive changes
```

## GDPR Data Retention Periods

| Table | Retention | Deletion Method |
|---|---|---|
| `users` | Until deletion request | Cascade soft-delete |
| `applications` | 3 years | Soft delete after 3yr |
| `audit_logs` | 1 year | Hard delete via cron |
| `tasks` | 90 days | Hard delete via cron |
| `notification_logs` | 180 days | Hard delete via cron |
| `resume_versions` | 2 years | Soft delete with resume |

## Rules

- ALL tables must have `createdAt` and `updatedAt`
- ALL user-owned tables must have `deletedAt` (soft delete) and scope queries to `deletedAt: null`
- NEVER store passwords, API keys, or raw PII in plain JSON columns — use encrypted `@db.Text`
- Row-level security is enforced at the application layer (always scope queries to `userId`)
- All `@relation` must specify `onDelete` behavior explicitly
- Use `@db.Timestamptz` for ALL timestamp fields — never `DateTime` without timezone
