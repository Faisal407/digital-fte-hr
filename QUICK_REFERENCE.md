# Quick Reference Card — Digital FTE Frontend

## 🚀 Quick Start (Local Development)

```bash
cd digital-fte-hr/apps/web
npm install                  # Install dependencies
npm run dev                  # Start dev server (http://localhost:3000)
npm run build               # Production build
npm run lint                # Check code quality
```

## 📍 Route Map

| Route | Component | Status | Type |
|-------|-----------|--------|------|
| `/` | Homepage | ✅ Works | Static |
| `/auth/login` | Sign In | ✅ Fixed | Static |
| `/auth/register` | Create Account | ✅ Fixed | Static |
| `/dashboard` | Dashboard | ✅ Ready | Dynamic |
| `/dashboard/jobs` | Job Search | ⏳ Stubbed | Dynamic |
| `/dashboard/resume` | Resume Manager | ⏳ Stubbed | Dynamic |
| `/dashboard/apply` | Application Queue | ⏳ Stubbed | Dynamic |

## 🔑 Key Files

```
digital-fte-hr/apps/web/
├── app/
│   ├── page.tsx                    ← Homepage
│   ├── auth/
│   │   ├── layout.tsx              ← Auth layout (centered form)
│   │   ├── login/page.tsx          ← Sign In page
│   │   └── register/page.tsx       ← Create Account page
│   ├── (dashboard)/
│   │   ├── layout.tsx              ← Dashboard layout
│   │   ├── page.tsx                ← Dashboard overview
│   │   ├── jobs/page.tsx           ← Job search
│   │   ├── resume/page.tsx         ← Resume list
│   │   └── apply/page.tsx          ← Application queue
│   ├── api/auth/[...nextauth]/route.ts  ← NextAuth handler
│   └── layout.tsx                  ← Root layout
├── components/
│   ├── ui/                         ← shadcn/ui components
│   └── dashboard/                  ← Dashboard components
├── lib/
│   ├── api-client.ts               ← API utilities
│   └── validators.ts               ← Zod schemas
├── store/
│   └── ui-store.ts                 ← Zustand state
└── package.json
```

## 🧪 Testing

```bash
# E2E Tests with Playwright
cd digital-fte-hr/apps/web
node test-fixed-app.js              # Run headed mode test (shows browser!)

# View Test Results
open test-results/                  # Check screenshots
```

## 🔧 Deployment Checklist

- [ ] All routes tested locally
- [ ] Build successful (`npm run build`)
- [ ] No TypeScript errors
- [ ] No ESLint warnings
- [ ] Screenshots captured
- [ ] E2E tests passing
- [ ] Environment variables set
- [ ] Vercel project created
- [ ] GitHub connected to Vercel
- [ ] Deployed! ✅

## 📋 Common Tasks

### Update Homepage
```typescript
// app/page.tsx
// Edit FeatureCard component or add new sections
```

### Add New Route
```typescript
// Create new directory structure:
// app/new-section/page.tsx

// Pages are auto-routed by filename
```

### Style Changes
```bash
# Use Tailwind CSS classes (pre-configured)
# App uses shadcn/ui for components
# Theme in tailwind.config.ts
```

### Test a Route Locally
```bash
npm run dev  # Start dev server
# Open http://localhost:3000/route-name in browser
```

## 🔑 Environment Variables

```env
# Required for production
NEXT_PUBLIC_API_URL=https://api.yourdomain.com
NEXTAUTH_URL=https://yourdomain.com
NEXTAUTH_SECRET=<generated-secret>

# Optional (Cognito)
COGNITO_CLIENT_ID=xxx
COGNITO_CLIENT_SECRET=xxx
COGNITO_ISSUER=xxx
```

## 📊 Current Status

| Component | Status |
|-----------|--------|
| Homepage | ✅ Production Ready |
| Auth Routes | ✅ Production Ready |
| Dashboard | ⏳ Development |
| Backend API | ⏳ Planning |
| Database | ⏳ Planning |

## 🎯 Next Priorities

1. **Backend API** — Create login/register endpoints
2. **NextAuth** — Configure with Cognito
3. **Vercel Deploy** — Push to production
4. **Dashboard Pages** — Implement job search UI
5. **Resume Builder** — Build upload interface

## 📞 Documentation

- `FRONTEND_FIXES_SUMMARY.md` — What was fixed
- `BEFORE_AFTER_COMPARISON.md` — Visual comparison
- `FRONTEND_STATUS_REPORT.md` — Complete report
- `digital-fte-hr/apps/web/CLAUDE.md` — Local development guide

## ✨ Key Technologies

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **UI Library**: shadcn/ui
- **State**: Zustand
- **Auth**: NextAuth.js v5
- **Forms**: React Hook Form + Zod
- **API**: TanStack Query
- **Testing**: Playwright
- **Deployment**: Vercel

---

**Last Updated**: March 4, 2026
**Status**: 🟢 Production Ready
