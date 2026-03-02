# Digital FTE for HR — Claude Code Project Context
# Version 1.1 — Updated March 2026 (Post-Audit Fixes Applied)

## What This Project Is
An AI-native B2C career acceleration platform — a "Digital Full-Time Employee" for job seekers.
Three specialized AI agents (Job Search, Resume Builder, Auto-Apply) + multi-channel delivery
(WhatsApp, Telegram, Email) + analytics dashboard. Claude (Anthropic) is the primary LLM.
Target markets: Global — USA, UK, EU, Middle East (NaukriGulf, Bayt), South Asia (Rozee.pk, Naukri).

## Monorepo Structure
```
digital-fte-hr/
├── apps/
│   ├── web/          → Next.js 14 frontend (App Router)          [CLAUDE.md ✅]
│   ├── api/          → Node.js/TypeScript REST API (AWS Lambda)   [CLAUDE.md ✅]
│   └── mobile/       → React Native (iOS + Android, Expo)        [CLAUDE.md ✅]
├── services/
│   ├── job-search-agent/         → LangGraph agent, Playwright scrapers    [CLAUDE.md ✅]
│   ├── resume-builder-agent/     → 6-sub-agent pipeline, ATS scoring       [CLAUDE.md ✅]
│   ├── auto-apply-agent/         → SQS queue, Playwright form-filler       [CLAUDE.md ✅]
│   └── channel-orchestration/   → Unified messaging gateway (WhatsApp/Telegram/Email) [CLAUDE.md ✅]
│   # NOTE: notification-agent is NOT a separate service — it is channel-orchestration
│   # See docs/architecture.md for service boundary definitions
├── packages/
│   ├── db/           → Prisma schema + migrations (Aurora PostgreSQL)  [CLAUDE.md ✅]
│   ├── shared/       → Types, constants, validation schemas (Zod)      [CLAUDE.md ✅]
│   └── llm/          → Claude API wrapper, prompt templates, LangGraph [CLAUDE.md ✅]
├── infra/            → AWS CDK (TypeScript) — all infrastructure as code [CLAUDE.md ✅]
└── docs/             → Architecture docs, agent contracts, compliance specs
```

## Tech Stack (Non-Negotiable — Phase 1)
- **LLM**: `claude-sonnet-4-6` (complex tasks) + `claude-haiku-4-5-20251001` (fast/cheap) via Anthropic SDK
- **Frontend**: Next.js 14 App Router, React, Tailwind CSS, shadcn/ui, Zustand, TanStack Query
- **Mobile**: React Native (Expo SDK 51), Victory Native charts
- **Backend**: Node.js TypeScript, AWS Lambda, ECS Fargate, API Gateway (REST only — Phase 1)
  - ⚠️ GraphQL is NOT in Phase 1 scope. REST API only. See api-conventions.md.
- **Agents**: LangGraph (Python 3.12) for orchestration, Playwright for browser automation
- **Database**: Aurora PostgreSQL v15 (Prisma ORM), DynamoDB (audit), Redis (ElastiCache), S3
- **Search**: Amazon OpenSearch Serverless + Amazon Titan Embeddings v2 (for job semantic matching)
- **Queue**: Amazon SQS + EventBridge (scheduled jobs). Step Functions: NOT used in Phase 1.
- **Email**: Amazon SES, React Email templates
- **WhatsApp**: Meta Cloud API via Twilio BSP
- **Telegram**: Telegram Bot API (node-telegram-bot-api, webhook mode)
- **Auth**: Amazon Cognito, JWT, OAuth 2.0
- **Infra**: AWS CDK v2 TypeScript, GitHub Actions CI/CD (OIDC)
- **Package Manager**: pnpm workspaces (Node), uv (Python)
- **Linting**: Biome (replaces ESLint + Prettier)

## Channels — Phase 1 vs Phase 2
```
Phase 1 (this codebase): WhatsApp + Telegram + Email
Phase 2 (future):        Instagram DM + Facebook Messenger + LinkedIn DM
                         See addendum Section 11 for Phase 2 social channel specs.
                         Do NOT build social channel code in Phase 1.
```

## Plan Tiers (Freemium Model)
```typescript
type PlanTier = 'free' | 'pro' | 'elite'

// Feature gates — enforced via requirePlan() middleware
FREE:  Job search only (manual), resume builder basic (1 resume), no auto-apply
PRO:   ($29/month) Full job search + auto-apply (50 apps/day) + resume optimizer
ELITE: ($79/month) Everything + priority queue (150 apps/day) + weekly coaching report

// Plan cap for auto-apply:
FREE:  0 applications/day
PRO:   50 applications/day
ELITE: 150 applications/day (hard global cap — cannot be exceeded by any plan)
```

## Critical Commands
```bash
# Root
pnpm install              # Install all workspace packages
pnpm build                # Build all packages
pnpm test                 # Run all tests
pnpm typecheck            # TypeScript check all workspaces
pnpm lint                 # Lint all packages (Biome)

# Apps
pnpm --filter web dev     # Next.js dev server (port 3000)
pnpm --filter api dev     # API dev server (port 4000)

# Services (Python agents — use uv, NOT pip, NOT poetry)
cd services/job-search-agent     && uv run python main.py
cd services/resume-builder-agent && uv run python main.py
cd services/channel-orchestration && pnpm dev

# Database
pnpm --filter db migrate  # Run Prisma migrations
pnpm --filter db studio   # Open Prisma Studio (GUI)
pnpm --filter db seed     # Seed dev database

# Infrastructure
cd infra && pnpm cdk diff            # Preview changes
cd infra && pnpm cdk deploy --all    # Deploy all stacks

# Testing
pnpm test:ci              # Full test suite with coverage (CI mode)
pnpm test:unit            # Unit tests only
```

## Non-Negotiables (Always Follow — Zero Exceptions)
1. **Never hardcode API keys** — use `process.env.*` for local, AWS Secrets Manager in production
2. **Never auto-apply without user approval** — human-in-the-loop gate is a core product requirement
3. **Rate limit everything** — each platform scraper has a Redis token bucket; never bypass
4. **Audit log every agent action** — write to DynamoDB audit_log table BEFORE AND AFTER
5. **GDPR delete cascade** — any new table storing user PII must be registered in packages/db/gdpr-registry.ts
6. **TypeScript strict mode** — `"strict": true` in all tsconfig.json files, no `any` types
7. **Zod for all validation** — validate ALL API inputs AND LLM outputs with Zod schemas
8. **Never send outside quiet hours** — 11PM–7AM user local time, all channels

## Detailed Guidance (Auto-loaded when relevant)
- @docs/architecture.md          → Full system design, data flows, AWS services map
- @docs/agent-contracts.md       → Agent input/output schemas, tool definitions, error handling
- @docs/platform-integrations.md → Job platform API details, scraping rules, rate limits
- @docs/compliance.md            → GDPR, CAN-SPAM, WhatsApp policy, AI bias rules
- @docs/channel-specs.md         → WhatsApp templates, Telegram commands, email types
- @docs/database-schema.md       → Full Prisma schema, table relationships, indexing strategy
- @.claude/rules/agents.md       → LangGraph patterns, Claude prompt engineering, eval rules
- @.claude/rules/security.md     → Security requirements, secrets handling, PII rules
- @.claude/rules/testing.md      → Test structure, coverage targets, agent testing patterns
- @.claude/rules/api-conventions.md → REST patterns, response formats, error codes, plan gates
