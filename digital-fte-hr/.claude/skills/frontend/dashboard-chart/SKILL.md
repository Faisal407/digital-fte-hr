---
name: dashboard-chart
description: Builds analytics charts and KPI widgets for the Digital FTE progress dashboard using Recharts. Use when building weekly reports, monthly reports, application pipeline funnels, resume score trends, platform performance charts, or any data visualization. Knows all Digital FTE KPI definitions and benchmark data structures.
---

# Dashboard Chart Skill — Digital FTE Analytics

## Chart Library: Recharts (DO NOT use Chart.js or D3 directly)

All charts use Recharts. Import from 'recharts' only. All chart components are Client Components — add `'use client'` at the top.

## KPI Card (Animated Counter)

```tsx
'use client'
import { useEffect, useRef } from 'react'
import { TrendingUp, TrendingDown, Minus } from 'lucide-react'

interface KPICardProps {
  label: string
  value: number
  unit?: string        // '%', 'pts', '' etc.
  trend?: number       // delta vs last period (positive = up, negative = down)
  benchmark?: number   // industry average for comparison
  color?: 'default' | 'success' | 'warning' | 'danger'
}

const COLOR_MAP = {
  default: 'text-[#1B4F8A] bg-blue-50',
  success: 'text-green-700 bg-green-50',
  warning: 'text-amber-700 bg-amber-50',
  danger:  'text-red-700 bg-red-50',
}

export function KPICard({ label, value, unit = '', trend, benchmark, color = 'default' }: KPICardProps) {
  const TrendIcon = trend > 0 ? TrendingUp : trend < 0 ? TrendingDown : Minus
  const trendColor = trend > 0 ? 'text-green-600' : trend < 0 ? 'text-red-600' : 'text-gray-400'

  return (
    <div className={`rounded-xl border p-5 ${COLOR_MAP[color]}`}>
      <p className="text-sm font-medium text-gray-600 mb-1">{label}</p>
      <div className="flex items-end gap-2">
        <span className="text-3xl font-bold">{value.toLocaleString()}{unit}</span>
        {trend !== undefined && (
          <div className={`flex items-center gap-1 text-sm font-medium mb-0.5 ${trendColor}`}>
            <TrendIcon size={16} />
            {Math.abs(trend)}{unit} vs last week
          </div>
        )}
      </div>
      {benchmark !== undefined && (
        <p className="text-xs text-gray-500 mt-2">
          Market avg: {benchmark}{unit} — you're {value > benchmark ? 'above' : 'below'} average
        </p>
      )}
    </div>
  )
}
```

## Application Volume Line Chart

```tsx
'use client'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'

interface DailyApplicationData {
  date: string        // 'Mon', 'Tue' etc.
  applied: number
  responses: number
  interviews: number
}

export function ApplicationVolumeChart({ data }: { data: DailyApplicationData[] }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5">
      <h3 className="text-sm font-semibold text-gray-700 mb-4">Applications This Week</h3>
      <ResponsiveContainer width="100%" height={220}>
        <LineChart data={data} margin={{ top: 5, right: 10, bottom: 5, left: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" />
          <XAxis dataKey="date" tick={{ fontSize: 12, fill: '#6B7280' }} />
          <YAxis tick={{ fontSize: 12, fill: '#6B7280' }} />
          <Tooltip
            contentStyle={{ borderRadius: '8px', border: '1px solid #E5E7EB', fontSize: 12 }}
          />
          <Legend wrapperStyle={{ fontSize: 12 }} />
          <Line type="monotone" dataKey="applied"    stroke="#1B4F8A" strokeWidth={2} dot={false} name="Applied" />
          <Line type="monotone" dataKey="responses"  stroke="#0D7A3E" strokeWidth={2} dot={false} name="Responses" />
          <Line type="monotone" dataKey="interviews" stroke="#2E86DE" strokeWidth={2} dot={false} name="Interviews" />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
```

## Platform Performance Bar Chart

```tsx
'use client'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Cell, ResponsiveContainer } from 'recharts'

interface PlatformData {
  platform: string    // 'LinkedIn', 'Indeed', 'NaukriGulf' etc.
  applied: number
  responseRate: number  // 0-100 %
}

export function PlatformPerformanceChart({ data }: { data: PlatformData[] }) {
  // Color bars by response rate
  const getBarColor = (rate: number) => rate >= 10 ? '#0D7A3E' : rate >= 5 ? '#B85C00' : '#C0392B'

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5">
      <h3 className="text-sm font-semibold text-gray-700 mb-4">Response Rate by Platform (%)</h3>
      <ResponsiveContainer width="100%" height={200}>
        <BarChart data={data} layout="vertical" margin={{ left: 70, right: 20 }}>
          <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#F3F4F6" />
          <XAxis type="number" domain={[0, 25]} tick={{ fontSize: 11 }} unit="%" />
          <YAxis dataKey="platform" type="category" tick={{ fontSize: 12, fill: '#374151' }} width={65} />
          <Tooltip formatter={(v) => [`${v}%`, 'Response Rate']} />
          <Bar dataKey="responseRate" radius={[0, 4, 4, 0]}>
            {data.map((entry, index) => (
              <Cell key={index} fill={getBarColor(entry.responseRate)} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
```

## Conversion Funnel Chart

```tsx
'use client'
import { FunnelChart, Funnel, Tooltip, LabelList, ResponsiveContainer } from 'recharts'

export function ApplicationFunnelChart({ data }: { data: { name: string; value: number }[] }) {
  const FUNNEL_COLORS = ['#1B4F8A', '#2E86DE', '#3498DB', '#0D7A3E', '#27AE60']

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5">
      <h3 className="text-sm font-semibold text-gray-700 mb-4">Application Pipeline Funnel</h3>
      <ResponsiveContainer width="100%" height={280}>
        <FunnelChart>
          <Tooltip formatter={(v, n) => [v, n]} />
          <Funnel dataKey="value" data={data} isAnimationActive>
            {FUNNEL_COLORS.map((color, index) => (
              <LabelList key={index} position="center" fill="#fff" stroke="none" dataKey="name" fontSize={12} />
            ))}
          </Funnel>
        </FunnelChart>
      </ResponsiveContainer>
    </div>
  )
}
```

## ATS Score Trend (Area Chart)

```tsx
'use client'
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts'

export function ATSScoreTrendChart({ data }: { data: { week: string; score: number }[] }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5">
      <h3 className="text-sm font-semibold text-gray-700 mb-4">ATS Score Over Time</h3>
      <ResponsiveContainer width="100%" height={180}>
        <AreaChart data={data}>
          <defs>
            <linearGradient id="scoreGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#1B4F8A" stopOpacity={0.15} />
              <stop offset="95%" stopColor="#1B4F8A" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" />
          <XAxis dataKey="week" tick={{ fontSize: 11 }} />
          <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} />
          <Tooltip formatter={(v) => [`${v}/100`, 'ATS Score']} />
          <ReferenceLine y={75} stroke="#0D7A3E" strokeDasharray="4 4" label={{ value: 'Green Zone', fill: '#0D7A3E', fontSize: 10 }} />
          <ReferenceLine y={60} stroke="#B85C00" strokeDasharray="4 4" label={{ value: 'Min Pass', fill: '#B85C00', fontSize: 10 }} />
          <Area type="monotone" dataKey="score" stroke="#1B4F8A" strokeWidth={2} fill="url(#scoreGradient)" />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}
```

## Digital FTE KPI Definitions (Always Use These Formulas)

```typescript
// lib/kpi.ts — authoritative KPI calculations
export const KPI = {
  jobSearchScore: (atsScore: number, activityScore: number, responseRate: number, profileComplete: number) =>
    Math.round(atsScore * 0.30 + activityScore * 0.25 + responseRate * 0.25 + profileComplete * 0.20),

  responseRate: (responses: number, applicationsSent: number) =>
    applicationsSent > 0 ? Math.round((responses / applicationsSent) * 100) : 0,

  activityScore: (appsThisWeek: number, fourWeekAvg: number) =>
    fourWeekAvg > 0 ? Math.min(100, Math.round((appsThisWeek / fourWeekAvg) * 100)) : 0,

  interviewConversion: (interviews: number, apps: number) =>
    apps > 0 ? parseFloat(((interviews / apps) * 100).toFixed(1)) : 0,
}
```

## Rules

- ALWAYS wrap charts in `<ResponsiveContainer width="100%" height={N}>` — never fixed widths
- Chart tooltips: always use `contentStyle={{ borderRadius: '8px' }}`
- Never show raw API data — always transform to chart-ready format in a `useMemo` before rendering
- Loading state: use skeleton divs with `animate-pulse` — never show empty chart axes
- Mobile: use height={160} for mobile breakpoints, height={220} for desktop
