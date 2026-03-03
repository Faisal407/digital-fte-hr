# Digital FTE Web App — Next.js 14

Next.js 14 frontend application for the Digital FTE HR platform. Provides job search, resume optimization, application management, and analytics.

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Styling**: Tailwind CSS + shadcn/ui
- **State Management**: Zustand (UI state) + TanStack Query (server state)
- **Authentication**: NextAuth.js v5 + Amazon Cognito
- **Forms**: React Hook Form + Zod
- **Charts**: Recharts
- **Linting**: Biome

## Quick Start

### Prerequisites

- Node.js 18+
- pnpm (package manager)
- AWS Cognito credentials

### Installation

```bash
# From root of monorepo
pnpm install

# Copy environment variables
cp apps/web/.env.local.example apps/web/.env.local

# Edit .env.local with your Cognito credentials
```

### Development

```bash
# Start dev server (port 3000)
pnpm --filter web dev

# Type check
pnpm --filter web typecheck

# Lint code
pnpm --filter web lint

# Run tests
pnpm --filter web test
```

### Build & Deploy

```bash
# Build for production
pnpm --filter web build

# Start production server
pnpm --filter web start
```

## Project Structure

```
app/                    # Next.js App Router pages
├── (auth)/             # Authentication pages (login, register)
├── (dashboard)/        # Protected dashboard routes
│   ├── jobs/          # Job search & results
│   ├── resume/        # Resume management
│   ├── apply/         # Application review & approval gate
│   ├── tracker/       # Application status tracker
│   ├── analytics/     # Analytics & reporting
│   └── settings/      # User settings
├── api/               # API routes (auth, webhooks)
├── layout.tsx         # Root layout with providers
├── page.tsx           # Home page
└── globals.css        # Tailwind base styles

components/
├── ui/                # shadcn/ui components
├── dashboard/         # Dashboard shell components
├── jobs/             # Job search components
├── resume/           # Resume management components
├── apply/            # Application components
└── analytics/        # Analytics components

lib/
├── api-client.ts     # Typed API client
├── auth.ts           # NextAuth configuration
├── utils.ts          # Utility functions
├── constants.ts      # Constants & colors
└── validators.ts     # Zod schemas

hooks/
├── useJobs.ts        # Job search hooks
├── useResumes.ts     # Resume hooks
├── useApplications.ts # Application hooks
└── useDashboard.ts   # Dashboard hooks

store/
└── ui-store.ts       # Zustand UI state

types/
└── index.ts          # Shared TypeScript types
```

## Key Features (Phase 1)

- ✅ Project setup & configuration
- 🔄 NextAuth.js integration with Cognito
- 🔄 API client with typed requests
- 🔄 Dashboard layout & navigation
- 🔄 Job search interface
- 🔄 Resume management
- 🔄 Application approval gate (CRITICAL)
- 🔄 Analytics dashboard
- 🔄 Settings pages

## Critical Requirements

### Application Approval Gate

The approval gate is **non-negotiable** and must:

- Display full-screen modal on mobile
- Show clear job details (company, title, salary, location)
- Display resume version being used
- Allow cover letter editing
- Have three equal-prominence buttons: Approve, Edit, Skip
- Include 24-hour expiration countdown
- Never bypass — user must explicitly approve before submission
- Record all approvals in audit log

### ATS Score Colors

- **RED** (<60): Block export, mandatory improvement
- **YELLOW** (60-74): Warn user, allow export with disclaimer
- **GREEN** (75+): Allow export, eligible for auto-apply

### Plan Tier Gating

- **Free**: Job search only, 1 resume, no auto-apply
- **Pro**: Full search + auto-apply (50/day), 10 resumes, reporting disabled
- **Elite**: Everything + 150/day auto-apply, unlimited resumes, reporting enabled

### Quiet Hours

Never send notifications between 11 PM – 7 AM in user's local timezone.

## Environment Variables

See `.env.local.example` for template. Required variables:

```env
NEXT_PUBLIC_API_URL=http://localhost:4000/api/v1
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=generate-with-openssl-rand-base64-32
AWS_COGNITO_CLIENT_ID=your-client-id
AWS_COGNITO_CLIENT_SECRET=your-client-secret
AWS_COGNITO_ISSUER=https://cognito-idp.region.amazonaws.com/pool-id
```

## API Integration

The app connects to the backend REST API at `NEXT_PUBLIC_API_URL`. Key endpoints:

- `POST /auth/login` — User login
- `GET /jobs/search` — Job search
- `POST /jobs/search` — Trigger async job search
- `GET /resumes` — List user resumes
- `POST /resumes` — Upload resume
- `GET /applications` — List applications
- `PATCH /applications/{id}/approve` — Approve application (CRITICAL GATE)
- `GET /dashboard/overview` — Dashboard KPIs

See `apps/api` for complete API documentation.

## Testing

```bash
# Unit tests
pnpm --filter web test

# Watch mode
pnpm --filter web test:watch

# UI test runner
pnpm --filter web test:ui
```

## Performance

- Server components by default (faster, no hydration overhead)
- Image optimization with `next/image`
- Route prefetching for navigation
- Incremental Static Regeneration (ISR) for pages
- CSS-in-JS with Tailwind for minimal bundle
- Code splitting via dynamic imports

## Browser Support

- Chrome/Edge (latest)
- Firefox (latest)
- Safari (latest)
- Mobile browsers (iOS Safari, Chrome Android)

## Contributing

1. Create feature branch from `main`
2. Follow TypeScript strict mode
3. Use Biome for linting: `pnpm --filter web lint`
4. Write tests for new features
5. Ensure types pass: `pnpm --filter web typecheck`
6. Submit PR with description of changes

## Troubleshooting

**Port 3000 already in use:**
```bash
pnpm --filter web dev -- -p 3001
```

**NextAuth session not persisting:**
- Check `NEXTAUTH_SECRET` is set and matches between client/server
- Verify `NEXTAUTH_URL` matches deployment domain

**API requests failing:**
- Check `NEXT_PUBLIC_API_URL` is correct
- Verify backend is running (`pnpm --filter api dev`)
- Check browser console for CORS errors

**Tailwind styles not applying:**
- Restart dev server after adding new file types
- Check `tailwind.config.ts` content paths

## Roadmap

Phase 1 (Current): ✅ Setup & Core Infrastructure
Phase 2: Full Feature Implementation
Phase 3: Performance Optimization
Phase 4: E2E Testing & Hardening
Phase 5: Production Deployment

## Support

For issues, see root `CLAUDE.md` or visit [GitHub Issues](https://github.com/anthropics/digital-fte-hr).

## License

© 2026 Digital FTE. All rights reserved.
