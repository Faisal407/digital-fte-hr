# Phase 4: Real Database-Backed API Implementation

## ✅ COMPLETED

### New Files Created
- `prisma/schema.prisma` — Full Prisma schema with 5 models + 6 enums
- `lib/db.ts` — PrismaClient singleton for Vercel serverless
- `lib/api-helpers.ts` — Auth helper + response utilities
- `prisma/seed.ts` — 12 realistic job listings

### Files Modified (All 10 API routes replaced with real DB queries)
- `app/api/v1/dashboard/overview/route.ts` — Real application count queries
- `app/api/v1/dashboard/weekly/route.ts` — Real 7-day grouping
- `app/api/v1/jobs/search/route.ts` — Creates Task in DB
- `app/api/v1/jobs/search/[taskId]/route.ts` — Job search from JobListing table
- `app/api/v1/applications/route.ts` — Real application list + stats
- `app/api/v1/applications/[id]/approve/route.ts` — Update status to submitted
- `app/api/v1/applications/[id]/skip/route.ts` — Update status to skipped
- `app/api/v1/resumes/route.ts` — Real resume list + upload
- `app/api/v1/account/profile/route.ts` — Real profile update
- `app/api/v1/tasks/[taskId]/route.ts` — Poll task status from DB

### Key Implementation Details
✅ Every protected route uses `getSupabaseUser()` to verify JWT
✅ Row-level security: all queries filter by `userId: user.id`
✅ UserProfile auto-upserted on first request
✅ No more hardcoded mock data — all real Prisma queries
✅ Standard response envelope with success/error/meta structure

---

## 🔧 NEXT STEPS: USER MUST PROVIDE ENV VARS

### Step 1: Add Environment Variables
Update `apps/web/.env.local` with these 3 required values:

```bash
# 1. Get Supabase Service Role Key
# Go to: Supabase Dashboard → Settings → API → Service Role Key
SUPABASE_SERVICE_ROLE_KEY=eyJhbG...

# 2. Get PostgreSQL Transaction Pooler Connection String
# Go to: Supabase Dashboard → Settings → Database → Connection string
# Select "Transaction pooler" tab — use this exact string:
DATABASE_URL=postgresql://postgres.[ref]:[password]@aws-0-[region].pooler.supabase.com:6543/postgres?pgbouncer=true&connection_limit=1

# 3. Get Direct Connection String (for migrations)
# Select "Direct connection" tab:
DIRECT_URL=postgresql://postgres:[password]@db.[ref].supabase.co:5432/postgres
```

### Step 2: Install Dependencies
```bash
cd apps/web
pnpm install
```

### Step 3: Push Schema & Seed Data
```bash
# Create tables in Supabase
pnpm db:push

# Populate 12 sample jobs
pnpm db:seed
```

### Step 4: Test Everything
```bash
# Verify build passes (zero TS errors)
pnpm build

# Run dev server
pnpm dev    # http://localhost:8000

# In Supabase, verify:
# - Tables created: user_profile, job_listing, job_application, resume_profile, task, answer_memory_bank
# - 12 job_listing rows seeded
```

### Step 5: Manual Testing in App
1. **Login** with your Supabase user → auto-creates UserProfile row
2. **Dashboard** → should show 0s (real counts, not 247)
3. **Jobs → Search** → searches from `job_listing` table
4. **Applications → Approve** → updates status in DB
5. **Settings → Profile** → persists to database
6. **Refresh page** → profile data persists across sessions

---

## 📊 Database Schema Summary

### UserProfile
```
id (string) — Prisma CUID
supabaseId (string) — linked to Supabase auth
email, firstName, lastName, phoneE164
plan: free | pro | elite
timezone, preferredJobTitles[], preferredLocations[]
```

### JobListing
```
id, externalId, platform (enum), title, companyName, location
salaryMin, salaryMax, salaryCurrency, description
applicationUrl, atsType, isGhostJob, postedAt, expiresAt
```

### JobApplication
```
userId, jobListingId, resumeProfileId
status: pending_review | approved | submitted | viewed | shortlisted | rejected | skipped | failed
approvedAt, submittedAt, skippedAt, skipReason
matchScore (0-100)
```

### ResumeProfile
```
userId, versionNumber (auto-increment)
sourceType: upload | linkedin | form | voice
atsScore, checkpoints (JSON)
s3KeyOriginal, s3KeyOptimized, s3KeyDocx
isActive (boolean)
```

### Task
```
userId, type: "job_search" | etc
status: pending | processing | completed | failed | expired
inputData, resultData (JSON)
progress (0-1)
expiresAt (TTL 24hr)
```

### AnswerMemoryBank
```
userId, questionHash (SHA256)
questionText, answerText
usageCount, lastUsedAt
```

---

## 🚀 What's Working Now (Post-Env Vars)

| Route | Before | After |
|-------|--------|-------|
| `GET /dashboard/overview` | Hardcoded 247 jobs | Real count from DB |
| `GET /dashboard/weekly` | Mock 7-day chart | Real grouping by createdAt |
| `POST /jobs/search` | Returns random UUID | Creates Task row, returns real taskId |
| `GET /jobs/search/[taskId]` | 12 mock jobs | Queries JobListing table with keyword match |
| `GET /applications` | Mock 6 apps | Real user applications from DB |
| `PATCH /applications/[id]/approve` | No-op | Updates status, sets approvedAt timestamp |
| `PATCH /applications/[id]/skip` | No-op | Updates status, sets skipReason + skippedAt |
| `GET /resumes` | Mock 2 resumes | Real ResumeProfile list |
| `POST /resumes` | No-op | Creates ResumeProfile row, auto-increments version |
| `PATCH /account/profile` | No-op | Updates UserProfile + lastActiveAt |
| `GET /tasks/[taskId]` | Fake complete status | Real Task status from DB |

---

## ⚠️ Important Notes

### On Vercel Deployment
- Use **Transaction Pooler** connection string for `DATABASE_URL`
- Use **Direct connection** string ONLY for migrations (in GitHub Actions CI)
- Never commit `.env.local` — use Vercel Environment Variables UI
- No `@prisma/client` generation needed — already in postinstall

### Row-Level Security
Every mutating route includes this pattern:
```typescript
const app = await db.jobApplication.findFirst({
  where: { id, userId: user.id }  // ← security check
});
if (!app) return notFound('Application not found');
```

### Auth Flow
```
Client sends: Authorization: Bearer <jwt-token>
↓
getSupabaseUser() verifies token with service role key
↓
Upserts UserProfile (firstName, lastName come from Supabase metadata)
↓
All queries use: where: { userId: user.id }
```

---

## 📝 Checklist for User

- [ ] Get Supabase Service Role Key from dashboard
- [ ] Get DATABASE_URL (transaction pooler) from dashboard
- [ ] Get DIRECT_URL from dashboard
- [ ] Add 3 env vars to `.env.local`
- [ ] Run `pnpm install` in apps/web
- [ ] Run `pnpm db:push` to create tables
- [ ] Run `pnpm db:seed` to populate 12 jobs
- [ ] Run `pnpm build` — verify zero TS errors
- [ ] Run `pnpm dev` and test 5-step manual flow
- [ ] Verify Supabase tables have real data
- [ ] Commit Phase 4 to git

---

## 🎉 Phase 4 is Ready to Go!

All 10 API handlers are now database-backed. Just add environment variables and you have a fully functional backend with real persistence!
