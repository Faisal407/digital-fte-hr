# MCP Servers Setup Guide - Digital FTE for HR

## Overview

This project is configured with **6 MCP (Model Context Protocol) servers** that extend Claude Code's capabilities:

1. **GitHub MCP** - Repository, PR, and issue management
2. **PostgreSQL MCP** - Database queries and schema inspection
3. **Filesystem MCP** - File operations and search
4. **Playwright MCP** - Browser automation and testing
5. **AWS MCP** - Cloud infrastructure management (CDK, Lambda, S3, SQS)
6. **Memory MCP** - Persistent decision storage across sessions

---

## MCP Architecture

```
Claude Code
    ↓
┌─────────────────────────────────────────────┐
│         .mcp.json Configuration             │
└─────────────────────────────────────────────┘
    ↓
    ├─→ GitHub MCP (Personal Access Token)
    ├─→ PostgreSQL MCP (DATABASE_URL)
    ├─→ Filesystem MCP (Project root)
    ├─→ Playwright MCP (Browser automation)
    ├─→ AWS MCP (AWS credentials)
    └─→ Memory MCP (Session memory)
```

---

## Quick Setup (3 steps)

### Step 1: Copy Environment Variables
```bash
cp .env.local.example .env.local
```

### Step 2: Fill in Your Credentials
Edit `.env.local` and add:
- `GITHUB_PERSONAL_ACCESS_TOKEN`
- `DATABASE_URL`
- `AWS_ACCESS_KEY_ID` + `AWS_SECRET_ACCESS_KEY`

### Step 3: Verify Claude Code Loads MCP
```bash
claude-code
```
When Claude Code starts, it will load all 6 MCP servers from `.mcp.json`.

---

## Detailed Setup Instructions

### 1. GitHub MCP

**Purpose**: Create issues, manage PRs, search repository, check CI status

**Setup**:
1. Go to: https://github.com/settings/tokens?type=beta
2. Click "Generate new token"
3. Set token name: `claude-code-github`
4. Select **Fine-grained permissions**:
   - **Repository access**: All repositories
   - **Permissions needed**:
     - Contents: Read & Write
     - Issues: Read & Write
     - Pull requests: Read & Write
     - Workflows: Read
5. Generate token
6. Copy token to `.env.local`:
```env
GITHUB_PERSONAL_ACCESS_TOKEN=github_pat_xxxxx
```

**Test it**:
```
"Create a GitHub issue titled 'Test MCP Setup' with description 'MCP servers working'"
```

---

### 2. PostgreSQL MCP

**Purpose**: Query database, inspect schemas, debug migrations

**Prerequisites**:
- PostgreSQL running locally OR
- Cloud database (AWS RDS, Render, etc.)

**Setup**:

#### Local PostgreSQL (Docker - Recommended for dev)
```bash
docker run --name digitalfte-postgres \
  -e POSTGRES_PASSWORD=password \
  -e POSTGRES_DB=digitalfte_dev \
  -p 5432:5432 \
  -d postgres:15

# Wait 5 seconds for startup
sleep 5

# Verify connection
psql postgresql://postgres:password@localhost:5432/digitalfte_dev -c "SELECT version();"
```

#### Or: Install Locally (macOS)
```bash
brew install postgresql@15
brew services start postgresql@15
createdb digitalfte_dev
```

#### Or: Use Cloud Database
- **AWS RDS**: Create PostgreSQL instance
- **Render**: Create PostgreSQL database
- **Supabase**: Create PostgreSQL project

**Configure in `.env.local`**:
```env
# Local Docker
DATABASE_URL=postgresql://postgres:password@localhost:5432/digitalfte_dev

# OR AWS RDS
DATABASE_URL=postgresql://admin:password@digital-fte.c9akciq32.us-east-1.rds.amazonaws.com:5432/digitalfte_dev

# OR Cloud (Render, Supabase, etc.)
DATABASE_URL=postgresql://user:password@host:port/database
```

**Verify connection**:
```bash
npx @modelcontextprotocol/server-postgres "${DATABASE_URL}"
```

**Test it**:
```
"Show me the schema of the User table"
"How many users are in the database?"
"Run: SELECT * FROM users LIMIT 5"
```

---

### 3. Filesystem MCP

**Purpose**: Read/write files, search codebase, navigation

**Setup**: Already configured in `.mcp.json` - no additional setup needed!

**What it can do**:
- Read any file in the project
- Create new files
- Search across all files
- Show file structure

**Test it**:
```
"Show me the structure of the apps/api directory"
"Search for all files that import Prisma"
"Create a new file at src/utils/example.ts"
```

---

### 4. Playwright MCP

**Purpose**: Browser automation, test form handlers, debug UI interactions

**Setup**:
1. Playwright is already configured in `.mcp.json`
2. First run will auto-download browsers (may take 2-3 minutes)

```bash
# Manual browser install (optional)
npx playwright install chromium
```

**Configure in `.env.local`** (optional):
```env
# If you have specific browser preferences
PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=false
```

**Safety Rules** ⚠️
- Never submit real applications during testing
- Always test on sandbox/test job URLs
- Auto-apply rules still apply during Playwright testing
- Get explicit approval before any form submission

**Test it**:
```
"Open https://example.com and take a screenshot"
"Test the job application form on [TEST_URL]"
"Verify that the 'Apply' button is clickable"
```

---

### 5. AWS MCP

**Purpose**: Deploy CDK stacks, check Lambda logs, inspect SQS, S3 operations

**Prerequisites**:
- AWS Account (free tier works)
- IAM User with appropriate permissions

**Setup**:

#### Create AWS IAM User
1. Go to: https://console.aws.amazon.com/iam/
2. Click "Users" → "Create user"
3. Username: `claude-code-dev`
4. Attach policies:
   - `AdministratorAccess` (for dev) OR more restrictive:
     - `AWSCloudFormationFullAccess` (CDK)
     - `AmazonEC2FullAccess` (if using EC2)
     - `AmazonSQSFullAccess` (SQS queue ops)
     - `AmazonS3FullAccess` (S3 bucket ops)
     - `CloudWatchLogsReadOnlyAccess` (Lambda logs)
     - `AWSSecretsManagerReadSecretPolicy` (Secrets)
5. Create access key
6. Copy credentials

#### Add to `.env.local`
```env
AWS_ACCESS_KEY_ID=AKIA_xxxxxxxxxxxxx
AWS_SECRET_ACCESS_KEY=your_secret_access_key_here
AWS_REGION=us-east-1
```

**Verify Setup**:
```bash
aws sts get-caller-identity
```

Should return your AWS account info.

**Test it**:
```
"List all S3 buckets"
"Show me the CloudWatch logs for the job-search-lambda function"
"What's the depth of the auto-apply DLQ?"
"Check if the resume-builder ECS task is running"
```

---

### 6. Memory MCP

**Purpose**: Store architectural decisions, track progress, remember patterns

**Setup**: No configuration needed! Memory MCP is fully local.

**How it works**:
- Stores decisions in local file system
- Survives between Claude Code sessions
- Use at start of session: "What do you remember about this project?"
- Use at end of session: "Save today's progress to memory"

**Example memory entries**:
```
"ATS handlers completed: Workday ✅, Greenhouse ✅, Lever ⏳"
"Decision: use Redis sorted sets for quiet hour scheduling"
"Bug fix: Telegram webhook needs text field guard clause"
"Pattern: all form validation uses Zod schemas"
```

**Test it**:
```
"Store: 'MCP setup completed on [date]'"
"What do you remember about the auto-apply feature?"
"Save: 'All 6 MCP servers are now configured'"
```

---

## Verify All MCP Servers

Run this command to test all 6 servers:

```bash
# Start Claude Code
claude-code

# Then in the session:
"Tell me:
1. GitHub - your access status
2. PostgreSQL - total user count
3. Filesystem - project structure
4. Playwright - browser ready status
5. AWS - current IAM identity
6. Memory - do you remember anything?"
```

---

## .env.local Configuration Reference

Here's the complete `.env.local` file with all MCP environment variables:

```env
# ═══════════════════════════════════════════════════════════════════════════════
# Digital FTE for HR — MCP Servers Configuration
# ═══════════════════════════════════════════════════════════════════════════════

# ── CLAUDE CODE / ANTHROPIC ────────────────────────────────────────────────────
ANTHROPIC_API_KEY=sk-ant-your-actual-key-here

# ── GITHUB MCP ─────────────────────────────────────────────────────────────────
# Create: https://github.com/settings/tokens?type=beta
# Scopes: repo (full), workflow, read:org
GITHUB_PERSONAL_ACCESS_TOKEN=github_pat_your_token_here

# ── POSTGRESQL MCP ─────────────────────────────────────────────────────────────
# Format: postgresql://USER:PASSWORD@HOST:PORT/DATABASE
# Local Docker:   postgresql://postgres:password@localhost:5432/digitalfte_dev
# AWS RDS:        postgresql://admin:password@digital-fte.c9akciq32.us-east-1.rds.amazonaws.com:5432/digitalfte_dev
# Cloud (Render): postgresql://user:password@render-host:5432/database
DATABASE_URL=postgresql://postgres:password@localhost:5432/digitalfte_dev

# ── PLAYWRIGHT MCP ─────────────────────────────────────────────────────────────
# No configuration needed — Playwright auto-manages browsers
# Optional: control browser download
PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=false

# ── AWS MCP ────────────────────────────────────────────────────────────────────
# Create IAM user: https://console.aws.amazon.com/iam/
# Attach: AdministratorAccess (or more restrictive policies)
AWS_ACCESS_KEY_ID=AKIA_your_access_key_id_here
AWS_SECRET_ACCESS_KEY=your_secret_access_key_here
AWS_REGION=us-east-1

# ── MEMORY MCP ─────────────────────────────────────────────────────────────────
# No configuration needed — Memory MCP is fully local

# ═══════════════════════════════════════════════════════════════════════════════
# APPLICATION CONFIGURATION (Backend + Frontend)
# ═══════════════════════════════════════════════════════════════════════════════

# ── Node Environment ──────────────────────────────────────────────────────────
NODE_ENV=development

# ── Twilio (WhatsApp integration) ──────────────────────────────────────────────
TWILIO_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_AUTH=your_twilio_auth_token
TWILIO_WHATSAPP_NUMBER=whatsapp:+14155238886

# ── Telegram (Bot integration) ─────────────────────────────────────────────────
# Create bot: message @BotFather on Telegram → /newbot
TELEGRAM_BOT_TOKEN=1234567890:ABCdefGhIjKlmNoPqRsTuVwXyZ

# ── Amazon Cognito (Authentication) ────────────────────────────────────────────
COGNITO_USER_POOL_ID=us-east-1_xxxxxxxxx
COGNITO_CLIENT_ID=xxxxxxxxxxxxxxxxxxxxxxxxxx
COGNITO_CLIENT_SECRET=your_cognito_client_secret

# ── Redis (Queue + caching) ────────────────────────────────────────────────────
# Local: redis://localhost:6379
# ElastiCache: redis://digital-fte.xxxxx.ng.0001.use1.cache.amazonaws.com:6379
REDIS_URL=redis://localhost:6379

# ── Amazon SES (Email) ─────────────────────────────────────────────────────────
SES_FROM_EMAIL=noreply@yourdomain.com
SES_FROM_NAME=Digital FTE

# ── Amazon S3 (File storage) ──────────────────────────────────────────────────
S3_BUCKET_RESUMES=digital-fte-resumes-dev
S3_BUCKET_SCREENSHOTS=digital-fte-screenshots-dev
S3_REGION=us-east-1

# ── OpenSearch (Vector search for job matching) ───────────────────────────────
OPENSEARCH_ENDPOINT=https://your-collection-id.us-east-1.aoss.amazonaws.com

# ── Stripe (Payment processing) ────────────────────────────────────────────────
STRIPE_SECRET_KEY=sk_test_your_key_here
STRIPE_WEBHOOK_SECRET=whsec_your_secret_here

# ── API Configuration ──────────────────────────────────────────────────────────
NEXT_PUBLIC_API_URL=http://localhost:4000
NEXT_PUBLIC_DEBUG_MODE=false

# ── NextAuth (Frontend authentication) ─────────────────────────────────────────
NEXTAUTH_SECRET=your-random-secret-key-generate-with-openssl
NEXTAUTH_URL=http://localhost:3001
```

---

## Troubleshooting

### "Error: MCP server failed to start"

**Check logs**:
```bash
# Claude Code writes logs to
~/.claude/logs/
```

**Common causes**:
1. Missing environment variable
   - Verify `.env.local` has all required variables
   - Check variable names exactly match `.mcp.json`

2. Server not available
   - GitHub: Check token is valid and has correct scopes
   - PostgreSQL: Verify `DATABASE_URL` is correct and database is running
   - AWS: Check IAM credentials are valid

3. Port conflict
   - Playwright: Ensure port 3000+ is available

### "GitHub token expired"

**Fix**:
1. Go to: https://github.com/settings/tokens
2. Delete old `claude-code-github` token
3. Create new token (follow Step 1 in GitHub MCP section)
4. Update `.env.local`
5. Restart Claude Code

### "PostgreSQL connection refused"

**Check**:
```bash
# If using Docker
docker ps  # Is postgres container running?
docker start digitalfte-postgres  # Start if stopped

# If using local PostgreSQL
brew services status postgresql@15
brew services start postgresql@15
```

### "AWS credentials not found"

**Verify**:
```bash
aws sts get-caller-identity
```

If error, check:
1. `.env.local` has `AWS_ACCESS_KEY_ID` and `AWS_SECRET_ACCESS_KEY`
2. Keys are valid (not expired)
3. IAM user has required permissions

### "Playwright: Browser not found"

**Fix**:
```bash
npx playwright install chromium
```

---

## Security Best Practices

⚠️ **CRITICAL: Never commit `.env.local` to git**

1. `.gitignore` includes `.env.local` - verify it's not tracked
   ```bash
   git status  # Should NOT list .env.local
   ```

2. For team development:
   - Use `.env.local.example` as template
   - Each developer creates their own `.env.local`
   - Share template, never share actual values

3. Rotate secrets periodically:
   - GitHub token: Monthly
   - AWS keys: Quarterly
   - `NEXTAUTH_SECRET`: When adding/removing users

4. Production deployment:
   - Never push `.env.local` to CI/CD
   - Use CI/CD secrets management (GitHub Actions Secrets, etc.)
   - AWS: Use OIDC role assumption instead of keys

---

## When to Use Each MCP Server

| Task | MCP Server | Command |
|------|-----------|---------|
| Create PR for feature | GitHub | "Create a PR..." |
| Check CI status | GitHub | "Check GitHub Actions..." |
| Query user count | PostgreSQL | "SELECT COUNT..." |
| Debug migration | PostgreSQL | "Show migration logs..." |
| Read project file | Filesystem | "Read apps/api/src/..." |
| Search for function | Filesystem | "Search for 'useJob'..." |
| Test form filling | Playwright | "Fill job form on [URL]..." |
| Screenshot UI | Playwright | "Take screenshot..." |
| Deploy CDK stack | AWS | "Deploy ApiStack..." |
| Check Lambda logs | AWS | "Show logs for..." |
| Remember decision | Memory | "Store: 'Decision about...'" |
| Recall progress | Memory | "What do you remember..." |

---

## Full Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                          Digital FTE for HR                                  │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                               │
│  ┌─────────────────┐                    ┌──────────────────────┐            │
│  │  Claude Code    │                    │    .mcp.json Config  │            │
│  │   (Interface)   │◄──────────────────►│  (6 MCP Servers)    │            │
│  └─────────────────┘                    └──────────────────────┘            │
│           │                                      │                           │
│           │                                      ├─► GitHub MCP             │
│           │                                      ├─► PostgreSQL MCP         │
│           │                                      ├─► Filesystem MCP         │
│           │                                      ├─► Playwright MCP         │
│           │                                      ├─► AWS MCP               │
│           │                                      └─► Memory MCP            │
│           │                                                                 │
│           └──────────────────────┬──────────────────────────────────────   │
│                                  │                                          │
│          ┌──────────────────────▼────────────────────────┐                │
│          │         Project Resources                      │                │
│          ├──────────────────────────────────────────────┤                │
│          │  ✅ GitHub Repos (digital-fte-hr)           │                │
│          │  ✅ PostgreSQL (digitalfte_dev)             │                │
│          │  ✅ Project Files                            │                │
│          │  ✅ AWS Infrastructure (CDK)                 │                │
│          │  ✅ Browser Automation (Playwright)          │                │
│          │  ✅ Session Memory (MCP Memory)              │                │
│          └──────────────────────────────────────────────┘                │
│                                                                               │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Next Steps

1. ✅ Fill in `.env.local` with all 6 MCP credentials
2. ✅ Start Claude Code: `claude-code`
3. ✅ Test each MCP server individually
4. ✅ Begin development with full MCP capabilities!

---

**Questions?** Check the inline comments in:
- `.mcp.json` - Server configurations
- `mcp-tools/SKILL.md` - MCP server reference
- `.env.local` - Environment variable reference
