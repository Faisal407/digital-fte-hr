---
name: nextjs-component
description: Generates production-ready Next.js 14 App Router components, pages, layouts, and server actions for the Digital FTE web app. Use when building or modifying any file inside apps/web/ — including page.tsx, layout.tsx, loading.tsx, error.tsx, route handlers, and Server/Client components. Automatically applies Digital FTE design system, TanStack Query for data fetching, Zustand for state, and shadcn/ui primitives.
---

# Next.js 14 App Router Component Skill

You are an expert Next.js 14 developer building the Digital FTE HR platform frontend.
Always use App Router patterns — never Pages Router.

## Core Principles

1. **Server Components by default** — only add `'use client'` when the component needs event handlers, hooks, browser APIs, or WebSocket connections
2. **Co-locate data fetching** — fetch data directly in Server Components using async/await, never in useEffect
3. **Type everything** — every prop, every function, every API response must be TypeScript typed
4. **Import from the right place** — shadcn/ui from `@/components/ui/*`, icons from `lucide-react`

## File Naming Convention

```
app/(dashboard)/jobs/page.tsx          ← Page (Server Component)
app/(dashboard)/jobs/JobSearchBar.tsx  ← Co-located component
components/jobs/JobMatchCard.tsx       ← Shared component
components/ui/ScoreRing.tsx            ← Custom UI primitive
lib/api/jobs.ts                        ← API client function
```

## Server Component Pattern (Default)

```tsx
// app/(dashboard)/jobs/page.tsx
import { Suspense } from 'react'
import { JobResultsList } from './JobResultsList'
import { JobResultsSkeleton } from './JobResultsSkeleton'
import { fetchJobs } from '@/lib/api/jobs'

interface JobsPageProps {
  searchParams: { q?: string; location?: string; page?: string }
}

export default async function JobsPage({ searchParams }: JobsPageProps) {
  // Data fetched server-side — no loading state needed at page level
  const jobs = await fetchJobs({
    query: searchParams.q ?? '',
    location: searchParams.location,
    page: Number(searchParams.page ?? 1),
  })

  return (
    <div className="flex flex-col gap-6 p-6">
      <h1 className="text-2xl font-bold text-gray-900">Job Matches</h1>
      <Suspense fallback={<JobResultsSkeleton />}>
        <JobResultsList initialData={jobs} searchParams={searchParams} />
      </Suspense>
    </div>
  )
}
```

## Client Component Pattern (When Interactivity Needed)

```tsx
'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api-client'
import { Button } from '@/components/ui/button'
import { ScoreRing } from '@/components/ui/ScoreRing'
import type { JobMatch } from '@digital-fte/shared/types'

interface JobMatchCardProps {
  job: JobMatch
  onSave?: (jobId: string) => void
  onApply?: (jobId: string) => void
}

export function JobMatchCard({ job, onSave, onApply }: JobMatchCardProps) {
  const [isSaving, setIsSaving] = useState(false)

  const handleSave = async () => {
    setIsSaving(true)
    try {
      await onSave?.(job.id)
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-gray-900 truncate">{job.title}</h3>
          <p className="text-sm text-gray-600">{job.company.name} · {job.location}</p>
          {job.salary && (
            <p className="text-sm font-medium text-green-700 mt-1">
              {job.salary.currency} {job.salary.min.toLocaleString()}–{job.salary.max.toLocaleString()}/{job.salary.period}
            </p>
          )}
        </div>
        <ScoreRing score={job.matchScore} size="md" />
      </div>
      <div className="flex gap-2 mt-4">
        <Button variant="default" size="sm" onClick={() => onApply?.(job.id)}>
          Quick Apply
        </Button>
        <Button variant="outline" size="sm" onClick={handleSave} disabled={isSaving}>
          {isSaving ? 'Saving...' : 'Save'}
        </Button>
      </div>
    </div>
  )
}
```

## ATS Score Color Utility (Always Use This)

```tsx
// lib/utils/ats.ts
export function getATSScoreColor(score: number): string {
  if (score >= 75) return 'text-green-600'    // GREEN — good to go
  if (score >= 60) return 'text-yellow-600'   // YELLOW — needs work
  return 'text-red-600'                        // RED — block export
}

export function getATSScoreBg(score: number): string {
  if (score >= 75) return 'bg-green-50 border-green-200'
  if (score >= 60) return 'bg-yellow-50 border-yellow-200'
  return 'bg-red-50 border-red-200'
}
```

## TanStack Query Pattern (Client-Side Data)

```tsx
'use client'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api-client'

// Read data
const { data, isLoading, error } = useQuery({
  queryKey: ['applications', userId],
  queryFn: () => api.applications.list(userId),
  staleTime: 2 * 60 * 1000,   // 2 min cache
  refetchOnWindowFocus: true,
})

// Mutate data
const qc = useQueryClient()
const approveMutation = useMutation({
  mutationFn: (reviewId: string) => api.applications.approve(reviewId),
  onSuccess: () => {
    qc.invalidateQueries({ queryKey: ['applications'] })
    qc.invalidateQueries({ queryKey: ['dashboard'] })
  },
  onError: (err) => toast.error(`Failed: ${err.message}`),
})
```

## WebSocket Hook (Real-Time Dashboard Updates)

```tsx
'use client'
import { useEffect, useCallback } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import type { WSEvent } from '@digital-fte/shared/types'

export function useRealtimeUpdates(userId: string) {
  const qc = useQueryClient()

  const handleEvent = useCallback((event: WSEvent) => {
    switch (event.type) {
      case 'APPLICATION_STATUS_CHANGED':
        qc.invalidateQueries({ queryKey: ['applications'] })
        break
      case 'RESUME_OPTIMIZATION_COMPLETE':
        qc.invalidateQueries({ queryKey: ['resume', event.payload.resumeId] })
        break
      case 'JOB_MATCH_FOUND':
        qc.invalidateQueries({ queryKey: ['jobs'] })
        break
    }
  }, [qc])

  useEffect(() => {
    const ws = new WebSocket(`${process.env.NEXT_PUBLIC_WS_URL}?userId=${userId}`)
    ws.onmessage = (e) => handleEvent(JSON.parse(e.data))
    return () => ws.close()
  }, [userId, handleEvent])
}
```

## Mandatory Rules

- NEVER use `any` type — use `unknown` with type guards if needed
- NEVER use `useEffect` for data fetching — use TanStack Query or Server Components
- NEVER use `<a>` tags — always use Next.js `<Link>`
- NEVER use `<img>` — always use `next/image` with explicit width/height
- ALWAYS export named functions (not default arrow functions) for Server Components
- ALWAYS add `loading.tsx` and `error.tsx` siblings to any `page.tsx` you create
- Dark mode is NOT supported in Phase 1 — never add `dark:` Tailwind classes
