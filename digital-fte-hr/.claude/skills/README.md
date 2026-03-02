# Digital FTE HR — Agent Skills Directory

> **25 SKILL.md files** across 6 domains, built for Claude Code using the [Agent Skills open standard](https://github.com/anthropics/skills) (October 2025, Anthropic).

---

## What Are Skills vs CLAUDE.md?

| | CLAUDE.md | SKILL.md |
|---|---|---|
| **Purpose** | Project memory — who you are, stack, commands | Specialized capability — how to do one specific task deeply |
| **Loaded** | Every session, always | Only when Claude determines the skill is relevant |
| **Scope** | Entire project context | One reusable domain capability |
| **Token cost** | Always in context | Only frontmatter description loaded until needed |

**You need both.** CLAUDE.md is the foundation. Skills are loaded on-demand, keeping context efficient.

---

## Skills Directory — 25 Skills Across 6 Domains

```
.claude/skills/
│
├── 🖥️  frontend/                     5 skills
│   ├── nextjs-component/             Next.js 14 App Router pages, layouts, server actions
│   ├── shadcn-ui-builder/            Digital FTE design system, ATS score ring, forms
│   ├── dashboard-chart/             Recharts KPI cards, funnels, trends, platform perf
│   ├── react-native-screen/          Expo mobile screens, push notifications, Victory charts
│   └── tailwind-design-system/       Color tokens, breakpoints, accessibility, forbidden patterns
│
├── ⚙️  backend/                      5 skills
│   ├── lambda-handler/               Lambda withMiddleware, SQS workers, webhook handlers
│   ├── api-route-builder/            REST API conventions, response envelopes, error codes
│   ├── prisma-schema/                Aurora PostgreSQL schema, migrations, RLS patterns
│   ├── sqs-worker/                   SQS consumer, partial batch failures, DLQ handling
│   └── zod-validator/                Input validation schemas for all 15 API endpoints
│
├── 🤖  agents/                       5 skills
│   ├── langgraph-agent/              Standard agent graph pattern, state machines, tools
│   ├── ats-scorer/                   23-checkpoint ATS scoring, thresholds, improvement output
│   ├── resume-optimizer/             6-sub-agent parallel optimization, AuthenticityAgent last
│   ├── job-matcher/                  Semantic matching, score breakdown, dedup, ghost detection
│   └── claude-prompt-engineer/       Prompt templates, Jinja2, Haiku vs Sonnet routing
│
├── 📡  channels/                     4 skills
│   ├── whatsapp-sender/              Twilio, approved templates, quiet hours, /stop command
│   ├── telegram-bot-handler/         14 commands, inline keyboards, Mini App, GDPR /stop
│   ├── email-composer/               React Email, SES, CAN-SPAM, unsubscribe tokens
│   └── notification-dispatcher/      Unified event router, channel priority, dedup, scheduler
│
├── 🛠️  devops/                       3 skills
│   ├── cdk-stack/                    AWS CDK v2, SecureLambda construct, Aurora, SQS+DLQ
│   ├── playwright-applier/           ATS handlers, safety rules, answer memory bank (CRITICAL)
│   └── github-actions-workflow/      PR checks, OIDC deploy, security scanning, monorepo filters
│
└── 🧪  testing/                      3 skills
    ├── vitest-unit/                  Lambda handler tests, React component tests, coverage 80%
    ├── pytest-agent/                 LangGraph graph tests, ATS scoring, safety gate tests (100%)
    └── security-audit/               CRITICAL/HIGH/MEDIUM/LOW finding checklist, scan commands
```

---

## How Claude Code Loads Skills

### Step 1 — Startup (Token-Efficient)
At session start, Claude reads only the YAML frontmatter `description` from each SKILL.md.
Each skill costs ~20-40 tokens. 25 skills = ~750 tokens total at startup.

### Step 2 — Dynamic Loading (Just-in-Time)
When you give Claude a task, it matches your intent to skill descriptions and loads the full SKILL.md only for relevant skills.

**Examples of automatic loading:**
```
"Build a job results page" → loads nextjs-component + shadcn-ui-builder
"Write a Lambda for resume upload" → loads lambda-handler + zod-validator
"Add Telegram job alert messages" → loads telegram-bot-handler + notification-dispatcher
"Deploy the agent ECS task" → loads cdk-stack + github-actions-workflow
"Test the ATS scorer" → loads pytest-agent + ats-scorer
"Review this PR for security issues" → loads security-audit
```

### Step 3 — Manual Invocation (Slash Command)
Every skill is also a slash command:
```
/nextjs-component    /shadcn-ui-builder    /dashboard-chart
/lambda-handler      /ats-scorer          /telegram-bot-handler
/cdk-stack           /security-audit      /vitest-unit
```

---

## Installation

### Claude Code (Project-Level)
Skills in `.claude/skills/` are automatically discovered when Claude Code opens the project.

```bash
# Verify Claude Code sees all skills
claude skills list
```

### Claude Code (Global — Available Across All Projects)
```bash
cp -r .claude/skills/* ~/.claude/skills/
```

### OpenAI Codex CLI (Same Format — Agent Skills Standard)
```bash
cp -r .claude/skills/* ~/.codex/skills/
```

---

## Adding New Skills

All Digital FTE skills follow the Anthropic Agent Skills spec:

```markdown
---
name: my-skill-name          # kebab-case, becomes /slash-command
description: >               # THIS IS THE MOST IMPORTANT FIELD
  Clear description of when Claude should auto-load this skill.
  Be specific about trigger phrases. Include "Use when..." language.
  Example: "Use when building any Lambda handler for the Digital FTE API..."
---

# Skill Title

## Section 1 — Core Pattern
[Code examples and patterns Claude follows]

## Section 2 — Anti-Patterns
[What NOT to do]

## Rules
- Rule 1 (these are non-negotiable constraints)
- Rule 2
```

**The `description` field is the key** — it's what Claude reads to decide if this skill applies to your current task. Make it specific and action-oriented.

---

## Domain Quick Reference

| You're working on... | Load these skills |
|---|---|
| Next.js pages or components | `nextjs-component` + `shadcn-ui-builder` |
| Analytics dashboard | `dashboard-chart` + `tailwind-design-system` |
| Mobile app screens | `react-native-screen` |
| Lambda API endpoints | `lambda-handler` + `zod-validator` |
| Database schema changes | `prisma-schema` |
| Background job processing | `sqs-worker` + `lambda-handler` |
| LangGraph agent graph | `langgraph-agent` + `claude-prompt-engineer` |
| Resume scoring / optimization | `ats-scorer` + `resume-optimizer` |
| Job search pipeline | `job-matcher` + `langgraph-agent` |
| WhatsApp features | `whatsapp-sender` + `notification-dispatcher` |
| Telegram bot features | `telegram-bot-handler` + `notification-dispatcher` |
| Email templates | `email-composer` |
| AWS infrastructure | `cdk-stack` |
| CI/CD pipelines | `github-actions-workflow` |
| Browser automation / apply | `playwright-applier` ⚠️ safety-critical |
| TypeScript tests | `vitest-unit` |
| Python agent tests | `pytest-agent` |
| Security review | `security-audit` |

---

## Safety-Critical Skills

Two skills have extra safety requirements that override all other instructions:

### `playwright-applier` — Auto-Apply Agent
- **Never submit** without `verify_approval()` passing
- **Always screenshot** before and after submission
- **Never fill** SSN, passport, bank account, salary history
- **Hard cap**: 150 applications per user per day
- **CAPTCHA**: Pause workflow, notify user — never attempt bypass

### `security-audit`
- **CRITICAL findings block all merges**
- **HIGH findings** must be fixed in same sprint as discovery
- Run secret scanner on every commit
- Auto-apply safety findings are automatically elevated to CRITICAL

---

*Digital FTE HR Platform · Skill Library v1.0 · Built on Anthropic Agent Skills Open Standard*
