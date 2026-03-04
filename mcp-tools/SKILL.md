---
name: mcp-tools
description: "Use this skill when working with any MCP server tool in this project — GitHub (repos, PRs, issues, branches), PostgreSQL (query DB, inspect schema, debug migrations), Filesystem (read/write project files), Playwright (run browser automation, debug auto-apply), AWS (CDK deploy, Lambda logs, SQS inspect), or Memory (store/recall architectural decisions across sessions). Load this whenever Claude needs to interact with external tools or services directly."
---

# MCP Tools — Digital FTE for HR
# Reference: what each MCP server can do and when to use it

## GitHub MCP — Use for all git/repo operations
```
# What Claude can do with GitHub MCP:
- Read/create/update issues and PRs
- Create branches and commits
- Read CI/CD workflow status
- Review code in PRs
- Search codebase across commits

# When to use:
- "Create a GitHub issue for this bug"
- "Open a PR for this feature"
- "Check if the CI pipeline passed"
- "Search all files that reference SQS"
```

## PostgreSQL MCP — Use for all database operations
```
# What Claude can do with PostgreSQL MCP:
- Run SELECT queries directly on dev database
- Inspect table schemas and indexes
- Debug failed migrations
- Check data integrity after seeding
- Verify row-level security is working

# When to use:
- "Check the current schema of job_application table"
- "Show me all users with pro plan"
- "Why did this migration fail"
- "Verify the GDPR deletion cascade worked"

# IMPORTANT: Connected to DATABASE_URL in .env.local
# Always use dev database — never connect to production
```

## Filesystem MCP — Use for reading/writing project files
```
# What Claude can do with Filesystem MCP:
- Read any file in the project
- Write and create new files
- Search across the codebase
- Rename and move files

# When to use:
- Reading existing code before modifying it
- Writing new service files
- Searching for all usages of a function
```

## Playwright MCP — Use for browser automation development
```
# What Claude can do with Playwright MCP:
- Run Playwright scripts live
- Debug auto-apply form filling
- Test ATS handler scripts (Workday, Greenhouse, Lever)
- Verify screenshot capture is working
- Test CAPTCHA detection logic

# When to use:
- "Test the Workday form handler on this URL"
- "Run the auto-apply integration test"
- "Debug why the screenshot is blank"
- "Verify the apply button selector is correct"

# CRITICAL: Auto-apply safety rules STILL apply during testing
# Never submit a real application during development testing
# Always use test job URLs or sandbox environments
```

## AWS MCP — Use for infrastructure and cloud operations
```
# What Claude can do with AWS MCP:
- Run CDK diff and deploy
- Read CloudWatch logs from Lambda
- Inspect SQS queue depth and DLQ
- Check S3 bucket contents
- Read Secrets Manager values (dev only)
- Describe ECS task status

# When to use:
- "Deploy the ApiStack to dev"
- "Check the Lambda logs for the job search handler"
- "How many messages are in the auto-apply DLQ"
- "Is the ECS resume builder task running"

# Connected to: AWS_ACCESS_KEY_ID + AWS_SECRET_ACCESS_KEY in .env.local
# Dev account only — production uses GitHub Actions OIDC
```

## Memory MCP — Use to persist decisions across sessions
```
# What Claude stores in memory:
- Architecture decisions made during development
- Which ATS handlers have been built
- Which API endpoints are complete
- Bugs found and their fixes
- Patterns established for this project

# When to use:
- Start every session: "What do you remember about this project?"
- End every session: "Save today's progress to memory"
- Before major decisions: "What did we decide about X?"

# Example memory entries Claude should maintain:
- "ATS handlers completed: Workday ✅, Greenhouse ✅, Lever ⏳"
- "Decision: use Redis sorted sets for quiet hour scheduling"
- "Bug: Telegram webhook fails if message has no text field — add guard"
```

## MCP Quick Reference — Which Server for What Task

| Task | MCP Server |
|------|-----------|
| Create PR / merge branch | GitHub |
| Check CI status | GitHub |
| Query database | PostgreSQL |
| Debug migration | PostgreSQL |
| Write new file | Filesystem |
| Search codebase | Filesystem |
| Test Playwright script | Playwright |
| Debug auto-apply | Playwright |
| Deploy CDK stack | AWS |
| Read Lambda logs | AWS |
| Check SQS queue | AWS |
| Remember decisions | Memory |
| Recall past sessions | Memory |
