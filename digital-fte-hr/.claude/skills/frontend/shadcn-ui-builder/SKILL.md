---
name: shadcn-ui-builder
description: Assembles pixel-perfect UI screens for Digital FTE using shadcn/ui components, Tailwind CSS, and the platform's design system. Use when asked to build dashboards, forms, modals, cards, navigation, tables, kanban boards, or any complete UI layout. Knows Digital FTE's brand colors (navy #1B4F8A, accent #2E86DE), typography, and spacing system.
---

# shadcn/ui Builder Skill — Digital FTE Design System

## Brand Design Tokens

```css
/* Always use these CSS variables — never hardcode hex values in className */
--fte-brand:       #1B4F8A   /* Navy — primary brand, headers, CTAs */
--fte-accent:      #2E86DE   /* Blue — links, hover states, highlights */
--fte-success:     #0D7A3E   /* Green — ATS score 75+, positive status */
--fte-warning:     #B85C00   /* Amber — ATS score 60-74, caution */
--fte-danger:      #C0392B   /* Red — ATS score <60, errors, rejections */

/* Tailwind equivalents to use in className */
Brand navy:   text-[#1B4F8A] / bg-[#1B4F8A]
Accent blue:  text-[#2E86DE] / bg-[#2E86DE]
Success:      text-green-700 / bg-green-50
Warning:      text-amber-700 / bg-amber-50
Danger:       text-red-700   / bg-red-50
```

## ATS Score Ring Component

```tsx
// components/ui/ScoreRing.tsx
interface ScoreRingProps {
  score: number      // 0-100
  size?: 'sm' | 'md' | 'lg'
  showLabel?: boolean
}

const SIZES = { sm: 48, md: 64, lg: 96 }

export function ScoreRing({ score, size = 'md', showLabel = true }: ScoreRingProps) {
  const px = SIZES[size]
  const radius = px / 2 - 6
  const circumference = 2 * Math.PI * radius
  const offset = circumference - (score / 100) * circumference
  const color = score >= 75 ? '#0D7A3E' : score >= 60 ? '#B85C00' : '#C0392B'
  const label = score >= 75 ? 'green' : score >= 60 ? 'yellow' : 'red'

  return (
    <div className="flex flex-col items-center gap-1" title={`ATS Score: ${score}/100 (${label})`}>
      <svg width={px} height={px} viewBox={`0 0 ${px} ${px}`}>
        <circle cx={px/2} cy={px/2} r={radius} fill="none" stroke="#E5E7EB" strokeWidth="5" />
        <circle
          cx={px/2} cy={px/2} r={radius} fill="none"
          stroke={color} strokeWidth="5"
          strokeDasharray={circumference} strokeDashoffset={offset}
          strokeLinecap="round"
          transform={`rotate(-90 ${px/2} ${px/2})`}
          className="transition-all duration-700 ease-out"
        />
        <text x={px/2} y={px/2 + 5} textAnchor="middle" fontSize={size === 'lg' ? 20 : 14} fontWeight="700" fill={color}>
          {score}
        </text>
      </svg>
      {showLabel && <span className="text-xs text-gray-500">ATS Score</span>}
    </div>
  )
}
```

## Application Kanban Board

```tsx
// Status columns with counts and drag capability
const KANBAN_COLUMNS = [
  { id: 'matched',     label: '🎯 Matched',     color: 'border-blue-300 bg-blue-50' },
  { id: 'queued',      label: '📋 In Queue',     color: 'border-purple-300 bg-purple-50' },
  { id: 'applied',     label: '✉️ Applied',      color: 'border-gray-300 bg-gray-50' },
  { id: 'viewed',      label: '👁️ Viewed',       color: 'border-yellow-300 bg-yellow-50' },
  { id: 'shortlisted', label: '⭐ Shortlisted',  color: 'border-green-300 bg-green-50' },
  { id: 'interview',   label: '🗣️ Interview',    color: 'border-teal-300 bg-teal-50' },
  { id: 'offer',       label: '🎉 Offer',        color: 'border-emerald-300 bg-emerald-50' },
  { id: 'rejected',    label: '❌ Rejected',     color: 'border-red-300 bg-red-50' },
]
```

## Standard Page Layout

```tsx
// Every dashboard page follows this exact layout
<div className="min-h-screen bg-gray-50">
  {/* Page header */}
  <div className="bg-white border-b border-gray-200 px-6 py-4">
    <div className="max-w-7xl mx-auto flex items-center justify-between">
      <div>
        <h1 className="text-xl font-semibold text-gray-900">{title}</h1>
        <p className="text-sm text-gray-500 mt-0.5">{subtitle}</p>
      </div>
      <div className="flex items-center gap-3">{/* Action buttons */}</div>
    </div>
  </div>
  {/* Content */}
  <div className="max-w-7xl mx-auto px-6 py-6">
    {children}
  </div>
</div>
```

## Form Pattern (React Hook Form + Zod + shadcn)

```tsx
'use client'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'

const schema = z.object({
  jobTitle:    z.string().min(2, 'Job title must be at least 2 characters'),
  location:    z.string().optional(),
  salaryMin:   z.number().min(0).optional(),
})
type FormValues = z.infer<typeof schema>

export function JobPreferenceForm({ onSubmit }: { onSubmit: (v: FormValues) => Promise<void> }) {
  const form = useForm<FormValues>({ resolver: zodResolver(schema) })

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField control={form.control} name="jobTitle" render={({ field }) => (
          <FormItem>
            <FormLabel>Target Job Title</FormLabel>
            <FormControl><Input placeholder="e.g. Senior Product Manager" {...field} /></FormControl>
            <FormMessage />
          </FormItem>
        )} />
        <Button type="submit" disabled={form.formState.isSubmitting}>
          {form.formState.isSubmitting ? 'Saving...' : 'Save Preferences'}
        </Button>
      </form>
    </Form>
  )
}
```

## Loading Skeleton Pattern (Always Pair With Pages)

```tsx
// Every page.tsx must have a loading.tsx skeleton sibling
export function JobCardSkeleton() {
  return (
    <div className="rounded-lg border border-gray-200 bg-white p-5 animate-pulse">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 space-y-2">
          <div className="h-4 bg-gray-200 rounded w-3/4" />
          <div className="h-3 bg-gray-200 rounded w-1/2" />
          <div className="h-3 bg-gray-200 rounded w-1/3" />
        </div>
        <div className="h-16 w-16 bg-gray-200 rounded-full flex-shrink-0" />
      </div>
      <div className="flex gap-2 mt-4">
        <div className="h-8 bg-gray-200 rounded w-24" />
        <div className="h-8 bg-gray-200 rounded w-20" />
      </div>
    </div>
  )
}
```

## Notification Toast Pattern

```tsx
// Use sonner (already installed) — never alert()
import { toast } from 'sonner'

toast.success('Application approved and queued!')
toast.error('Failed to approve. Please try again.')
toast.loading('Submitting application...')
toast.promise(approveApplication(id), {
  loading: 'Approving application...',
  success: 'Application submitted successfully!',
  error: (e) => `Failed: ${e.message}`,
})
```

## Rules

- Always use `gap-*` not `space-x-*` or `space-y-*` inside flex/grid containers
- Card border radius: always `rounded-lg` (not rounded-md or rounded-xl)
- All modals use shadcn `<Dialog>` — never custom modal implementations
- All tooltips use shadcn `<Tooltip>` with `<TooltipProvider>` at layout level
- Button sizes: `size="sm"` in tables/cards, `size="default"` in forms/CTAs
- Never use `p-*` directly on a Card — always use `CardContent` with `pt-0`
