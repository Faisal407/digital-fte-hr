---
name: react-native-screen
description: Builds React Native screens and components for the Digital FTE mobile app (apps/mobile/) using Expo and Victory Native charts. Use when creating mobile screens for job search, resume management, application tracker, or push notification handling. Applies mobile-first UX patterns with thumb-zone awareness and offline-capable design.
---

# React Native Mobile Screen Skill — Digital FTE Mobile App

## Stack: Expo SDK 51 + TypeScript + Victory Native + React Navigation v6

## Screen Template

```tsx
// apps/mobile/screens/JobSearchScreen.tsx
import React, { useState, useCallback } from 'react'
import { View, Text, StyleSheet, FlatList, RefreshControl, Pressable, SafeAreaView } from 'react-native'
import { useNavigation } from '@react-navigation/native'
import type { NativeStackNavigationProp } from '@react-navigation/native-stack'
import { useQuery } from '@tanstack/react-query'
import { api } from '../lib/api-client'
import { JobMatchCard } from '../components/JobMatchCard'
import { SearchBar } from '../components/SearchBar'
import { JobCardSkeleton } from '../components/skeletons/JobCardSkeleton'
import { colors, typography, spacing } from '../theme'

export function JobSearchScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>()
  const [query, setQuery] = useState('')
  const [isRefreshing, setIsRefreshing] = useState(false)

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['mobile-jobs', query],
    queryFn: () => api.jobs.search({ query }),
    enabled: query.length >= 2,
  })

  const onRefresh = useCallback(async () => {
    setIsRefreshing(true)
    await refetch()
    setIsRefreshing(false)
  }, [refetch])

  return (
    <SafeAreaView style={styles.container}>
      <SearchBar
        value={query}
        onChangeText={setQuery}
        placeholder="Job title, company, or skills..."
        style={styles.searchBar}
      />
      {isLoading ? (
        <View style={styles.skeletonContainer}>
          {[1,2,3].map(i => <JobCardSkeleton key={i} />)}
        </View>
      ) : (
        <FlatList
          data={data?.jobs ?? []}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <JobMatchCard
              job={item}
              onPress={() => navigation.navigate('JobDetail', { jobId: item.id })}
            />
          )}
          contentContainerStyle={styles.list}
          refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} colors={[colors.brand]} />}
          ListEmptyComponent={query.length >= 2 ? <Text style={styles.emptyText}>No jobs found. Try a different search.</Text> : null}
        />
      )}
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container:         { flex: 1, backgroundColor: colors.background },
  searchBar:         { margin: spacing.md },
  skeletonContainer: { paddingHorizontal: spacing.md, gap: spacing.sm },
  list:              { paddingHorizontal: spacing.md, paddingBottom: spacing.xl },
  emptyText:         { textAlign: 'center', color: colors.textMuted, marginTop: spacing.xl, ...typography.body },
})
```

## Theme System

```typescript
// apps/mobile/theme/index.ts
export const colors = {
  brand:      '#1B4F8A',   // Navy
  accent:     '#2E86DE',   // Blue
  success:    '#0D7A3E',   // Green (ATS 75+)
  warning:    '#B85C00',   // Amber (ATS 60-74)
  danger:     '#C0392B',   // Red (ATS <60)
  background: '#F4F6F9',
  surface:    '#FFFFFF',
  border:     '#E5E7EB',
  text:       '#111827',
  textMuted:  '#6B7280',
}

export const spacing = {
  xs: 4, sm: 8, md: 16, lg: 24, xl: 40
}

export const typography = {
  h1:      { fontSize: 24, fontWeight: '700' as const, color: colors.text },
  h2:      { fontSize: 20, fontWeight: '600' as const, color: colors.text },
  body:    { fontSize: 15, fontWeight: '400' as const, color: colors.text },
  caption: { fontSize: 12, fontWeight: '400' as const, color: colors.textMuted },
}
```

## ATS Score Gauge (Victory Native)

```tsx
import { VictoryPie } from 'victory-native'

export function MobileScoreGauge({ score }: { score: number }) {
  const color = score >= 75 ? colors.success : score >= 60 ? colors.warning : colors.danger
  const data = [
    { x: 'score', y: score },
    { x: 'remaining', y: 100 - score },
  ]
  return (
    <View style={{ alignItems: 'center' }}>
      <VictoryPie
        data={data}
        width={120} height={120}
        innerRadius={42}
        startAngle={-90} endAngle={270}
        colorScale={[color, '#E5E7EB']}
        labels={() => null}
        style={{ parent: { overflow: 'visible' } }}
      />
      <Text style={{ position: 'absolute', top: 42, ...typography.h2, color }}>{score}</Text>
    </View>
  )
}
```

## Push Notification Setup (Expo Notifications)

```typescript
// lib/notifications.ts
import * as Notifications from 'expo-notifications'
import * as Device from 'expo-device'

export async function registerForPushNotifications(): Promise<string | null> {
  if (!Device.isDevice) return null   // Simulator — skip

  const { status: existing } = await Notifications.getPermissionsAsync()
  const status = existing === 'granted' ? existing : (await Notifications.requestPermissionsAsync()).status
  if (status !== 'granted') return null

  const token = (await Notifications.getExpoPushTokenAsync({ projectId: process.env.EXPO_PROJECT_ID })).data
  // Send token to backend to store against user account
  await api.users.registerPushToken(token)
  return token
}

// Handle incoming notifications (app foreground)
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true, shouldPlaySound: true, shouldSetBadge: true,
  }),
})
```

## Bottom Tab Navigator Structure

```
Tab 1: 🔍 Jobs      → JobSearchScreen
Tab 2: 📄 Resume    → ResumeScreen
Tab 3: 📋 Apply     → ApplicationQueueScreen  (badge: pending count)
Tab 4: 📊 Progress  → DashboardScreen
Tab 5: ⚙️ Settings  → SettingsScreen
```

## Thumb Zone Rule

All primary CTAs (Apply, Approve, Save) must be in the bottom 40% of the screen — always use `position: 'absolute', bottom: 0` for floating action bars. Never put critical actions in the top half of the screen on mobile.

## Offline Handling

```typescript
// Always handle network errors gracefully
import NetInfo from '@react-native-community/netinfo'

const { isConnected } = await NetInfo.fetch()
if (!isConnected) {
  // Show cached data with 'offline' banner — never block with error
  return { ...cachedData, isStale: true }
}
```
