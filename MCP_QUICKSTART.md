# MCP Servers - Quick Start (10 minutes)

## Overview
Enable **6 MCP servers** to give Claude Code access to GitHub, PostgreSQL, AWS, Playwright, filesystem, and memory.

---

## ⚡ 3-Step Setup

### Step 1: Create `.env.local`
```bash
cp .env.local.example .env.local
```

### Step 2: Fill 3 Environment Variables (minimum)
Edit `.env.local` and add:

```env
# 1. GitHub - for repository management
GITHUB_PERSONAL_ACCESS_TOKEN=github_pat_xxxxx
  Get from: https://github.com/settings/tokens?type=beta
  Scopes: repo (full), workflow, read:org

# 2. PostgreSQL - for database access
DATABASE_URL=postgresql://postgres:password@localhost:5432/digitalfte_dev
  Option A: Docker postgres (local)
  Option B: AWS RDS
  Option C: Cloud database (Render, Supabase)

# 3. AWS - for infrastructure operations
AWS_ACCESS_KEY_ID=AKIA_xxxxxxxxxxxxx
AWS_SECRET_ACCESS_KEY=your_secret_key_here
AWS_REGION=us-east-1
  Get from: https://console.aws.amazon.com/iam/
```

### Step 3: Start Claude Code
```bash
claude-code
```

All 6 MCP servers auto-load from `.mcp.json`!

---

## ✅ Verify MCP Works

In Claude Code, run:
```
"Tell me the GitHub server status and list my repositories"
```

You should see your GitHub repos listed.

---

## 📚 The 6 MCP Servers

| Server | Purpose | Setup Required | Commands |
|--------|---------|-----------------|----------|
| **GitHub** | Repos, PRs, Issues, CI | ✅ Token | "Create a GitHub issue" |
| **PostgreSQL** | Database queries | ✅ DATABASE_URL | "Show user count" |
| **Filesystem** | Read/write files | ✅ Auto | "Read apps/api/..." |
| **Playwright** | Browser automation | ✅ Auto | "Open https://..." |
| **AWS** | CDK, Lambda, S3, SQS | ✅ Credentials | "Deploy ApiStack" |
| **Memory** | Save decisions | ✅ Auto | "Store: 'Decision...'" |

---

## 🔧 Server-Specific Setup

### GitHub MCP (5 min)
```
1. Go: https://github.com/settings/tokens?type=beta
2. Create token: "claude-code-github"
3. Scopes: repo (full), workflow, read:org
4. Copy to GITHUB_PERSONAL_ACCESS_TOKEN
```

### PostgreSQL MCP (5 min)
**Option A: Docker (Recommended)**
```bash
docker run --name digitalfte-postgres \
  -e POSTGRES_PASSWORD=password \
  -e POSTGRES_DB=digitalfte_dev \
  -p 5432:5432 \
  -d postgres:15

# Add to .env.local:
DATABASE_URL=postgresql://postgres:password@localhost:5432/digitalfte_dev
```

**Option B: AWS RDS**
```
1. Create RDS instance in AWS
2. Copy connection string
3. Add to .env.local: DATABASE_URL=postgresql://user:pass@host:5432/db
```

### AWS MCP (5 min)
```
1. Go: https://console.aws.amazon.com/iam/
2. Create user: "claude-code-dev"
3. Attach: AdministratorAccess (dev) OR CloudFormation + S3 + SQS + CloudWatch
4. Create access key
5. Add to .env.local:
   AWS_ACCESS_KEY_ID=AKIA_xxx
   AWS_SECRET_ACCESS_KEY=xxx
   AWS_REGION=us-east-1
```

### Playwright MCP (auto)
- No setup needed
- First run auto-downloads browsers (2-3 min)

### Filesystem MCP (auto)
- Already configured in `.mcp.json`
- Auto-scans project files

### Memory MCP (auto)
- Fully local, no setup
- Stores decisions between sessions

---

## 🎯 Common Tasks

### GitHub
```
"Create a PR titled 'Add feature X' from develop to main"
"Check the status of the CI pipeline"
"Search for all references to 'useApplications'"
```

### PostgreSQL
```
"Show me the User table schema"
"How many applications are in the database?"
"SELECT * FROM jobs WHERE salary > 100000 LIMIT 5"
```

### Filesystem
```
"Show the structure of apps/web/components"
"Search for all .tsx files that import 'useAuth'"
"Create a new file at lib/utils/formatCurrency.ts"
```

### Playwright
```
"Open https://example.com and take a screenshot"
"Test the job application form at [URL]"
"Verify the Apply button is clickable"
```

### AWS
```
"Deploy the ApiStack to dev"
"Show the CloudWatch logs for job-search-lambda"
"Check SQS queue depth for auto-apply-queue"
```

### Memory
```
"Store: 'ATS handlers completed: Workday ✅, Greenhouse ✅'"
"What do you remember about this project?"
"Save: 'Decided to use Redis for quiet hour scheduling'"
```

---

## ⚠️ Common Issues

**"MCP server failed to start"**
- Check `.env.local` has all required variables
- Verify GitHub token hasn't expired
- Ensure DATABASE_URL is correct

**"PostgreSQL connection refused"**
```bash
# If using Docker
docker ps
docker start digitalfte-postgres

# If using local PostgreSQL
brew services start postgresql@15
```

**"AWS credentials not valid"**
```bash
aws sts get-caller-identity  # Should show your account
```

**"Playwright: Browser not found"**
```bash
npx playwright install chromium
```

---

## 🔒 Security Checklist

- [ ] `.env.local` is in `.gitignore` (never commit!)
- [ ] Copy `.env.local.example` template
- [ ] Fill with YOUR credentials (don't share)
- [ ] GitHub token has minimal scopes needed
- [ ] AWS user has dev permissions only (not production)
- [ ] PostgreSQL uses dev database (not production)

---

## 📖 Full Documentation

For detailed setup: See `MCP_SETUP_GUIDE.md`

---

## 🚀 You're Ready!

1. ✅ `.env.local` filled with 3+ credentials
2. ✅ Started `claude-code`
3. ✅ Verified MCP works with GitHub test

**Start using MCP servers in your development!**

---

**Time to setup: ~10 minutes**
**Time to first MCP command: ~30 seconds**
