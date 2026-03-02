# Web App — Local Context
# This CLAUDE.md is for: apps/web/
# Next.js 14 App Router frontend

## What This App Is
The primary web interface for Digital FTE. Server-side rendered Next.js 14 app.
Handles: onboarding, resume builder UI, job search results, application review gate,
analytics dashboard, notification settings, and plan upgrade flows.

## Tech Stack
- **Framework**: Next.js 14 App Router (NOT Pages Router)
- **Styling**: Tailwind CSS + shadcn/ui components (pre-installed)
- **State**: Zustand for global UI state, TanStack Query for server state
- **Real-time**: Native WebSocket hook connecting to AWS API Gateway WS endpoint
- **Charts**: Recharts (already installed — use this, not Chart.js or others)
- **Auth**: NextAuth.js v5 + Cognito provider
- **Forms**: React Hook Form + Zod resolvers

## App Router Structure
```
app/
├── (auth)/
│   ├── login/page.tsx
│   └── register/page.tsx
├── (dashboard)/
│   ├── layout.tsx          → Dashboard shell with sidebar
│   ├── page.tsx            → Overview / command center
│   ├── jobs/page.tsx       → Job search results
│   ├── resume/
│   │   ├── page.tsx        → Resume list
│   │   └── [id]/page.tsx   → Resume editor + ATS score
│   ├── apply/
│   │   ├── page.tsx        → Application review queue
│   │   └── [id]/page.tsx   → Single application review
│   ├── tracker/page.tsx    → Application status kanban
│   ├── analytics/
│   │   ├── weekly/page.tsx
│   │   └── monthly/page.tsx
│   └── settings/
│       ├── profile/page.tsx
│       ├── notifications/page.tsx
│       └── channels/page.tsx   → WhatsApp/Telegram connect
├── api/                    → Next.js route handlers (thin — proxy to main API)
└── layout.tsx              → Root layout + providers
```

## Component Conventions
```typescript
// Use Server Components by default — only add 'use client' when truly needed
// 'use client' is needed for: event handlers, hooks, WebSocket, browser APIs

// Component naming: PascalCase files, named exports
// apps/web/components/jobs/JobMatchCard.tsx
export function JobMatchCard({ job, onSave, onApply }: JobMatchCardProps) {}

// Data fetching in Server Components (not useEffect)
async function JobSearchPage({ searchParams }) {
  const jobs = await fetchJobs(searchParams);  // Server-side fetch
  return <JobResultsList jobs={jobs} />;
}
```

## Key UI Features & Constraints
- **Job Match Score**: Displayed as circular progress ring (custom component at components/ui/ScoreRing.tsx)
- **Application Review Gate**: Approve/Edit/Skip must be unmissable — full-screen overlay on mobile
- **ATS Score**: Color coded: <60 RED, 60-74 YELLOW, 75+ GREEN — use `getATSScoreColor(score)` utility
- **Resume Diff View**: Before/After comparison — use `react-diff-viewer-continued` package
- **Voice Input**: Browser `MediaRecorder` API — test on Chrome/Safari/Firefox before PR
- **Dark Mode**: NOT supported in Phase 1 — `@apply dark:` classes cause issues with email rendering

## API Calls Pattern
```typescript
// Use TanStack Query for all data fetching
import { useQuery, useMutation } from '@tanstack/react-query';
import { api } from '@/lib/api-client';  // Typed API client

const { data: jobs, isLoading } = useQuery({
  queryKey: ['jobs', searchParams],
  queryFn: () => api.jobs.search(searchParams),
  staleTime: 5 * 60 * 1000,  // 5 min cache
});

const approveMutation = useMutation({
  mutationFn: (reviewId: string) => api.applications.approve(reviewId),
  onSuccess: () => queryClient.invalidateQueries({ queryKey: ['applications'] }),
});
```

## Run Locally
```bash
cd apps/web
pnpm dev           # http://localhost:3000
pnpm build         # Production build (check for errors before PR)
pnpm lint          # Biome linter
```
