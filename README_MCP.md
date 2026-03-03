# MCP Servers - Digital FTE for HR

## Overview

This project includes **6 fully-configured MCP (Model Context Protocol) servers** that extend Claude Code with professional-grade capabilities.

With these MCP servers, Claude Code can:
- ✅ Manage your GitHub repositories directly
- ✅ Query and debug your PostgreSQL database
- ✅ Read, write, and search project files
- ✅ Automate browser testing with Playwright
- ✅ Deploy infrastructure with AWS CDK
- ✅ Store architectural decisions persistently

---

## 🚀 Quick Start (3 minutes)

### Step 1: Setup Environment
```bash
cp .env.local.example .env.local
```

### Step 2: Add Credentials (minimum 3)
Edit `.env.local` with your credentials:
```env
GITHUB_PERSONAL_ACCESS_TOKEN=github_pat_xxxxx
DATABASE_URL=postgresql://postgres:password@localhost:5432/digitalfte_dev
AWS_ACCESS_KEY_ID=AKIA_xxxxx
AWS_SECRET_ACCESS_KEY=xxxxx
AWS_REGION=us-east-1
```

### Step 3: Start Claude Code
```bash
claude-code
```

**That's it!** All 6 MCP servers auto-load from `.mcp.json`.

### Step 4: Verify (Optional)
```bash
bash verify-mcp.sh
```

---

## 📚 Documentation

### For First-Time Setup
→ **Read**: `MCP_QUICKSTART.md` (10 minutes)

### For Complete Reference
→ **Read**: `MCP_SETUP_GUIDE.md` (comprehensive)

### For Status Check
→ **Read**: `MCP_SETUP_COMPLETE.md` (what's configured)

### For Implementation
→ **Read**: `mcp-tools/SKILL.md` (when to use each server)

---

## 🔧 The 6 MCP Servers

### 1️⃣ GitHub MCP
**Purpose**: Repository management, PRs, issues, CI/CD

**What Claude Can Do**:
- Create and review pull requests
- Create and close issues
- Search repository code
- Check CI/CD pipeline status

**Setup**: 5 minutes
```env
GITHUB_PERSONAL_ACCESS_TOKEN=github_pat_xxxxx
```
Get from: https://github.com/settings/tokens?type=beta

**Test It**:
```
"Create a GitHub issue titled 'Feature: Add dark mode'"
```

---

### 2️⃣ PostgreSQL MCP
**Purpose**: Database queries, schema inspection, debugging

**What Claude Can Do**:
- Run SELECT queries on dev database
- Inspect table schemas and indexes
- Debug failed migrations
- Check data integrity

**Setup**: 5 minutes
```env
DATABASE_URL=postgresql://postgres:password@localhost:5432/digitalfte_dev
```

**Options**:
- Local Docker (recommended)
- AWS RDS
- Cloud database (Render, Supabase, etc.)

**Test It**:
```
"Show me the User table schema"
"How many users are in the database?"
```

---

### 3️⃣ Filesystem MCP
**Purpose**: File operations, code search, navigation

**What Claude Can Do**:
- Read any file in the project
- Create new files
- Search across codebase
- Navigate project structure

**Setup**: ✅ Already configured (no action needed)

**Test It**:
```
"Show the structure of apps/web/components"
"Search for all files importing useAuth"
```

---

### 4️⃣ Playwright MCP
**Purpose**: Browser automation, form testing, UI verification

**What Claude Can Do**:
- Open URLs and take screenshots
- Test form filling
- Verify clickability of elements
- Test job application flows

**Setup**: ✅ Auto-managed (no action needed)

First run: Auto-downloads browsers (2-3 minutes, ~500MB)

**Safety**: Auto-apply rules always apply. Never submit real applications.

**Test It**:
```
"Open https://example.com and take a screenshot"
"Test if the Apply button is clickable on [URL]"
```

---

### 5️⃣ AWS MCP
**Purpose**: Cloud infrastructure, deployment, monitoring

**What Claude Can Do**:
- Deploy CDK stacks
- Read CloudWatch logs
- Check Lambda function status
- Inspect SQS queues
- Manage S3 buckets

**Setup**: 5 minutes
```env
AWS_ACCESS_KEY_ID=AKIA_xxxxxxxxxxxxx
AWS_SECRET_ACCESS_KEY=your_secret_key_here
AWS_REGION=us-east-1
```

Get from: https://console.aws.amazon.com/iam/

Create user: `claude-code-dev` with `AdministratorAccess` (dev only)

**Test It**:
```
"Deploy the ApiStack to dev"
"Show Lambda logs for job-search"
"Check SQS queue depth"
```

---

### 6️⃣ Memory MCP
**Purpose**: Persistent decision storage across sessions

**What Claude Can Do**:
- Store architectural decisions
- Track progress between sessions
- Remember patterns and conventions
- Recall past discussions

**Setup**: ✅ Zero configuration (fully local)

**Test It**:
```
"Store: 'Decided to use Zod for form validation'"
"What do you remember about this project?"
"Save: 'ATS handlers completed: Workday ✅'"
```

---

## 🎯 Common Tasks

### GitHub Tasks
```
"Create a PR for the feature branch"
"Check if CI passed for the latest commit"
"Search for all TypeScript files using Prisma"
```

### Database Tasks
```
"List all tables in the database"
"Check if users table has proper indexes"
"Debug why the migration failed"
```

### File Tasks
```
"Find all files that import from @/lib"
"Create a new utility file for date formatting"
"Show me the component structure"
```

### Browser Tasks
```
"Take a screenshot of the login page"
"Test the job application form"
"Verify that the navigation bar is responsive"
```

### AWS Tasks
```
"Deploy the infrastructure changes"
"Check the error logs for the API Lambda"
"List all S3 buckets in the account"
```

### Memory Tasks
```
"Remember that we're using Redis for caching"
"What architectural decisions have we made?"
"Store this pattern for future reference"
```

---

## 🔍 Verify Setup

### Check Configuration
```bash
bash verify-mcp.sh
```

This will check:
- ✅ GitHub token configured and valid format
- ✅ PostgreSQL connection working
- ✅ AWS credentials valid
- ✅ All .mcp.json servers present

### Test in Claude Code
```
"Tell me:
1. Your GitHub status
2. PostgreSQL version
3. AWS account ID
4. All configured MCP servers"
```

---

## 📊 Files Included

### Configuration
- `.mcp.json` - MCP server definitions
- `.env.local.example` - Environment variable template

### Documentation
- `MCP_QUICKSTART.md` - 10-minute quick start
- `MCP_SETUP_GUIDE.md` - Comprehensive setup guide
- `MCP_SETUP_COMPLETE.md` - Completion summary
- `README_MCP.md` - This file
- `mcp-tools/SKILL.md` - Implementation reference

### Tools
- `verify-mcp.sh` - Verification script

---

## 🔒 Security

### Never Commit `.env.local`
- `.env.local` is in `.gitignore`
- Never share your credentials
- Use `.env.local.example` as template

### GitHub Token
- Use fine-grained token (not classic)
- Minimal scopes: repo, workflow, read:org
- Rotate quarterly

### AWS Credentials
- Create dev-only IAM user
- Never use production credentials locally
- Rotate quarterly
- Use OIDC role assumption in CI/CD

### PostgreSQL
- Use dev database locally
- Never use production database
- Test safely without affecting real data

---

## 🆘 Troubleshooting

### "MCP server failed to start"
Check `.env.local` has all required variables:
```bash
grep GITHUB_PERSONAL_ACCESS_TOKEN .env.local
grep DATABASE_URL .env.local
grep AWS_ACCESS_KEY_ID .env.local
```

### "Cannot connect to PostgreSQL"
```bash
# If using Docker
docker ps
docker start digitalfte-postgres

# Or start local PostgreSQL
brew services start postgresql@15
```

### "AWS credentials invalid"
```bash
aws sts get-caller-identity
```

If error, refresh your AWS credentials.

### "Playwright: Browser not found"
```bash
npx playwright install chromium
```

---

## 📖 Learning Resources

### Getting Started
1. `MCP_QUICKSTART.md` - Overview and setup
2. Run: `./verify-mcp.sh`
3. Test one command per server

### Deep Dive
1. `MCP_SETUP_GUIDE.md` - Detailed instructions
2. `mcp-tools/SKILL.md` - Implementation guide
3. Try advanced commands

### Reference
- Each MCP server documentation
- `.env.local.example` - Variable reference

---

## 🌟 What's Enabled

With MCP servers configured, you can:

**During Development**:
- Query database without leaving Claude Code
- Search and edit project files directly
- Create branches and PRs programmatically

**During Testing**:
- Automate browser testing
- Verify form filling works
- Screenshot verification

**During Deployment**:
- Deploy infrastructure with CDK
- Check Lambda logs
- Monitor SQS queues

**During Planning**:
- Store architectural decisions
- Remember patterns
- Track progress across sessions

---

## 🚀 Next Steps

1. ✅ Copy `.env.local.example` to `.env.local`
2. ✅ Fill in 3+ environment variables
3. ✅ Run `./verify-mcp.sh`
4. ✅ Start Claude Code: `claude-code`
5. ✅ Test with simple commands

---

## 📞 Support

**Setup Issues?**
→ See `MCP_SETUP_GUIDE.md` → Troubleshooting section

**Usage Questions?**
→ See `mcp-tools/SKILL.md` → MCP reference

**Configuration Check?**
→ Run: `bash verify-mcp.sh`

---

**All 6 MCP servers are ready to use!** 🎉

Start with: `claude-code` then `"Show GitHub status"`
