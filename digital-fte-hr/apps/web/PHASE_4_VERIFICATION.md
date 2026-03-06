# Phase 4 Verification Checklist — March 6, 2026

## Current Status Report

### ✅ COMPLETED (Already Done)

| Step | Status | Details |
|------|--------|---------|
| Prisma schema created | ✅ | `prisma/schema.prisma` exists with 5 models + 6 enums |
| lib/db.ts created | ✅ | PrismaClient singleton ready |
| lib/api-helpers.ts created | ✅ | Auth verification + response utilities ready |
| package.json updated | ✅ | All Prisma + Supabase dependencies listed |
| Scripts added | ✅ | `pnpm db:push`, `pnpm db:seed`, `pnpm db:studio` available |
| All 10 API routes replaced | ✅ | Mock data removed, real queries added |
| Seed file created | ✅ | `prisma/seed.ts` with 12 jobs ready |

### ⚠️ PENDING (User Action Required)

| Step | Status | What to Do |
|------|--------|-----------|
| Update `.env.local` | ⏳ | Add your real Supabase credentials |
| Install dependencies | ⏳ | Run `pnpm install` |
| Create database tables | ⏳ | Run `pnpm db:push` |
| Seed sample data | ⏳ | Run `pnpm db:seed` |
| Build project | ⏳ | Run `pnpm build` |
| Test locally | ⏳ | Run `pnpm dev` |

---

## STEP 1️⃣: Update `.env.local` with Real Credentials

### Current State (NEEDS UPDATES)
```
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co         ❌ PLACEHOLDER
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here                  ❌ PLACEHOLDER
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here              ❌ PLACEHOLDER
DATABASE_URL=postgresql://postgres.[ref]...                        ❌ PLACEHOLDER
DIRECT_URL=postgresql://postgres:[password]...                     ❌ PLACEHOLDER
```

### How to Get Real Values

**From Supabase Dashboard:**

1. **NEXT_PUBLIC_SUPABASE_URL** & **NEXT_PUBLIC_SUPABASE_ANON_KEY**
   - Go to: **Settings → API**
   - Copy: "Project URL" → `NEXT_PUBLIC_SUPABASE_URL`
   - Copy: "anon public" key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`

2. **SUPABASE_SERVICE_ROLE_KEY**
   - Go to: **Settings → API**
   - Copy: "service_role" key (longer, secret key) → `SUPABASE_SERVICE_ROLE_KEY`

3. **DATABASE_URL** (For Vercel serverless)
   - Go to: **Settings → Database → Connection string**
   - Click: **"Transaction pooler"** tab (IMPORTANT!)
   - Copy entire connection string → `DATABASE_URL`

4. **DIRECT_URL** (For migrations only)
   - Same page: Click **"Direct connection"** tab
   - Copy entire connection string → `DIRECT_URL`

### Example (What it looks like)
```
NEXT_PUBLIC_SUPABASE_URL=https://xyznqwerty.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
DATABASE_URL=postgresql://postgres.xyznqwerty:[password]@aws-0-us-east-1.pooler.supabase.com:6543/postgres?pgbouncer=true&connection_limit=1
DIRECT_URL=postgresql://postgres:[password]@db.xyznqwerty.supabase.co:5432/postgres
```

---

## STEP 2️⃣: Install Dependencies

```bash
cd apps/web
pnpm install
```

**Expected Output:**
```
✓ dependencies
✓ devDependencies
✓ optional dependencies
done in 2m 45s
```

---

## STEP 3️⃣: Create Database Tables

```bash
cd apps/web
pnpm db:push
```

**Expected Output:**
```
✓ Database synced, no warnings

Summary of changes:
  Created table "user_profile"
  Created table "job_listing"
  Created table "job_application"
  Created table "resume_profile"
  Created table "task"
  Created table "answer_memory_bank"
```

**Verify in Supabase:**
- Go to: **SQL Editor**
- Run: `SELECT tablename FROM pg_tables WHERE schemaname='public';`
- Should see: `user_profile, job_listing, job_application, resume_profile, task, answer_memory_bank`

---

## STEP 4️⃣: Seed 12 Job Listings

```bash
cd apps/web
pnpm db:seed
```

**Expected Output:**
```
✅ Seeded 12 job listings
```

**Verify in Supabase:**
- Go to: **Table Editor → job_listing**
- Should see 12 rows with jobs from LinkedIn, Indeed, Bayt, NaukriGulf, etc.

---

## STEP 5️⃣: Build Project (Verify TypeScript)

```bash
cd apps/web
pnpm build
```

**Expected Output:**
```
✓ Compiled successfully
✓ Linting and type checking
Created an optimized production build
```

**If you see errors:**
- Check that DATABASE_URL is correct
- Check SUPABASE_SERVICE_ROLE_KEY is not truncated
- Run `pnpm install` again

---

## STEP 6️⃣: Run Local Dev Server

```bash
cd apps/web
pnpm dev
```

**Expected Output:**
```
  ▲ Next.js 14.0.0
  - Local:        http://localhost:8000
  ✓ Ready in 2.3s
```

---

## STEP 7️⃣: Manual Testing (Critical!)

### Test 1: Login
1. Go to: `http://localhost:8000`
2. Login with your Supabase test account
3. **Expected:** UserProfile created in DB automatically

### Test 2: Dashboard Overview
1. Navigate to: `/dashboard`
2. **Expected:** Shows real counts (0 or small numbers), NOT hardcoded 247

### Test 3: Job Search
1. Go to: `/dashboard/jobs`
2. Search: "Product Manager" or "Manager"
3. **Expected:** Returns results from `job_listing` table (real DB data)

### Test 4: Apply to Job
1. Click on a job card → "Apply"
2. Click "Approve"
3. **Expected:** Status changes to "submitted" in DB

### Test 5: Profile Save
1. Go to: `/dashboard/settings/profile`
2. Update: First name or timezone
3. Click "Save"
4. **Refresh the page**
5. **Expected:** Changes persist (not lost)

### Test 6: Verify in Supabase
Run this SQL in **Supabase → SQL Editor**:
```sql
-- Check users created
SELECT id, email, first_name, created_at FROM user_profile LIMIT 5;

-- Check applications submitted
SELECT id, status, created_at FROM job_application LIMIT 5;

-- Check resume uploads
SELECT id, version_number, source_type FROM resume_profile LIMIT 5;
```

---

## ✅ Full Checklist

```
SETUP:
  [ ] Updated .env.local with 5 real Supabase variables
  [ ] Ran `pnpm install`
  [ ] Ran `pnpm db:push` — tables created
  [ ] Ran `pnpm db:seed` — 12 jobs in database
  [ ] Ran `pnpm build` — zero errors

TESTING:
  [ ] Login works → UserProfile created
  [ ] Dashboard shows real 0s (not 247)
  [ ] Job search returns DB results
  [ ] Apply/Approve updates DB status
  [ ] Profile changes persist across refresh
  [ ] Supabase shows real data in tables

DEPLOYMENT:
  [ ] Push to GitHub
  [ ] Vercel auto-deploys
  [ ] Test production database connection
  [ ] All APIs return real data
```

---

## 🚨 Troubleshooting

### Error: "DATABASE_URL is invalid"
- ❌ Using wrong connection string (direct instead of pooler)
- ✅ Solution: Use **"Transaction pooler"** tab from Supabase

### Error: "SUPABASE_SERVICE_ROLE_KEY is required"
- ❌ Env var not set or incomplete
- ✅ Solution: Copy full string from Supabase Settings → API

### Build fails: "Cannot find module '@prisma/client'"
- ❌ Didn't run `pnpm install`
- ✅ Solution: `pnpm install` in apps/web/

### Login succeeds but UserProfile not created
- ❌ SERVICE_ROLE_KEY might be wrong
- ✅ Solution: Verify in Supabase → verify it starts with `eyJ...`

### `pnpm db:push` fails with "connection refused"
- ❌ DATABASE_URL/DIRECT_URL incorrect or Supabase offline
- ✅ Solution: Test connection string in `psql` command line first

---

## Next Steps After Verification

Once all checks pass:
1. Run `git add .` and `git commit`
2. Push to GitHub
3. Vercel deploys automatically
4. Test production APIs
5. Done! Phase 4 is live 🚀

