---
name: tailwind-design-system
description: Enforces Digital FTE's Tailwind CSS design system — spacing scale, responsive breakpoints, component patterns, animation utilities, and accessibility requirements. Use when reviewing or writing any Tailwind className strings, creating new UI components from scratch, or auditing existing components for design consistency.
---

# Tailwind Design System — Digital FTE

## Approved Class Vocabulary

### Spacing (Use ONLY These Values)
```
Gap / Padding / Margin: 0, 0.5, 1, 2, 3, 4, 5, 6, 8, 10, 12, 16, 20, 24, 32
Cards inner padding:    p-4 (compact) | p-5 (standard) | p-6 (spacious)
Page outer padding:     px-4 (mobile) | px-6 (tablet+)
Section gaps:           gap-4 (tight) | gap-6 (standard) | gap-8 (loose)
```

### Breakpoints
```
Mobile first — always write base class then override:
sm:  640px  — tablet portrait
md:  768px  — tablet landscape
lg:  1024px — desktop
xl:  1280px — wide desktop

Example: className="flex-col md:flex-row"  (stacked on mobile, side by side on tablet+)
```

### Typography Scale
```
text-xs   (12px) — labels, captions, helper text
text-sm   (14px) — table cells, secondary info, card metadata
text-base (16px) — body text, form inputs
text-lg   (18px) — card titles, sidebar nav items
text-xl   (20px) — page subtitles
text-2xl  (24px) — page titles
text-3xl  (30px) — hero/dashboard KPI numbers
```

### Color Usage Rules
```
text-gray-900   — primary headings
text-gray-700   — body text, labels
text-gray-600   — secondary text
text-gray-500   — placeholder, captions
text-gray-400   — disabled states

bg-white        — card/surface backgrounds
bg-gray-50      — page backgrounds, table alternating rows
bg-gray-100     — hover states on list items

border-gray-200 — default card borders
border-gray-300 — focused input borders

text-[#1B4F8A]  — brand navy (primary CTAs, active nav)
text-[#2E86DE]  — accent blue (links, highlights)
```

### Shadow Scale
```
shadow-sm   — cards at rest (default)
shadow-md   — cards on hover (use with transition-shadow)
shadow-lg   — modals, dropdowns, popovers
shadow-none — inside modals, nested cards
```

## Component Pattern Library

### Standard Card
```tsx
<div className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm hover:shadow-md transition-shadow duration-200">
  {children}
</div>
```

### Status Badge
```tsx
const STATUS_STYLES = {
  applied:     'bg-gray-100 text-gray-700',
  viewed:      'bg-yellow-50 text-yellow-700',
  shortlisted: 'bg-blue-50 text-blue-700',
  interview:   'bg-purple-50 text-purple-700',
  offer:       'bg-green-50 text-green-700',
  rejected:    'bg-red-50 text-red-700',
}

<span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_STYLES[status]}`}>
  {status}
</span>
```

### Platform Logo Badge
```tsx
const PLATFORM_COLORS = {
  linkedin:   'bg-[#0077B5] text-white',
  indeed:     'bg-[#2164F3] text-white',
  naukrigulf: 'bg-[#E84545] text-white',
  bayt:       'bg-[#FF6B35] text-white',
  rozee_pk:   'bg-[#009245] text-white',
  greenhouse: 'bg-[#24A47F] text-white',
}

<span className={`rounded px-1.5 py-0.5 text-xs font-semibold ${PLATFORM_COLORS[platform]}`}>
  {platform}
</span>
```

### Section Header
```tsx
<div className="flex items-center justify-between mb-4">
  <h2 className="text-base font-semibold text-gray-900">{title}</h2>
  {action && <button className="text-sm text-[#2E86DE] hover:text-[#1B4F8A] font-medium">{action}</button>}
</div>
```

### Empty State
```tsx
<div className="flex flex-col items-center justify-center py-16 text-center">
  <div className="text-4xl mb-3">{icon}</div>
  <h3 className="text-base font-semibold text-gray-900 mb-1">{title}</h3>
  <p className="text-sm text-gray-500 max-w-sm mb-4">{description}</p>
  {cta && <Button>{cta}</Button>}
</div>
```

## Animation Utilities

```
transition-all duration-200     — general transitions
transition-shadow duration-200  — card hover shadows
transition-colors duration-150  — button/link hover colors
animate-pulse                   — skeleton loading states
animate-spin                    — loading spinners (use Loader2 from lucide)
```

## Accessibility Requirements (All Components)

```tsx
// Every interactive element needs:
aria-label="..."          // when no visible text
aria-describedby="..."    // when there's additional context
role="..."                // when semantic HTML not used
tabIndex={0}              // custom interactive elements
onKeyDown={(e) => e.key === 'Enter' && handleClick()}  // keyboard support

// Focus styles — NEVER remove, NEVER use outline-none alone:
className="focus:outline-none focus-visible:ring-2 focus-visible:ring-[#2E86DE] focus-visible:ring-offset-2"

// Color contrast — minimum 4.5:1 for text, 3:1 for UI components
// Use text-gray-700 or darker on white backgrounds
// Use text-white on brand navy or accent blue backgrounds
```

## Forbidden Patterns

```
❌ text-black, bg-black            — use text-gray-900, bg-gray-900
❌ p-3, gap-3, m-3                 — not in our scale (except loading skeletons)
❌ hover:opacity-70                — use hover:bg-gray-100 or specific hover colors
❌ style={{ color: '#...' }}       — always use Tailwind classes or CSS variables
❌ <div onClick={...}>             — use <button> or <a> for interactive elements
❌ outline-none without focus-visible — accessibility violation
❌ dark: classes                   — Phase 1 does not support dark mode
❌ fixed without z-index           — always pair fixed positioning with z-* class
```
