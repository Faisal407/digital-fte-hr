---
name: email-composer
description: Builds transactional and subscription email templates for Digital FTE using React Email components and Amazon SES. Use when creating welcome emails, weekly job digest emails, application status notifications, resume score reports, or any other email template. Applies Digital FTE brand, CAN-SPAM compliance headers, unsubscribe links, and SES deliverability best practices.
---

# Email Composer Skill — Digital FTE

## Stack: React Email + Amazon SES + TypeScript

## Base Email Template Wrapper

```tsx
// services/channel-orchestration/src/email/templates/BaseEmail.tsx
import {
  Html, Head, Preview, Body, Container, Section,
  Heading, Text, Img, Link, Hr, Button, Font
} from '@react-email/components'

interface BaseEmailProps {
  preview: string        // Text shown in inbox preview pane
  children: React.ReactNode
}

export function BaseEmail({ preview, children }: BaseEmailProps) {
  return (
    <Html lang="en">
      <Head>
        <Font fontFamily="Inter" fallbackFontFamily="Arial" webFont={{
          url: 'https://fonts.gstatic.com/s/inter/v13/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuLyfAZ9hiJ-Ek-_EeA.woff2',
          format: 'woff2',
        }} fontWeight={400} fontStyle="normal" />
      </Head>
      <Preview>{preview}</Preview>
      <Body style={{ backgroundColor: '#F4F6F9', margin: '0', padding: '20px 0', fontFamily: 'Inter, Arial, sans-serif' }}>

        {/* Header */}
        <Container style={{ maxWidth: '600px', margin: '0 auto' }}>
          <Section style={{ backgroundColor: '#1B4F8A', borderRadius: '8px 8px 0 0', padding: '24px', textAlign: 'center' }}>
            <Img src="https://cdn.digitalfte.com/logo-white.png" alt="Digital FTE" width={140} height={36} />
          </Section>

          {/* Content */}
          <Section style={{ backgroundColor: '#FFFFFF', padding: '32px', borderRadius: '0 0 8px 8px' }}>
            {children}
          </Section>

          {/* Footer */}
          <Section style={{ padding: '20px', textAlign: 'center' }}>
            <Text style={{ color: '#9CA3AF', fontSize: '12px', lineHeight: '20px', margin: '0' }}>
              Digital FTE · 123 Innovation Drive · Dubai, UAE
            </Text>
            <Text style={{ color: '#9CA3AF', fontSize: '12px', margin: '4px 0 0' }}>
              {/* CAN-SPAM REQUIRED — always include */}
              <Link href="{{unsubscribe_url}}" style={{ color: '#6B7280', textDecoration: 'underline' }}>
                Unsubscribe
              </Link>
              {' · '}
              <Link href="https://digitalfte.com/privacy" style={{ color: '#6B7280' }}>Privacy Policy</Link>
              {' · '}
              <Link href="https://digitalfte.com/settings/notifications" style={{ color: '#6B7280' }}>Manage Preferences</Link>
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  )
}
```

## Weekly Job Digest Email

```tsx
// templates/WeeklyJobDigest.tsx
import { BaseEmail } from './BaseEmail'
import { Heading, Text, Section, Button, Hr, Row, Column } from '@react-email/components'
import type { JobMatch, WeeklyStats } from '@digital-fte/shared/types'

interface WeeklyDigestProps {
  userName: string
  weekOf: string
  stats: WeeklyStats
  topJobs: JobMatch[]
  atsScore: number
  unsubscribeUrl: string
}

export function WeeklyJobDigestEmail({ userName, weekOf, stats, topJobs, atsScore }: WeeklyDigestProps) {
  const scoreColor = atsScore >= 75 ? '#0D7A3E' : atsScore >= 60 ? '#B85C00' : '#C0392B'
  const scoreLabel = atsScore >= 75 ? '✅ Green Zone' : atsScore >= 60 ? '⚠️ Needs Work' : '🔴 Needs Attention'

  return (
    <BaseEmail preview={`Your week: ${stats.applied} applications sent · ${stats.responses} responses · ATS ${atsScore}/100`}>

      <Heading style={{ fontSize: '22px', fontWeight: '700', color: '#111827', margin: '0 0 8px' }}>
        Good morning, {userName}! 👋
      </Heading>
      <Text style={{ color: '#6B7280', fontSize: '14px', margin: '0 0 24px' }}>
        Here's your Digital FTE weekly summary for {weekOf}
      </Text>

      {/* KPI Row */}
      <Section style={{ backgroundColor: '#F8FAFC', borderRadius: '8px', padding: '20px', marginBottom: '24px' }}>
        <Row>
          <Column style={{ textAlign: 'center', padding: '0 12px' }}>
            <Text style={{ fontSize: '28px', fontWeight: '700', color: '#1B4F8A', margin: '0' }}>{stats.applied}</Text>
            <Text style={{ fontSize: '12px', color: '#6B7280', margin: '2px 0 0' }}>Applications</Text>
          </Column>
          <Column style={{ textAlign: 'center', padding: '0 12px', borderLeft: '1px solid #E5E7EB' }}>
            <Text style={{ fontSize: '28px', fontWeight: '700', color: '#0D7A3E', margin: '0' }}>{stats.responses}</Text>
            <Text style={{ fontSize: '12px', color: '#6B7280', margin: '2px 0 0' }}>Responses</Text>
          </Column>
          <Column style={{ textAlign: 'center', padding: '0 12px', borderLeft: '1px solid #E5E7EB' }}>
            <Text style={{ fontSize: '28px', fontWeight: '700', color: scoreColor, margin: '0' }}>{atsScore}</Text>
            <Text style={{ fontSize: '12px', color: '#6B7280', margin: '2px 0 0' }}>ATS Score</Text>
          </Column>
          <Column style={{ textAlign: 'center', padding: '0 12px', borderLeft: '1px solid #E5E7EB' }}>
            <Text style={{ fontSize: '28px', fontWeight: '700', color: '#7C3AED', margin: '0' }}>{stats.interviews}</Text>
            <Text style={{ fontSize: '12px', color: '#6B7280', margin: '2px 0 0' }}>Interviews</Text>
          </Column>
        </Row>
      </Section>

      {/* ATS Score Status */}
      <Section style={{ backgroundColor: atsScore >= 75 ? '#ECFDF5' : atsScore >= 60 ? '#FFFBEB' : '#FEF2F2', borderRadius: '8px', padding: '16px', marginBottom: '24px', borderLeft: `4px solid ${scoreColor}` }}>
        <Text style={{ color: scoreColor, fontWeight: '600', fontSize: '14px', margin: '0 0 4px' }}>{scoreLabel}</Text>
        <Text style={{ color: '#374151', fontSize: '13px', margin: '0' }}>
          {atsScore >= 75
            ? 'Your resume is fully optimized. Keep applying!'
            : atsScore >= 60
            ? 'Your resume needs minor improvements. Visit the Resume Builder.'
            : 'Your resume needs significant optimization before applying more.'}
        </Text>
      </Section>

      {/* Top Job Matches */}
      <Heading style={{ fontSize: '16px', fontWeight: '600', color: '#111827', margin: '0 0 16px' }}>
        🎯 Top Job Matches This Week
      </Heading>
      {topJobs.slice(0, 3).map((job) => (
        <Section key={job.id} style={{ border: '1px solid #E5E7EB', borderRadius: '8px', padding: '16px', marginBottom: '12px' }}>
          <Row>
            <Column>
              <Text style={{ fontWeight: '600', fontSize: '15px', color: '#111827', margin: '0 0 2px' }}>{job.title}</Text>
              <Text style={{ fontSize: '13px', color: '#6B7280', margin: '0' }}>{job.company.name} · {job.location}</Text>
            </Column>
            <Column style={{ textAlign: 'right', width: '60px' }}>
              <Text style={{ fontSize: '20px', fontWeight: '700', color: '#1B4F8A', margin: '0' }}>{job.matchScore}</Text>
              <Text style={{ fontSize: '10px', color: '#9CA3AF', margin: '0' }}>Match</Text>
            </Column>
          </Row>
          <Button href={`https://app.digitalfte.com/jobs/${job.id}`}
            style={{ backgroundColor: '#1B4F8A', color: 'white', borderRadius: '6px', padding: '8px 16px', fontSize: '13px', marginTop: '12px', textDecoration: 'none' }}>
            View & Apply →
          </Button>
        </Section>
      ))}

      <Hr style={{ borderColor: '#E5E7EB', margin: '24px 0' }} />
      <Button href="https://app.digitalfte.com/dashboard"
        style={{ backgroundColor: '#2E86DE', color: 'white', borderRadius: '8px', padding: '12px 24px', fontSize: '15px', fontWeight: '600', display: 'block', textAlign: 'center', textDecoration: 'none' }}>
        Open Your Dashboard
      </Button>
    </BaseEmail>
  )
}
```

## SES Sender with Required Headers

```typescript
// services/channel-orchestration/src/email/ses-sender.ts
import { SESClient, SendEmailCommand } from '@aws-sdk/client-ses'
import { renderAsync } from '@react-email/render'
import { getSecret } from '../lib/secrets'

const ses = new SESClient({ region: process.env.AWS_REGION ?? 'us-east-1' })

interface SendEmailOptions {
  to:          string
  subject:     string
  template:    React.ReactElement
  userId:      string           // Required for unsubscribe token generation
  category:    EmailCategory    // 'transactional' | 'weekly_digest' | 'job_alert' | 'marketing'
}

export async function sendEmail(opts: SendEmailOptions) {
  // 1. Check suppression list before render (save compute)
  if (await suppressionList.isBlocked(opts.userId, 'email')) {
    throw new Error(`User ${opts.userId} has unsubscribed from email`)
  }

  // 2. Generate user-specific unsubscribe token (one-click unsubscribe RFC 8058)
  const unsubToken = await generateUnsubscribeToken(opts.userId, 'email')
  const unsubUrl   = `https://app.digitalfte.com/unsubscribe?token=${unsubToken}`

  // 3. Inject unsubscribe URL into template context before render
  const html = await renderAsync(opts.template)
    .then(h => h.replace('{{unsubscribe_url}}', unsubUrl))

  // 4. Send via SES
  await ses.send(new SendEmailCommand({
    Source: `Digital FTE <noreply@${await getSecret('SES_DOMAIN')}>`,
    Destination: { ToAddresses: [opts.to] },
    Message: {
      Subject: { Data: opts.subject, Charset: 'UTF-8' },
      Body: { Html: { Data: html, Charset: 'UTF-8' } },
    },
    // CAN-SPAM & RFC 8058 compliance headers
    Headers: [
      { Name: 'List-Unsubscribe', Value: `<${unsubUrl}>, <mailto:unsubscribe@digitalfte.com?subject=unsubscribe>` },
      { Name: 'List-Unsubscribe-Post', Value: 'List-Unsubscribe=One-Click' },
      { Name: 'X-Email-Category', Value: opts.category },
    ],
    // SES configuration set for tracking
    ConfigurationSetName: 'digital-fte-emails',
  }))
}
```

## Email Template Registry

```typescript
// 11 approved email templates — do not create outside this list without approval
export const EMAIL_TEMPLATES = {
  WELCOME:                  'welcome',
  EMAIL_VERIFICATION:       'email-verification',
  PASSWORD_RESET:           'password-reset',
  WEEKLY_JOB_DIGEST:        'weekly-job-digest',     // Subscription — check suppression
  JOB_ALERT:                'job-alert',             // Subscription — check suppression
  RESUME_SCORE_REPORT:      'resume-score-report',
  APPLICATION_SUBMITTED:    'application-submitted',  // Transactional — always send
  APPLICATION_STATUS_UPDATE:'application-status',
  INTERVIEW_REMINDER:       'interview-reminder',
  PLAN_UPGRADE_CONFIRMATION:'plan-upgrade',
  MONTHLY_PROGRESS_REPORT:  'monthly-progress',      // Subscription — check suppression
} as const
```

## Rules

- ALL outbound emails MUST have List-Unsubscribe header (CAN-SPAM + RFC 8058)
- ALWAYS check suppression list before sending subscription emails (digest, alerts, reports)
- Transactional emails (welcome, password reset, application-submitted) bypass suppression
- NEVER hardcode unsubscribe URLs — always generate with signed token per user
- Images must use absolute CDN URLs (cdn.digitalfte.com) — never relative paths
- Test every template with React Email preview before deploying: `npx react-email dev`
- SES bounce/complaint webhooks must update suppression list automatically
