/**
 * Shared Types for Digital FTE Web App
 * These should align with backend types from packages/shared
 */

// User & Auth
export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phoneE164?: string;
  timezone: string;
  plan: PlanTier;
  planExpiresAt?: Date;
  status: UserStatus;
  preferredJobTitles: string[];
  preferredLocations: string[];
  salaryMin?: number;
  salaryMax?: number;
  salaryCurrency: string;
  lastActiveAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

export type PlanTier = 'free' | 'pro' | 'elite';
export type UserStatus = 'active' | 'suspended' | 'deletion_pending' | 'deleted';

// Job Search
export interface JobSearchParams {
  query: string;
  location?: string;
  filters?: {
    salaryMin?: number;
    salaryMax?: number;
    jobType?: JobType[];
    remote?: boolean;
    experienceLevel?: ExperienceLevel[];
    datePosted?: '24h' | 'week' | 'month';
    excludeApplied?: boolean;
  };
  platforms?: JobPlatform[];
  maxResults?: number;
}

export interface JobMatch {
  id: string;
  externalId: string;
  platform: JobPlatform;
  title: string;
  company: {
    name: string;
    logoUrl?: string;
  };
  location: string;
  isRemote: boolean;
  salary?: {
    min: number;
    max: number;
    currency: string;
    period: string;
  };
  description: string;
  postedAt: Date;
  applicationUrl: string;
  matchScore: number; // 0-100
  matchBreakdown: {
    skills: number;
    experienceLevel: number;
    location: number;
    salary: number;
    industry: number;
    careerTrajectory: number;
  };
  isGhostJob: boolean;
  atsType?: string;
}

export type JobType = 'full-time' | 'part-time' | 'contract' | 'freelance';
export type ExperienceLevel = 'entry' | 'mid' | 'senior' | 'executive';
export type JobPlatform =
  | 'linkedin'
  | 'indeed'
  | 'glassdoor'
  | 'monster'
  | 'greenhouse'
  | 'lever'
  | 'workday'
  | 'taleo'
  | 'icims'
  | 'naukrigulf'
  | 'bayt'
  | 'rozee_pk'
  | 'naukri'
  | 'reed_co_uk'
  | 'totaljobs'
  | 'stepstone';

// Resume
export interface ResumeProfile {
  id: string;
  userId: string;
  versionNumber: number;
  sourceType: ResumeSource;
  s3KeyOriginal?: string;
  s3KeyOptimized?: string;
  s3KeyDocx?: string;
  atsScore?: number;
  checkpoints?: ATSCheckpoint[];
  isActive: boolean;
  createdAt: Date;
}

export type ResumeSource = 'upload' | 'linkedin' | 'form' | 'voice';

export interface ATSCheckpoint {
  id: string;
  name: string;
  passed: boolean;
  score: number;
  issue?: string;
  fix?: string;
}

export interface ResumeOptimizationOutput {
  resumeProfileId: string;
  atsScore: number;
  checkpoints: ATSCheckpoint[];
  changes: ResumeChange[];
  pdfUrl: string;
  docxUrl: string;
  coverLetterText?: string;
  processingTime: number;
}

export interface ResumeChange {
  section: string;
  before: string;
  after: string;
  reason: string;
}

// Applications
export interface JobApplication {
  id: string;
  userId: string;
  jobListingId: string;
  resumeProfileId: string;
  status: ApplicationStatus;
  reviewToken?: string;
  approvedAt?: Date;
  submittedAt?: Date;
  skippedAt?: Date;
  skipReason?: string;
  coverLetterText?: string;
  s3KeyPreSubmit?: string;
  s3KeyConfirmation?: string;
  failureReason?: string;
  matchScore: number;
  source: 'auto' | 'manual';
  createdAt: Date;
  updatedAt: Date;
}

export type ApplicationStatus =
  | 'pending_review'
  | 'approved'
  | 'submitted'
  | 'viewed'
  | 'shortlisted'
  | 'rejected'
  | 'skipped'
  | 'failed'
  | 'expired';

// Channels
export type Channel = 'whatsapp' | 'telegram' | 'email' | 'push';

export interface ChannelSubscription {
  id: string;
  userId: string;
  channel: Channel;
  channelUserId?: string;
  isEnabled: boolean;
  optInAt: Date;
  optOutAt?: Date;
  preferences: Record<string, unknown>;
  createdAt: Date;
}

// API Response Envelope
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: unknown;
    retryAfter?: number;
    upgradeUrl?: string;
  };
  meta?: {
    page?: number;
    total?: number;
    processingTime?: number;
    taskId?: string;
  };
}

// Task Status (for async operations)
export interface TaskStatus {
  taskId: string;
  status: 'queued' | 'processing' | 'completed' | 'failed';
  progress: number; // 0-1
  result?: unknown;
  error?: string;
}
