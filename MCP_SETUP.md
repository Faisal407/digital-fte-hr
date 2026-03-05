# MCP Setup — Digital FTE for HR
# Run these commands ONCE from your project root (D:\digital-fte-hr)
# Then MCPs are active every time you open Claude Code in this folder

## Step 1 — Set up your environment file
# Copy the template and fill in your real values:
# Copy .env.local.template → .env.local
# Open .env.local and fill in each value (instructions inside the file)

## Step 2 — Run these 6 commands in PowerShell from D:\digital-fte-hr

claude mcp add github -e GITHUB_PERSONAL_ACCESS_TOKEN=your_token -- npx -y @modelcontextprotocol/server-github

claude mcp add postgres -e DATABASE_URL=postgresql://postgres:password@localhost:5432/digitalfte_dev -- npx -y @modelcontextprotocol/server-postgres

claude mcp add filesystem -- npx -y @modelcontextprotocol/server-filesystem .

claude mcp add playwright -- npx -y @playwright/mcp@latest

claude mcp add memory -- npx -y @modelcontextprotocol/server-memory

claude mcp add aws -e AWS_ACCESS_KEY_ID=your_key -e AWS_SECRET_ACCESS_KEY=your_secret -e AWS_REGION=us-east-1 -- npx -y @awslabs/mcp-server-aws

## Step 3 — Copy the SKILL.md into your skills folder
# Copy: mcp-tools/SKILL.md
# To:   .claude/skills/mcp-tools/SKILL.md

## Step 4 — Verify inside Claude Code
# Open claude and type: /mcp
# You should see all 6 servers listed

## What each MCP unlocks for Digital FTE

GitHub     → Claude creates branches, commits code, raises PRs, checks CI
PostgreSQL → Claude queries your dev DB, debugs migrations, verifies GDPR cascade
Filesystem → Claude reads and writes all project files directly
Playwright → Claude runs and debugs auto-apply browser scripts live
Memory     → Claude remembers decisions between sessions
AWS        → Claude deploys CDK stacks, reads Lambda logs, inspects SQS queues

## GitHub Token — Quick Setup
1. Go to github.com → Settings → Developer settings
2. Personal access tokens → Fine-grained tokens → Generate new token
3. Required permissions: Contents (read/write), Pull requests (read/write),
   Issues (read/write), Workflows (read/write), Metadata (read)
4. Copy token → paste into the command above replacing "your_token"

## AWS Keys — Quick Setup (Dev Only)
1. Go to AWS Console → IAM → Users → Create user
2. Attach policy: AdministratorAccess (dev only — never in prod)
3. Security credentials → Create access key → CLI use case
4. Copy Access Key ID and Secret → paste into command above
