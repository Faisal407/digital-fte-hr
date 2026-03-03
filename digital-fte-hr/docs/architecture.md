# System Architecture — Digital FTE for HR
# Reference doc — load with @docs/architecture.md

## System Overview

Digital FTE is a cloud-native, event-driven multi-agent platform. Three specialized AI agents
work in concert via async messaging. No synchronous agent-to-agent calls — all coordination
is through SQS messages and shared database state.

```
User (Web/Mobile/WhatsApp/Telegram)
        │
        ▼
┌─────────────────────────────────────────────────────┐
│                 API Gateway (REST)                  │
│              apps/api → AWS Lambda                  │
└──────────┬──────────────┬──────────────┬────────────┘
           │              │              │
     SQS Queue       SQS Queue      SQS Queue
   job-search-       resume-        auto-apply-
    requests        optimizer       submissions
           │              │              │
    ┌──────▼──┐    ┌───────▼──┐   ┌──────▼──────┐
    │  Job    │    │  Resume  │   │ Auto-Apply  │
    │ Search  │    │ Builder  │   │   Agent     │
    │  Agent  │    │  Agent   │   │  (ECS+PW)   │
    │ (ECS)   │    │  (ECS)   │   │             │
    └──────┬──┘    └───────┬──┘   └──────┬──────┘
           │               │             │
           └───────────────┼─────────────┘
                           │
                    ┌──────▼──────┐
                    │  Channel    │
                    │Orchestration│
                    │  (COS)      │
                    └──────┬──────┘
                           │
              ┌────────────┼────────────┐
              ▼            ▼            ▼
          WhatsApp     Telegram      Email
          (Twilio)    (Bot API)     (SES)
```

## Service Boundaries (M-2 Fix — notification-agent is NOT a separate service)

```
services/channel-orchestration/ — THE ONLY messaging service
  Responsibilities:
  - Receive notification events from all 3 agents via SQS
  - Route to correct channel (WhatsApp/Telegram/Email) based on user preferences
  - Enforce quiet hours, suppression list, deduplication
  - Send via Twilio (WhatsApp), Telegram Bot API, Amazon SES (Email)
  - Handle incoming webhooks from WhatsApp and Telegram
  - Schedule deferred messages (EventBridge for > 15min delay)

  There is NO separate "notification-agent" service in Phase 1.
  The root CLAUDE.md directory listing was incorrect — it has been fixed.
```

## Data Flow: Job Search
```
1. User sends search request (web/mobile/WhatsApp/Telegram)
2. API Lambda validates + enqueues to SQS job-search-requests
3. ECS task (job-search-agent) consumes message
4. LangGraph agent runs: scrape 15+ platforms in parallel
5. Results deduplicated, scored (Claude Haiku), ghost-detected
6. JobMatch records written to Aurora PostgreSQL
7. Top matches → SQS channel-events → channel-orchestration → WhatsApp/Telegram notification
8. Full results available via GET /api/v1/jobs/search/{taskId}
```

## Data Flow: Resume Optimization
```
1. User uploads resume (PDF/DOCX/voice/LinkedIn URL)
2. API Lambda stores to S3, enqueues to SQS resume-optimizer
3. ECS task (resume-builder-agent) consumes message
4. Pipeline: parse → extract → run 5 parallel sub-agents → AuthenticityAgent (last)
5. ATS score computed (23 checkpoints)
6. Optimized resume exported to PDF + DOCX, stored in S3
7. Pre-signed URLs returned via task polling
8. Score change → channel-orchestration notification
```

## Data Flow: Auto-Apply
```
1. User approves application (PATCH /api/v1/applications/{id}/approve)
2. Lambda writes approval to DynamoDB, enqueues to SQS auto-apply-submissions
3. ECS Fargate task (auto-apply-agent) with Playwright browser consumes message
4. Playwright navigates to job URL, detects ATS type (Workday/Greenhouse/Lever/etc.)
5. Form filled using user profile + answer memory bank
6. Screenshot captured (pre-submit), form submitted, screenshot captured (post-submit)
7. Both screenshots stored in S3 with 90-day retention
8. Application status updated in Aurora
9. channel-orchestration sends confirmation to user
```

## AWS Services Map

```
Compute:
  Lambda        → API handlers, webhook handlers, scheduled cleanup jobs
  ECS Fargate   → Long-running agents (job search, resume, auto-apply)

Storage:
  Aurora PostgreSQL → Primary relational data (users, jobs, applications, resumes)
  DynamoDB          → Audit logs, task status, rate limit state, approval gates
  ElastiCache Redis → Session state, rate limit tokens, dedup keys, active browser sessions
  S3                → Resume files, screenshots, exported PDFs, voice recordings

Messaging:
  SQS           → Agent job queues (job-search, resume-optimizer, auto-apply, channel-events)
  EventBridge   → Scheduled jobs (weekly reports, daily cap reset, voice file cleanup)

Search:
  OpenSearch Serverless → Job semantic search index + resume embedding index
  Titan Embeddings v2   → Embedding generation (job descriptions + resume content)

API & Auth:
  API Gateway   → REST endpoint management
  Cognito       → User authentication, JWT issuance

Delivery:
  SES           → Transactional + subscription emails
  CloudFront    → Frontend CDN, resume PDF delivery

Observability:
  CloudWatch    → Logs, metrics, alarms
  X-Ray         → Distributed tracing across Lambda + ECS
```

## OpenSearch Index Design
```json
// job-listings index
{
  "mappings": {
    "properties": {
      "id":          { "type": "keyword" },
      "title":       { "type": "text", "analyzer": "english" },
      "description": { "type": "text", "analyzer": "english" },
      "embedding":   { "type": "knn_vector", "dimension": 1536 },
      "platform":    { "type": "keyword" },
      "postedAt":    { "type": "date" },
      "location":    { "type": "text" },
      "isGhost":     { "type": "boolean" }
    }
  }
}
// resume-profiles index uses same knn_vector structure for embedding
// Semantic match = cosine similarity between resume embedding + job embedding
// Threshold: cosine > 0.72 = candidate match worth presenting to user
```

## Multi-Environment Strategy
```
dev:    Local + AWS dev account (reduced capacity, lower rate limits)
staging: AWS staging account (mirrors prod, used for regression testing)
prod:   AWS production account (full capacity, monitoring enabled)

Environment variable: ENVIRONMENT = 'dev' | 'staging' | 'prod'
CDK uses this to name all stacks: DigitalFTE-API-prod, DigitalFTE-DB-prod, etc.
```
