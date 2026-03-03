---
name: cdk-stack
description: Generates AWS CDK v2 TypeScript infrastructure stacks for Digital FTE. Use when provisioning new AWS resources — Lambda functions, API Gateway, SQS queues, DynamoDB tables, Aurora Serverless, S3 buckets, CloudFront, Cognito, ECS tasks, EventBridge rules, or IAM roles. Follows Digital FTE's least-privilege IAM, multi-account strategy, and tagging standards.
---

# AWS CDK Stack Skill — Digital FTE Infrastructure

## Stack Organization

```
infra/
├── bin/app.ts                    ← CDK app entry point
├── lib/
│   ├── stacks/
│   │   ├── NetworkStack.ts       ← VPC, subnets, security groups
│   │   ├── DatabaseStack.ts      ← Aurora Serverless + ElastiCache Redis
│   │   ├── StorageStack.ts       ← S3 buckets, OpenSearch
│   │   ├── AuthStack.ts          ← Cognito User Pool + Identity Pool
│   │   ├── ApiStack.ts           ← API Gateway + Lambda functions
│   │   ├── AgentStack.ts         ← ECS tasks for LangGraph agents
│   │   ├── ChannelStack.ts       ← SQS queues, EventBridge rules
│   │   └── ObservabilityStack.ts ← CloudWatch, X-Ray, alarms
│   └── constructs/
│       ├── SecureLambda.ts       ← Lambda with mandatory security defaults
│       ├── ApiRoute.ts           ← API Gateway route + Lambda integration
│       └── AgentTask.ts          ← ECS Fargate task definition for agents
```

## CDK App Entry Point

```typescript
// infra/bin/app.ts
import * as cdk from 'aws-cdk-lib'
import { NetworkStack }       from '../lib/stacks/NetworkStack'
import { DatabaseStack }      from '../lib/stacks/DatabaseStack'
import { ApiStack }           from '../lib/stacks/ApiStack'
import { AgentStack }         from '../lib/stacks/AgentStack'
import { ChannelStack }       from '../lib/stacks/ChannelStack'

const app = new cdk.App()
const env = { account: process.env.CDK_DEFAULT_ACCOUNT, region: process.env.CDK_DEFAULT_REGION }

// Standard tags applied to ALL resources
const tags = {
  Project:     'DigitalFTE',
  Environment: process.env.ENVIRONMENT ?? 'dev',
  ManagedBy:   'CDK',
  CostCenter:  'engineering',
}

const network = new NetworkStack(app, `DigitalFTE-Network-${env.stage}`, { env, tags })
const db      = new DatabaseStack(app, `DigitalFTE-DB-${env.stage}`,      { env, tags, vpc: network.vpc })
const api     = new ApiStack(app, `DigitalFTE-API-${env.stage}`,          { env, tags, vpc: network.vpc, db })
```

## SecureLambda Construct (Always Use This)

```typescript
// infra/lib/constructs/SecureLambda.ts
import * as cdk from 'aws-cdk-lib'
import * as lambda from 'aws-cdk-lib/aws-lambda'
import * as iam from 'aws-cdk-lib/aws-iam'
import * as logs from 'aws-cdk-lib/aws-logs'
import { Construct } from 'constructs'

interface SecureLambdaProps {
  functionName: string
  handler:      string         // e.g. 'src/handlers/jobs/search.handler'
  bundleDir:    string         // Path to compiled JS
  environment?: Record<string, string>
  memoryMB?:   number          // Default: 512
  timeoutSec?: number          // Default: 30
  reservedConcurrent?: number  // Prevent runaway costs
}

export class SecureLambda extends Construct {
  public readonly fn: lambda.Function

  constructor(scope: Construct, id: string, props: SecureLambdaProps) {
    super(scope, id)

    const role = new iam.Role(this, 'Role', {
      assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com'),
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName('service-role/AWSLambdaVPCAccessExecutionRole'),
      ],
    })

    // X-Ray tracing policy
    role.addToPolicy(new iam.PolicyStatement({
      actions: ['xray:PutTraceSegments', 'xray:PutTelemetryRecords'],
      resources: ['*'],
    }))

    // CloudWatch Logs (scoped to this function only)
    const logGroup = new logs.LogGroup(this, 'Logs', {
      logGroupName:  `/digital-fte/lambda/${props.functionName}`,
      retention:     logs.RetentionDays.ONE_MONTH,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    })

    this.fn = new lambda.Function(this, 'Fn', {
      functionName: props.functionName,
      runtime:      lambda.Runtime.NODEJS_20_X,
      handler:      props.handler,
      code:         lambda.Code.fromAsset(props.bundleDir),
      role,
      memorySize:   props.memoryMB ?? 512,
      timeout:      cdk.Duration.seconds(props.timeoutSec ?? 30),
      reservedConcurrentExecutions: props.reservedConcurrent ?? 100,
      tracing:      lambda.Tracing.ACTIVE,
      logGroup,
      environment: {
        NODE_OPTIONS:  '--enable-source-maps',
        ENVIRONMENT:   process.env.ENVIRONMENT ?? 'dev',
        AWS_ACCOUNT_ID: cdk.Stack.of(this).account,
        ...props.environment,
      },
      // Security hardening
      layers: [],
      allowPublicSubnet: false,   // Always in private subnet
    })

    // Apply cost tags
    cdk.Tags.of(this.fn).add('Resource', 'Lambda')
  }
}
```

## SQS Queue Pattern (With DLQ)

```typescript
// Always create with Dead Letter Queue
import * as sqs from 'aws-cdk-lib/aws-sqs'

const dlq = new sqs.Queue(this, 'JobSearchDLQ', {
  queueName:         `digital-fte-job-search-dlq-${stage}`,
  retentionPeriod:   cdk.Duration.days(14),
  encryption:        sqs.QueueEncryption.SQS_MANAGED,
})

const queue = new sqs.Queue(this, 'JobSearchQueue', {
  queueName:          `digital-fte-job-search-${stage}`,
  visibilityTimeout:  cdk.Duration.seconds(300),    // Must be > Lambda timeout
  encryption:         sqs.QueueEncryption.SQS_MANAGED,
  deadLetterQueue: {
    queue:           dlq,
    maxReceiveCount: 3,   // Retry 3x before DLQ
  },
})
```

## Aurora Serverless v2 Pattern

```typescript
import * as rds from 'aws-cdk-lib/aws-rds'
import * as ec2 from 'aws-cdk-lib/aws-ec2'

const db = new rds.DatabaseCluster(this, 'AuroraCluster', {
  engine: rds.DatabaseClusterEngine.auroraPostgres({
    version: rds.AuroraPostgresEngineVersion.VER_15_4
  }),
  serverlessV2MinCapacity: 0.5,    // ~$0.06/hr minimum
  serverlessV2MaxCapacity: 8,      // Max 8 ACUs for cost control
  writer: rds.ClusterInstance.serverlessV2('Writer'),
  readers: [rds.ClusterInstance.serverlessV2('Reader', { scaleWithWriter: true })],
  vpc,
  vpcSubnets: { subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS },
  storageEncrypted: true,
  backup: { retention: cdk.Duration.days(7) },
  deletionProtection: true,
  credentials: rds.Credentials.fromGeneratedSecret('fte_admin', {
    secretName: `/digital-fte/${stage}/db/master-credentials`,
  }),
})
```

## Mandatory Tagging Policy

```typescript
// infra/lib/tagging.ts — apply to every stack
export function applyMandatoryTags(stack: cdk.Stack, stage: string) {
  const tags: Record<string, string> = {
    Project:     'DigitalFTE',
    Environment: stage,
    ManagedBy:   'CDK',
    CostCenter:  'engineering',
    Owner:       'platform-team',
    Compliance:  'gdpr-applicable',
  }
  Object.entries(tags).forEach(([k, v]) => cdk.Tags.of(stack).add(k, v))
}
```

## Rules

- ALWAYS create SQS queues with a DLQ — never bare queues
- ALWAYS use `SecureLambda` construct — never `new lambda.Function()` directly
- ALWAYS set `deletionProtection: true` on RDS and DynamoDB in prod
- NEVER hardcode account IDs or region strings — use `cdk.Stack.of(this).account/region`
- ALWAYS encrypt S3 buckets with `BucketEncryption.S3_MANAGED` minimum
- ALL IAM roles must follow least-privilege — no `*` resources unless unavoidable, and comment why
- Deploy commands: `pnpm cdk diff`, `pnpm cdk deploy --require-approval broadening`

## OpenSearch Serverless (Semantic Job Search — M-3 Fix)

```typescript
import * as opensearchserverless from 'aws-cdk-lib/aws-opensearchserverless'

// Collection for job + resume vector search
const collection = new opensearchserverless.CfnCollection(this, 'VectorSearch', {
  name:  `digital-fte-vectors-${stage}`,
  type:  'VECTORSEARCH',
  description: 'Job listing + resume embedding semantic search',
})

// Encryption policy (required)
new opensearchserverless.CfnSecurityPolicy(this, 'EncryptionPolicy', {
  name:   `digital-fte-enc-${stage}`,
  type:   'encryption',
  policy: JSON.stringify({
    Rules:    [{ ResourceType: 'collection', Resource: [`collection/digital-fte-vectors-${stage}`] }],
    AWSOwnedKey: true,
  }),
})

// Network policy — VPC access only (no public endpoint)
new opensearchserverless.CfnSecurityPolicy(this, 'NetworkPolicy', {
  name:   `digital-fte-net-${stage}`,
  type:   'network',
  policy: JSON.stringify([{
    Rules:       [{ ResourceType: 'collection', Resource: [`collection/digital-fte-vectors-${stage}`] },
                  { ResourceType: 'dashboard',  Resource: [`collection/digital-fte-vectors-${stage}`] }],
    AllowFromPublic: false,
    SourceVPCEs: [vpcEndpointId],   // Pass VPC endpoint ID from NetworkStack
  }]),
})

// Data access policy — grant Lambda execution roles read/write
new opensearchserverless.CfnAccessPolicy(this, 'DataAccessPolicy', {
  name:   `digital-fte-data-${stage}`,
  type:   'data',
  policy: JSON.stringify([{
    Rules: [
      { ResourceType: 'collection', Resource: [`collection/digital-fte-vectors-${stage}`],
        Permission: ['aoss:CreateCollectionItems', 'aoss:DeleteCollectionItems', 'aoss:UpdateCollectionItems', 'aoss:DescribeCollectionItems'] },
      { ResourceType: 'index',      Resource: [`index/digital-fte-vectors-${stage}/*`],
        Permission: ['aoss:CreateIndex', 'aoss:DeleteIndex', 'aoss:UpdateIndex', 'aoss:DescribeIndex', 'aoss:ReadDocument', 'aoss:WriteDocument'] },
    ],
    Principal: [
      jobSearchAgentRole.roleArn,     // Job search agent reads + writes job embeddings
      resumeBuilderAgentRole.roleArn, // Resume builder writes resume embeddings
      apiLambdaRole.roleArn,          // API reads for search results
    ],
  }]),
})

// Output collection endpoint for use by agents
new cdk.CfnOutput(this, 'OpenSearchEndpoint', {
  value:      collection.attrCollectionEndpoint,
  exportName: `DigitalFTE-OpenSearch-Endpoint-${stage}`,
})
```

## Index Structure (Created by Job Search Agent at First Run)
```python
# services/job-search-agent/search/index_manager.py
JOB_INDEX_MAPPING = {
  "settings": {
    "index.knn": True
  },
  "mappings": {
    "properties": {
      "id":          { "type": "keyword" },
      "title":       { "type": "text", "analyzer": "english" },
      "description": { "type": "text", "analyzer": "english" },
      "embedding":   { "type": "knn_vector", "dimension": 1536,
                       "method": { "name": "hnsw", "space_type": "cosine",
                                   "engine": "faiss" } },
      "platform":    { "type": "keyword" },
      "postedAt":    { "type": "date" },
      "isGhost":     { "type": "boolean" }
    }
  }
}
COSINE_MATCH_THRESHOLD = 0.72  # Minimum similarity to surface as a candidate match
```
