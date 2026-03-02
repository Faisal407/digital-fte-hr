/**
 * Zod validation schemas for API inputs and LLM outputs
 * Single source of truth for all validation
 */

import { z } from "zod";

// ============================================================================
// COMMON SCHEMAS
// ============================================================================

export const UUIDSchema = z.string().uuid();
export const EmailSchema = z.string().email().toLowerCase();
export const PhoneSchema = z.string().regex(/^\+?[1-9]\d{1,14}$/);
export const UrlSchema = z.string().url();
export const NonEmptyString = z.string().min(1).max(500);

// ============================================================================
// API REQUEST SCHEMAS
// ============================================================================

export const JobSearchInputSchema = z.object({
  targetRoles: z.array(NonEmptyString).optional(),
  targetLocations: z.array(NonEmptyString).optional(),
  targetIndustries: z.array(NonEmptyString).optional(),
  targetCompanies: z.array(NonEmptyString).optional(),
  excludeCompanies: z.array(NonEmptyString).optional(),
  salaryMin: z.number().int().nonnegative().optional(),
  salaryMax: z.number().int().nonnegative().optional(),
  workType: z.array(z.enum(["remote", "hybrid", "onsite"])).optional(),
  platforms: z
    .array(
      z.enum([
        "linkedin",
        "indeed",
        "glassdoor",
        "monster",
        "naukrigulf",
        "bayt",
        "rozee_pk",
        "naukri",
        "reed_co_uk",
        "totaljobs",
        "stepstone",
        "greenhouse",
        "lever",
        "workday",
        "taleo",
        "icims",
      ])
    )
    .optional(),
  limit: z.number().int().min(1).max(100).default(20),
  skipPlatforms: z.array(z.string()).optional(),
});

export const ResumeUploadSchema = z.object({
  title: NonEmptyString,
  file: z.instanceof(File).refine((f) => f.size <= 5 * 1024 * 1024, {
    message: "File size must be less than 5MB",
  }),
  sourceType: z.enum(["upload", "linkedin", "form", "voice"]),
});

export const ApplicationSubmissionSchema = z.object({
  applicationId: UUIDSchema,
  approved: z.boolean(),
  overrides: z.record(z.string()).optional(),
});

export const ChannelSubscriptionSchema = z.object({
  channel: z.enum(["whatsapp", "telegram", "email", "push"]),
  identifier: z.string(),
  preferences: z.object({
    jobAlerts: z.boolean().default(true),
    applicationUpdates: z.boolean().default(true),
    weeklyReport: z.boolean().default(true),
    promotional: z.boolean().default(false),
  }),
});

// ============================================================================
// LLM OUTPUT SCHEMAS
// ============================================================================

export const JobMatchSchema = z.object({
  jobId: z.string(),
  title: NonEmptyString,
  company: NonEmptyString,
  location: NonEmptyString,
  description: NonEmptyString,
  salary: z.string().optional(),
  platform: z.string(),
  platformUrl: UrlSchema,
  postedDate: z.date().optional(),
  matchScore: z.number().int().min(0).max(100),
  scoreBreakdown: z.object({
    semanticScore: z.number().int().min(0).max(100),
    skillsMatch: z.number().int().min(0).max(100),
    roleMatch: z.number().int().min(0).max(100).optional(),
    locationMatch: z.number().int().min(0).max(100).optional(),
  }),
  isGhostJob: z.boolean().optional(),
  applicationCount: z.number().nonnegative().optional(),
});

export const SearchResultsSchema = z.object({
  matches: z.array(JobMatchSchema),
  totalFound: z.number().nonnegative(),
  platformsSearched: z.array(z.string()),
  platformsFailed: z
    .array(
      z.object({
        platform: z.string(),
        reason: NonEmptyString,
      })
    )
    .optional(),
  deduplicatedCount: z.number().nonnegative(),
  completedAt: z.date(),
});

export const AtsScoreSchema = z.object({
  score: z.number().int().min(0).max(100),
  level: z.enum(["RED", "YELLOW", "GREEN"]),
  checkpoints: z.array(
    z.object({
      name: NonEmptyString,
      status: z.enum(["pass", "fail", "warning"]),
      impact: z.number().int().min(0).max(100),
      suggestion: z.string().optional(),
    })
  ),
  blockers: z.array(z.string()).optional(),
});

export const ResumeOptimizationSchema = z.object({
  resumeId: UUIDSchema,
  previousAtsScore: z.number().int().min(0).max(100),
  newAtsScore: z.number().int().min(0).max(100),
  scoreImprovement: z.number(),
  changes: z.array(
    z.object({
      agent: z.string(),
      originalText: z.string(),
      improvedText: z.string(),
      rationale: z.string(),
      impact: z.enum(["high", "medium", "low"]),
    })
  ),
  exportFormats: z.array(z.enum(["pdf", "docx", "txt"])),
});

export const ApplicationReviewGateSchema = z.object({
  applicationId: UUIDSchema,
  jobId: UUIDSchema,
  jobTitle: NonEmptyString,
  company: NonEmptyString,
  formAnswers: z.array(
    z.object({
      questionId: z.string(),
      questionText: NonEmptyString,
      answer: NonEmptyString,
      source: z.enum(["user_provided", "auto_generated", "extracted"]),
      confidence: z.number().min(0).max(1).optional(),
      requiresUserReview: z.boolean().optional(),
    })
  ),
  screenshotUrl: UrlSchema.optional(),
  expiresAt: z.date(),
});

// ============================================================================
// NOTIFICATION SCHEMAS
// ============================================================================

export const ChannelMessageSchema = z.object({
  channel: z.enum(["whatsapp", "telegram", "email", "push"]),
  recipient: z.string(),
  templateName: NonEmptyString,
  variables: z.record(z.union([z.string(), z.number()])),
  priority: z.enum(["high", "normal", "low"]).optional(),
  scheduledFor: z.date().optional(),
  supportsAction: z.boolean().optional(),
});

// ============================================================================
// PAGINATION SCHEMAS
// ============================================================================

export const PaginationSchema = z.object({
  page: z.number().int().min(1).default(1),
  pageSize: z.number().int().min(1).max(100).default(20),
});

// ============================================================================
// ERROR SCHEMAS
// ============================================================================

export const ApiErrorSchema = z.object({
  code: z.string(),
  message: z.string(),
  details: z.record(z.unknown()).optional(),
});

// ============================================================================
// VALIDATION HELPER
// ============================================================================

export function validate<T>(schema: z.ZodSchema, data: unknown): T {
  return schema.parse(data) as T;
}

export function safeValidate<T>(schema: z.ZodSchema, data: unknown) {
  const result = schema.safeParse(data);
  return {
    success: result.success,
    data: result.success ? (result.data as T) : null,
    errors: result.success ? null : result.error.flatten(),
  };
}
