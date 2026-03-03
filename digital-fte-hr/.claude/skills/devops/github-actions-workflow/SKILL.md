---
name: github-actions-workflow
description: Creates GitHub Actions CI/CD pipeline workflows for Digital FTE monorepo. Use when setting up or modifying deployment pipelines, PR checks, test automation, security scanning, CDK deployment, or release workflows. Knows Digital FTE's monorepo structure, pnpm workspaces, and AWS deployment targets.
---

# GitHub Actions Workflow Skill — Digital FTE

## PR Validation Workflow (Runs on Every PR)

```yaml
# .github/workflows/pr-check.yml
name: PR Checks

on:
  pull_request:
    branches: [main, develop]
  push:
    branches: [develop]

concurrency:
  group: ${{ github.workflow }}-${{ github.ref }}
  cancel-in-progress: true   # Cancel stale runs on new push

jobs:
  # ── 1. Detect what changed ──────────────────────────────────────────────────
  changes:
    runs-on: ubuntu-latest
    outputs:
      frontend:  ${{ steps.filter.outputs.frontend }}
      backend:   ${{ steps.filter.outputs.backend }}
      agents:    ${{ steps.filter.outputs.agents }}
      infra:     ${{ steps.filter.outputs.infra }}
    steps:
      - uses: actions/checkout@v4
      - uses: dorny/paths-filter@v3
        id: filter
        with:
          filters: |
            frontend:  ['apps/web/**', 'apps/mobile/**', 'packages/shared/**']
            backend:   ['apps/api/**', 'packages/**']
            agents:    ['services/**']
            infra:     ['infra/**']

  # ── 2. Type check (all workspaces in parallel) ────────────────────────────
  typecheck:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
        with: { version: '9' }
      - uses: actions/setup-node@v4
        with: { node-version: '20', cache: 'pnpm' }
      - run: pnpm install --frozen-lockfile
      - run: pnpm typecheck   # Runs tsc across all workspaces

  # ── 3. Lint ────────────────────────────────────────────────────────────────
  lint:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
        with: { version: '9' }
      - uses: actions/setup-node@v4
        with: { node-version: '20', cache: 'pnpm' }
      - run: pnpm install --frozen-lockfile
      - run: pnpm lint

  # ── 4. Frontend tests ──────────────────────────────────────────────────────
  test-frontend:
    needs: changes
    if: needs.changes.outputs.frontend == 'true'
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
        with: { version: '9' }
      - uses: actions/setup-node@v4
        with: { node-version: '20', cache: 'pnpm' }
      - run: pnpm install --frozen-lockfile
      - run: pnpm --filter @digital-fte/web test --coverage
      - uses: codecov/codecov-action@v4
        with: { flags: frontend }

  # ── 5. Backend tests ───────────────────────────────────────────────────────
  test-backend:
    needs: changes
    if: needs.changes.outputs.backend == 'true'
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgres:15
        env:
          POSTGRES_USER: fte_test
          POSTGRES_PASSWORD: test_password
          POSTGRES_DB: digital_fte_test
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
        ports: ['5432:5432']
      redis:
        image: redis:7-alpine
        ports: ['6379:6379']
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
        with: { version: '9' }
      - uses: actions/setup-node@v4
        with: { node-version: '20', cache: 'pnpm' }
      - run: pnpm install --frozen-lockfile
      - run: pnpm --filter @digital-fte/api test --coverage
        env:
          DATABASE_URL: postgresql://fte_test:test_password@localhost:5432/digital_fte_test
          REDIS_URL: redis://localhost:6379
          NODE_ENV: test

  # ── 6. Agent tests (Python) ────────────────────────────────────────────────
  test-agents:
    needs: changes
    if: needs.changes.outputs.agents == 'true'
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-python@v5
        with: { python-version: '3.12' }
      - uses: astral-sh/setup-uv@v3
      - run: |
          cd services/job-search-agent && uv run pytest tests/ --cov=. --cov-report=xml -q
          cd ../resume-builder-agent   && uv run pytest tests/ --cov=. --cov-report=xml -q
          cd ../auto-apply-agent       && uv run pytest tests/ --cov=. --cov-report=xml -q

  # ── 7. Security scan ───────────────────────────────────────────────────────
  security:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
        with: { version: '9' }
      - run: pnpm install --frozen-lockfile
      - run: pnpm audit --audit-level=high     # Fail on high/critical CVEs
      - uses: snyk/actions/node@master
        env: { SNYK_TOKEN: ${{ secrets.SNYK_TOKEN }} }
        with: { args: '--severity-threshold=high' }
      - uses: trufflesecurity/trufflehog@main   # Secret scanning
        with:
          path: ./
          base: ${{ github.event.repository.default_branch }}
          head: HEAD
```

## Production Deployment Workflow

```yaml
# .github/workflows/deploy-prod.yml
name: Deploy Production

on:
  push:
    branches: [main]
  workflow_dispatch:
    inputs:
      service:
        description: 'Service to deploy (all | api | agents | infra | frontend)'
        required: true
        default: 'all'

jobs:
  deploy-infra:
    if: github.event.inputs.service == 'all' || github.event.inputs.service == 'infra'
    runs-on: ubuntu-latest
    environment: production   # Requires manual approval in GitHub Environments
    permissions:
      id-token: write
      contents: read
    steps:
      - uses: actions/checkout@v4
      - uses: aws-actions/configure-aws-credentials@v4
        with:
          role-to-assume:    ${{ secrets.AWS_CDK_DEPLOY_ROLE_ARN }}
          aws-region:        us-east-1
          role-session-name: github-actions-cdk
      - uses: pnpm/action-setup@v4
        with: { version: '9' }
      - uses: actions/setup-node@v4
        with: { node-version: '20', cache: 'pnpm' }
      - run: pnpm install --frozen-lockfile
      - run: pnpm --filter @digital-fte/infra cdk diff     # Show changes
      - run: pnpm --filter @digital-fte/infra cdk deploy --all --require-approval never

  deploy-frontend:
    needs: deploy-infra
    if: always() && (github.event.inputs.service == 'all' || github.event.inputs.service == 'frontend')
    runs-on: ubuntu-latest
    permissions:
      id-token: write
      contents: read
    steps:
      - uses: actions/checkout@v4
      - uses: aws-actions/configure-aws-credentials@v4
        with:
          role-to-assume: ${{ secrets.AWS_DEPLOY_ROLE_ARN }}
          aws-region:     us-east-1
      - uses: pnpm/action-setup@v4
        with: { version: '9' }
      - uses: actions/setup-node@v4
        with: { node-version: '20', cache: 'pnpm' }
      - run: pnpm install --frozen-lockfile
      - run: pnpm --filter @digital-fte/web build
        env:
          NEXT_PUBLIC_API_URL:    ${{ secrets.PROD_API_URL }}
          NEXT_PUBLIC_WS_URL:     ${{ secrets.PROD_WS_URL }}
          NEXT_PUBLIC_COGNITO_ID: ${{ secrets.PROD_COGNITO_CLIENT_ID }}
      - run: pnpm --filter @digital-fte/web deploy:prod

  notify-deploy:
    needs: [deploy-infra, deploy-frontend]
    if: always()
    runs-on: ubuntu-latest
    steps:
      - name: Notify Slack
        uses: slackapi/slack-github-action@v1
        with:
          payload: |
            {
              "text": "${{ needs.deploy-infra.result == 'success' && needs.deploy-frontend.result == 'success' && '✅ Production deploy succeeded' || '❌ Production deploy FAILED' }}",
              "channel": "#deployments"
            }
        env:
          SLACK_WEBHOOK_URL: ${{ secrets.SLACK_WEBHOOK_URL }}
```

## Required GitHub Secrets

```
# AWS
AWS_CDK_DEPLOY_ROLE_ARN       ← IAM role for CDK deployments (OIDC)
AWS_DEPLOY_ROLE_ARN           ← IAM role for app deployments

# App Config (Prod)
PROD_API_URL                  ← https://api.digitalfte.com
PROD_WS_URL                   ← wss://ws.digitalfte.com
PROD_COGNITO_CLIENT_ID        ← Cognito App Client ID

# Monitoring
SNYK_TOKEN                    ← Snyk security scanning
SLACK_WEBHOOK_URL             ← Deployment notifications
CODECOV_TOKEN                 ← Coverage reporting
```

## Rules

- ALWAYS use OIDC role assumption (`id-token: write`) — never store AWS keys as secrets
- ALWAYS use `concurrency` groups to cancel stale workflow runs
- ALWAYS gate production deploys with `environment: production` for manual approval
- ALWAYS use `pnpm install --frozen-lockfile` — never `pnpm install` in CI
- ALWAYS run security scan (audit + secret scanning) on every PR
- NEVER use `continue-on-error: true` in production deploy jobs
- Use `dorny/paths-filter` to skip jobs when nothing in a workspace changed — saves CI minutes
