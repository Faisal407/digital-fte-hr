# Mobile App — Local Context
# This CLAUDE.md is for: apps/mobile/
# Inherits root CLAUDE.md + adds mobile-specific rules

## What This Service Does
React Native mobile app (iOS + Android) for Digital FTE. Provides the full job search,
resume management, application tracking, and analytics dashboard experience on mobile.
Uses the same REST API as the web app.

## Tech Stack (This Service)
- **Framework**: React Native via Expo SDK 51
- **Language**: TypeScript (strict)
- **Navigation**: React Navigation v6 (stack + bottom tabs)
- **Charts**: Victory Native (mobile-optimized, no Recharts on mobile)
- **State**: Zustand (same as web)
- **Data Fetching**: TanStack Query v5
- **Push Notifications**: Expo Notifications (FCM + APNs)
- **Auth**: Amazon Cognito via aws-amplify/auth

## Directory Structure
```
apps/mobile/
├── app/                    → Expo Router screens
│   ├── (tabs)/
│   │   ├── jobs.tsx        → Job search + results
│   │   ├── resume.tsx      → Resume management + ATS score
│   │   ├── apply.tsx       → Application queue (approval)
│   │   ├── progress.tsx    → Dashboard + analytics
│   │   └── settings.tsx    → Profile, notifications, plan
│   └── _layout.tsx
├── components/             → Reusable mobile components
│   ├── jobs/
│   ├── resume/
│   ├── charts/             → VictoryPie, VictoryBar wrappers
│   └── shared/
├── hooks/                  → Custom hooks (usePush, useJobSearch, etc.)
├── store/                  → Zustand stores (same interface as web)
└── constants/              → Colors, spacing, typography (mobile tokens)
```

## Mobile-Specific Rules
1. **Thumb zone**: Primary CTAs must be in bottom 40% of screen — never top-right
2. **Victory Native only**: Never use Recharts on mobile — it is web-only
3. **SafeAreaView**: Every screen must be wrapped in SafeAreaView
4. **Offline handling**: Use NetInfo — show offline banner, queue mutations for retry
5. **Image optimization**: Always use Expo Image (not React Native Image) for caching
6. **Large lists**: Always use FlatList with `getItemLayout` for job lists — never ScrollView with map()
7. **Haptic feedback**: Use Expo Haptics for approval/skip actions on apply screen

## Push Notification Setup
```typescript
// hooks/usePushNotifications.ts
import * as Notifications from 'expo-notifications'
import * as Device from 'expo-device'

export async function registerForPushNotifications(userId: string) {
  if (!Device.isDevice) return  // Simulator — skip
  const { status } = await Notifications.requestPermissionsAsync()
  if (status !== 'granted') return
  const token = await Notifications.getExpoPushTokenAsync({
    projectId: process.env.EXPO_PROJECT_ID,
  })
  // Send token to API — stored in push_notification_token table
  await api.post('/api/v1/channels/push/token', { token: token.data })
}
```

## ATS Score Display (Mobile)
```typescript
// Mobile uses VictoryPie for ATS score ring (not SVG like web)
const scoreColor = atsScore >= 75 ? '#0D7A3E' : atsScore >= 60 ? '#B85C00' : '#C0392B'

<VictoryPie
  data={[{ y: atsScore }, { y: 100 - atsScore }]}
  colorScale={[scoreColor, '#F3F4F6']}
  innerRadius={70}
  radius={90}
  standalone={false}
/>
```

## Local Development
```bash
pnpm --filter mobile start      # Start Expo dev server
pnpm --filter mobile ios        # Run on iOS simulator
pnpm --filter mobile android    # Run on Android emulator
pnpm --filter mobile test       # Vitest unit tests
```
