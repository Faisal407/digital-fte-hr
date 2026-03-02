/**
 * Shared TypeScript types and interfaces
 */

import type { PlanTier, ApplicationStatus, Channel, JobPlatform, Language } from "@packages/db";

// ============================================================================
// API RESPONSE TYPES
// ============================================================================

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: Record<string, unknown>;
  };
  meta?: {
    timestamp: string;
    correlationId?: string;
    requestId?: string;
  };
}

export interface ApiErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    details?: Record<string, unknown>;
    stack?: string;
  };
  meta?: {
    timestamp: string;
    correlationId?: string;
    requestId?: string;
  };
}

export interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    hasMore: boolean;
  };
  meta?: {
    timestamp: string;
    correlationId?: string;
  };
}

// ============================================================================
// JOB SEARCH TYPES
// ============================================================================

export interface JobSearchInput {
  userId: string;
  targetRoles?: string[];
  targetLocations?: string[];
  targetIndustries?: string[];
  targetCompanies?: string[];
  excludeCompanies?: string[];
  salaryMin?: number;
  salaryMax?: number;
  workType?: ("remote" | "hybrid" | "onsite")[];
  platforms?: JobPlatform[];
  limit?: number;
  skipPlatforms?: JobPlatform[];
}

export interface JobMatch {
  jobId: string;
  title: string;
  company: string;
  location: string;
  description: string;
  salary?: string;
  platform: JobPlatform;
  platformUrl: string;
  postedDate?: Date;
  matchScore: number; // 0-100
  scoreBreakdown: {
    semanticScore: number;
    skillsMatch: number;
    roleMatch: number;
    locationMatch: number;
  };
  isGhostJob?: boolean;
  applicationCount?: number;
}

export interface SearchResults {
  matches: JobMatch[];
  totalFound: number;
  platformsSearched: JobPlatform[];
  platformsFailed: { platform: JobPlatform; reason: string }[];
  deduplicatedCount: number;
  completedAt: Date;
}

// ============================================================================
// RESUME TYPES
// ============================================================================

export interface ResumeProfile {
  id: string;
  userId: string;
  title: string;
  sourceType: "upload" | "linkedin" | "form" | "voice";
  s3BucketUrl?: string;
  atsScore?: number;
  currentVersion: number;
  fullName?: string;
  email?: string;
  phoneNumber?: string;
  location?: string;
  summary?: string;
  skills: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface ResumeOptimizationResult {
  resumeId: string;
  previousAtsScore: number;
  newAtsScore: number;
  scoreImprovement: number;
  changes: {
    agent: string;
    originalText: string;
    improvedText: string;
    rationale: string;
    impact: "high" | "medium" | "low";
  }[];
  s3BucketUrl: string;
  exportFormats: ("pdf" | "docx" | "txt")[];
}

export interface AtsScoreResult {
  score: number; // 0-100
  level: "RED" | "YELLOW" | "GREEN";
  checkpoints: {
    name: string;
    status: "pass" | "fail" | "warning";
    impact: number; // Contribution to score
    suggestion?: string;
  }[];
  blockers?: string[];
}

// ============================================================================
// APPLICATION TYPES
// ============================================================================

export interface JobApplicationInput {
  userId: string;
  jobId: string;
  resumeId: string;
  source: "manual" | "auto_apply";
}

export interface ApplicationReviewGate {
  applicationId: string;
  jobId: string;
  jobTitle: string;
  company: string;
  formAnswers: {
    questionId: string;
    questionText: string;
    answer: string;
    source: "user_provided" | "auto_generated" | "extracted";
    confidence?: number;
    requiresUserReview?: boolean;
  }[];
  screenshotUrl?: string;
  expiresAt: Date;
}

export interface ApplicationSubmissionInput {
  applicationId: string;
  approved: boolean;
  overrides?: Record<string, string>; // User corrections
}

export interface ApplicationStatus {
  applicationId: string;
  status: ApplicationStatus;
  updatedAt: Date;
  viewedByEmployer?: boolean;
  shortlistedAt?: Date;
  rejectedAt?: Date;
  feedback?: string;
}

// ============================================================================
// CHANNEL TYPES
// ============================================================================

export interface ChannelMessage {
  channel: Channel;
  recipient: string; // phone, email, telegram_id, etc.
  templateName: string;
  variables: Record<string, string | number>;
  priority?: "high" | "normal" | "low";
  scheduledFor?: Date;
  supportsAction?: boolean; // Can user respond/click
}

export interface ChannelDeliveryResult {
  messageId: string;
  channel: Channel;
  recipient: string;
  status: "sent" | "failed" | "suppressed" | "deferred";
  sentAt?: Date;
  failureReason?: string;
  deferredUntil?: Date;
}

export interface WebhookPayload {
  channel: Channel;
  event: string;
  payload: Record<string, unknown>;
  timestamp: Date;
}

// ============================================================================
// PLAN & BILLING TYPES
// ============================================================================

export interface PlanLimits {
  dailyAutoApplies: number;
  maxResumes: number;
  resumeOptimizationRequests: number;
  searchFrequency: "unlimited" | "daily" | "weekly";
  priorityQueue: boolean;
  supportLevel: "community" | "email" | "priority";
}

export const PLAN_LIMITS: Record<PlanTier, PlanLimits> = {
  free: {
    dailyAutoApplies: 0,
    maxResumes: 1,
    resumeOptimizationRequests: 3,
    searchFrequency: "daily",
    priorityQueue: false,
    supportLevel: "community",
  },
  pro: {
    dailyAutoApplies: 50,
    maxResumes: 5,
    resumeOptimizationRequests: 20,
    searchFrequency: "unlimited",
    priorityQueue: false,
    supportLevel: "email",
  },
  elite: {
    dailyAutoApplies: 150,
    maxResumes: 15,
    resumeOptimizationRequests: "unlimited" as never,
    searchFrequency: "unlimited",
    priorityQueue: true,
    supportLevel: "priority",
  },
};

// ============================================================================
// ERROR TYPES
// ============================================================================

export interface ErrorContext {
  correlationId: string;
  userId?: string;
  service: string;
  action: string;
  timestamp: Date;
}

export class AppError extends Error {
  constructor(
    public code: string,
    public message: string,
    public statusCode: number = 400,
    public details?: Record<string, unknown>
  ) {
    super(message);
    this.name = "AppError";
  }
}

// ============================================================================
// AUTH TYPES
// ============================================================================

export interface JwtPayload {
  sub: string; // user ID
  email: string;
  cognitoId: string;
  planTier: PlanTier;
  iat: number;
  exp: number;
}

export interface AuthContext {
  userId: string;
  email: string;
  cognitoId: string;
  planTier: PlanTier;
  isAuthenticated: boolean;
}

// ============================================================================
// RATE LIMIT TYPES
// ============================================================================

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: Date;
  retryAfter?: number;
}

export interface TokenBucket {
  tokens: number;
  capacity: number;
  lastRefillAt: number;
}

// ============================================================================
// AGENT TYPES
// ============================================================================

export interface AgentState {
  correlationId: string;
  userId: string;
  planTier: PlanTier;
  status: "pending" | "processing" | "completed" | "failed";
  input: Record<string, unknown>;
  output?: Record<string, unknown>;
  error?: {
    code: string;
    message: string;
  };
  startedAt: Date;
  completedAt?: Date;
}

export interface ToolCall {
  toolName: string;
  input: Record<string, unknown>;
  result?: unknown;
  error?: string;
}

// ============================================================================
// AUDIT TYPES
// ============================================================================

export interface AuditEntry {
  correlationId: string;
  userId: string;
  action: string;
  agent: string;
  status: "started" | "completed" | "failed";
  inputData?: Record<string, unknown>;
  outputData?: Record<string, unknown>;
  resultCode?: string;
  resultMessage?: string;
  errorStack?: string;
  context?: Record<string, unknown>;
  timestamp: Date;
}
