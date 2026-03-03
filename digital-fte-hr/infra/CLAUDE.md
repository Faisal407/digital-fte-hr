# Infrastructure — Local Context
# This CLAUDE.md is for: infra/
# Inherits root CLAUDE.md + adds CDK/infrastructure-specific rules

## What This Directory Does
All AWS infrastructure for Digital FTE defined as code using AWS CDK v2 TypeScript.
Every AWS resource must be provisioned here — never create resources manually in console.

## Tech Stack
- **IaC**: AWS CDK v2 (TypeScript)
- **Deployment**: GitHub Actions (OIDC role assumption — no long-lived keys)
- **Multi-account**: dev / staging / prod are separate AWS accounts

## Directory Structure
```
infra/
├── bin/
│   └── app.ts              → CDK app entry point — instantiates all stacks
├── lib/
│   ├── stacks/
│   │   ├── NetworkStack.ts       → VPC, subnets, security groups
│   │   ├── DatabaseStack.ts      → Aurora Serverless v2 + ElastiCache Redis
│   │   ├── StorageStack.ts       → S3 buckets, OpenSearch Serverless collection
│   │   ├── AuthStack.ts          → Cognito User Pool + Identity Pool
│   │   ├── ApiStack.ts           → API Gateway + Lambda functions
│   │   ├── AgentStack.ts         → ECS Fargate clusters + task definitions
│   │   ├── ChannelStack.ts       → SQS queues (with DLQs), EventBridge rules
│   │   └── ObservabilityStack.ts → CloudWatch dashboards, alarms, X-Ray
│   └── constructs/
│       ├── SecureLambda.ts       → Lambda with mandatory defaults (always use this)
│       ├── SecureQueue.ts        → SQS + DLQ pair (always use this)
│       └── AgentTask.ts          → ECS Fargate task definition for Python agents
└── tsconfig.json
```

## Mandatory Tagging Policy (Every Resource)
```typescript
// infra/lib/tagging.ts — called in bin/app.ts for every stack
cdk.Tags.of(stack).add('Project',     'DigitalFTE')
cdk.Tags.of(stack).add('Environment', stage)               // dev | staging | prod
cdk.Tags.of(stack).add('ManagedBy',   'CDK')
cdk.Tags.of(stack).add('CostCenter',  'engineering')
cdk.Tags.of(stack).add('Compliance',  'gdpr-applicable')
```

## CDK Rules (Non-Negotiable)
1. ALWAYS use `SecureLambda` construct — never `new lambda.Function()` directly
2. ALWAYS use `SecureQueue` construct — every SQS queue must have a DLQ
3. ALWAYS set `deletionProtection: true` on Aurora and DynamoDB in staging + prod
4. NEVER hardcode account IDs or regions — use `cdk.Stack.of(this).account/region`
5. ALL S3 buckets must have encryption (minimum: S3_MANAGED), versioning, and block public access
6. ALL IAM policies must follow least-privilege — document any `*` resource usage with a comment
7. NEVER use `cdk deploy` directly in terminal for staging/prod — use GitHub Actions only

## Deploy Commands (Dev Only — Staging/Prod via GitHub Actions)
```bash
cd infra
pnpm cdk diff              # Preview changes — always run before deploy
pnpm cdk deploy --all      # Deploy all stacks to dev account
pnpm cdk deploy ApiStack   # Deploy single stack

# List stacks
pnpm cdk list
```

## Stack Dependencies (Deploy in This Order)
```
NetworkStack → DatabaseStack → StorageStack → AuthStack
                                                   ↓
                              ApiStack → AgentStack → ChannelStack → ObservabilityStack
```

## Environment Configuration
```typescript
// infra/bin/app.ts
const stage = process.env.ENVIRONMENT ?? 'dev'
const env   = { account: process.env.CDK_DEFAULT_ACCOUNT, region: process.env.CDK_DEFAULT_REGION }
// CDK_DEFAULT_ACCOUNT and CDK_DEFAULT_REGION are set by OIDC role assumption in GitHub Actions
```
