# Agent Input/Output Contracts
# Reference document — load with @docs/agent-contracts.md when building agents

## 1. Job Search Agent Contract

### Input Schema
```typescript
type JobSearchInput = {
  userId: string;
  query: string;                          // e.g. "senior product manager"
  location?: string;                      // e.g. "Dubai" or "remote"
  filters?: {
    salaryMin?: number;
    salaryMax?: number;
    jobType?: ('full-time' | 'part-time' | 'contract' | 'freelance')[];
    remote?: boolean;
    experienceLevel?: ('entry' | 'mid' | 'senior' | 'executive')[];
    datePosted?: '24h' | 'week' | 'month';
    excludeApplied?: boolean;             // default: true
  };
  platforms?: SupportedPlatform[];       // default: all user-enabled platforms
  maxResults?: number;                   // default: 50, max: 200
};
```

### Output Schema
```typescript
type JobSearchOutput = {
  jobs: JobMatch[];
  total: number;
  searchId: string;                      // Store for dedup reference
  processingTime: number;                // ms
  platformsSearched: PlatformResult[];   // Which platforms returned results
  suggestedJobTitles?: string[];         // Related titles user might try
};

type JobMatch = {
  id: string;
  externalId: string;
  platform: SupportedPlatform;
  title: string;
  company: CompanyInfo;
  location: string;
  salary?: { min: number; max: number; currency: string; period: string };
  description: string;
  postedAt: Date;
  applicationUrl: string;
  matchScore: number;                    // 0-100
  matchBreakdown: {
    skills: number;
    experienceLevel: number;
    location: number;
    salary: number;
    industry: number;
    careerTrajectory: number;
  };
  isGhostJob: boolean;
  insiderConnections: LinkedInConnection[];
  atsType?: string;                      // Workday / Greenhouse / etc.
};
```

### Supported Platforms Enum
```typescript
type SupportedPlatform =
  | 'linkedin' | 'indeed' | 'glassdoor' | 'monster'
  | 'greenhouse' | 'lever' | 'workday' | 'taleo' | 'icims'
  | 'naukrigulf' | 'bayt' | 'rozee_pk' | 'naukri'
  | 'reed_co_uk' | 'totaljobs' | 'stepstone';
```

## 2. Resume Builder Agent Contract

### Input Schema
```typescript
type ResumeBuildInput =
  | { mode: 'upload'; fileUrl: string; userId: string }
  | { mode: 'linkedin'; profileUrl: string; userId: string }
  | { mode: 'form'; formData: ResumeFormData; userId: string }
  | { mode: 'voice'; audioUrl: string; userId: string };

type ResumeTailorInput = {
  resumeProfileId: string;
  jobListingId: string;
  userId: string;
};
```

### Output Schema
```typescript
type ResumeOptimizationOutput = {
  resumeProfileId: string;
  atsScore: number;                      // 0-100
  checkpoints: ATSCheckpoint[];          // 23 items
  changes: ResumeChange[];               // What was modified
  pdfUrl: string;                        // S3 pre-signed URL
  docxUrl: string;                       // S3 pre-signed URL
  coverLetterText?: string;
  processingTime: number;
};

type ATSCheckpoint = {
  id: string;                            // e.g. "no_tables", "keyword_density"
  name: string;
  passed: boolean;
  score: number;                         // 0-10 for this checkpoint
  issue?: string;                        // What's wrong
  fix?: string;                          // How to fix it
};
```

## 3. Auto-Apply Agent Contract

### Input Schema
```typescript
type ApplicationQueueItem = {
  userId: string;
  jobListingId: string;
  resumeProfileId: string;
  coverLetterText?: string;
  scheduledAt?: Date;                    // null = apply after approval
};

type ApplicationApproval = {
  reviewId: string;
  userId: string;
  approved: boolean;
  skipReason?: string;
  edits?: {
    coverLetterText?: string;
    screeningAnswers?: Record<string, string>;  // questionId → answer override
  };
};
```

### Browser Automation State Machine States
```
QUEUED → REVIEW_PENDING → [APPROVED | SKIPPED]
APPROVED → BROWSER_INIT → NAVIGATING → FORM_FILLING → SUBMITTING → [SUCCESS | FAILED]
FAILED → RETRY (max 2) → FAILED_PERMANENT
```

## 4. Notification Agent Contract

### Channel Message Schema
```typescript
type ChannelMessage = {
  userId: string;
  channels: ('email' | 'whatsapp' | 'telegram' | 'push')[];
  templateId: string;
  templateVars: Record<string, string | number>;
  priority: 'instant' | 'scheduled';
  scheduledAt?: Date;
  dedupeKey?: string;                    // Prevent duplicate sends
};
```

## 5. Platform Rate Limits (Current as of 2026-03)
```typescript
export const PLATFORM_LIMITS = {
  linkedin:      { daily: 50,  delayMinSeconds: 300 },  // 5 min between applies
  indeed:        { daily: 40,  delayMinSeconds: 360 },
  glassdoor:     { daily: 30,  delayMinSeconds: 480 },
  naukrigulf:    { daily: 25,  delayMinSeconds: 420 },
  bayt:          { daily: 25,  delayMinSeconds: 420 },
  workday:       { daily: 20,  delayMinSeconds: 600 },
  taleo:         { daily: 20,  delayMinSeconds: 600 },
  global_daily:  { max: 150 },                           // Hard stop across all platforms
} as const;
```
