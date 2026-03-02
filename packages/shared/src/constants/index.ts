/**
 * Shared constants - Single source of truth
 * Never hardcode these values, always import from here
 */

// ============================================================================
// ATS SCORE THRESHOLDS
// ============================================================================

export const ATS_THRESHOLDS = {
  RED: 60, // Block export, mandatory improvement
  YELLOW: 75, // Warn user
  GREEN: 100, // Allow export
} as const;

export const ATS_SCORE_LEVELS = {
  RED: { min: 0, max: 59, label: "Needs Improvement", color: "#ef4444" },
  YELLOW: {
    min: 60,
    max: 74,
    label: "Good",
    color: "#eab308",
  },
  GREEN: { min: 75, max: 100, label: "Excellent", color: "#22c55e" },
} as const;

// ============================================================================
// AUTO-APPLY LIMITS
// ============================================================================

export const AUTO_APPLY_LIMITS = {
  FREE_TIER: 0,
  PRO_TIER: 50,
  ELITE_TIER: 150,
  GLOBAL_HARD_CAP: 150, // No plan can exceed this
} as const;

export const AUTO_APPLY_CONFIG = {
  REVIEW_GATE_TTL_SECONDS: 3600, // 1 hour to review before expiry
  MAX_RETRIES_ON_FAILURE: 2,
  SCREENSHOT_RETENTION_DAYS: 30, // For dispute evidence
  SESSION_REUSE_TTL_MINUTES: 30,
  MAX_CONCURRENT_BROWSERS: 3,
  CAPTCHA_DETECTION_PAUSE_MINUTES: 5, // Wait for user to solve
} as const;

// ============================================================================
// JOB PLATFORM LIMITS
// ============================================================================

export const PLATFORM_LIMITS = {
  linkedin: {
    dailyLimit: 50,
    requestsPerHour: 10,
    searchDelay: 100, // ms between requests
    scrapeMethod: "api", // api or playwright
  },
  indeed: {
    dailyLimit: 100,
    requestsPerHour: 20,
    searchDelay: 50,
    scrapeMethod: "api",
  },
  glassdoor: {
    dailyLimit: 100,
    requestsPerHour: 15,
    searchDelay: 100,
    scrapeMethod: "playwright",
  },
  monster: {
    dailyLimit: 100,
    requestsPerHour: 15,
    searchDelay: 100,
    scrapeMethod: "api",
  },
  naukrigulf: {
    dailyLimit: 100,
    requestsPerHour: 10,
    searchDelay: 200,
    scrapeMethod: "playwright",
  },
  bayt: {
    dailyLimit: 100,
    requestsPerHour: 10,
    searchDelay: 200,
    scrapeMethod: "playwright",
  },
  rozee_pk: {
    dailyLimit: 100,
    requestsPerHour: 10,
    searchDelay: 200,
    scrapeMethod: "playwright",
  },
  naukri: {
    dailyLimit: 100,
    requestsPerHour: 10,
    searchDelay: 200,
    scrapeMethod: "playwright",
  },
  reed_co_uk: {
    dailyLimit: 100,
    requestsPerHour: 15,
    searchDelay: 100,
    scrapeMethod: "api",
  },
  totaljobs: {
    dailyLimit: 100,
    requestsPerHour: 15,
    searchDelay: 100,
    scrapeMethod: "api",
  },
  stepstone: {
    dailyLimit: 100,
    requestsPerHour: 15,
    searchDelay: 100,
    scrapeMethod: "api",
  },
  greenhouse: {
    dailyLimit: 100,
    requestsPerHour: 20,
    searchDelay: 50,
    scrapeMethod: "api",
  },
  lever: {
    dailyLimit: 100,
    requestsPerHour: 20,
    searchDelay: 50,
    scrapeMethod: "api",
  },
  workday: {
    dailyLimit: 50,
    requestsPerHour: 10,
    searchDelay: 500, // Very slow, rate limited
    scrapeMethod: "playwright",
  },
  taleo: {
    dailyLimit: 50,
    requestsPerHour: 10,
    searchDelay: 500,
    scrapeMethod: "playwright",
  },
  icims: {
    dailyLimit: 100,
    requestsPerHour: 15,
    searchDelay: 200,
    scrapeMethod: "playwright",
  },
} as const;

// ============================================================================
// ERROR CODES
// ============================================================================

export const ERROR_CODES = {
  // Auth errors
  AUTH_REQUIRED: "AUTH_REQUIRED",
  INVALID_CREDENTIALS: "INVALID_CREDENTIALS",
  TOKEN_EXPIRED: "TOKEN_EXPIRED",
  FORBIDDEN: "FORBIDDEN",

  // Validation errors
  VALIDATION_ERROR: "VALIDATION_ERROR",
  INVALID_INPUT: "INVALID_INPUT",
  MISSING_FIELD: "MISSING_FIELD",

  // Plan limits
  PLAN_LIMIT_EXCEEDED: "PLAN_LIMIT_EXCEEDED",
  INSUFFICIENT_PLAN: "INSUFFICIENT_PLAN",
  DAILY_LIMIT_EXCEEDED: "DAILY_LIMIT_EXCEEDED",

  // Job search errors
  NO_JOBS_FOUND: "NO_JOBS_FOUND",
  SEARCH_FAILED: "SEARCH_FAILED",
  PLATFORM_UNAVAILABLE: "PLATFORM_UNAVAILABLE",
  SCRAPER_ERROR: "SCRAPER_ERROR",
  DEDUPLICATION_FAILED: "DEDUPLICATION_FAILED",

  // Resume errors
  RESUME_NOT_FOUND: "RESUME_NOT_FOUND",
  INVALID_RESUME_FORMAT: "INVALID_RESUME_FORMAT",
  RESUME_TOO_LARGE: "RESUME_TOO_LARGE",
  ATS_SCORING_FAILED: "ATS_SCORING_FAILED",
  RESUME_OPTIMIZATION_FAILED: "RESUME_OPTIMIZATION_FAILED",

  // Application errors
  APPLICATION_NOT_FOUND: "APPLICATION_NOT_FOUND",
  JOB_NOT_FOUND: "JOB_NOT_FOUND",
  ALREADY_APPLIED: "ALREADY_APPLIED",
  FORM_FILL_FAILED: "FORM_FILL_FAILED",
  SUBMISSION_FAILED: "SUBMISSION_FAILED",
  CAPTCHA_DETECTED: "CAPTCHA_DETECTED",
  APPROVAL_REQUIRED: "APPROVAL_REQUIRED",
  APPROVAL_EXPIRED: "APPROVAL_EXPIRED",

  // Channel errors
  CHANNEL_NOT_FOUND: "CHANNEL_NOT_FOUND",
  MESSAGE_SEND_FAILED: "MESSAGE_SEND_FAILED",
  INVALID_RECIPIENT: "INVALID_RECIPIENT",
  CHANNEL_SUPPRESSED: "CHANNEL_SUPPRESSED",
  QUIET_HOURS_ACTIVE: "QUIET_HOURS_ACTIVE",

  // System errors
  INTERNAL_ERROR: "INTERNAL_ERROR",
  DATABASE_ERROR: "DATABASE_ERROR",
  EXTERNAL_API_ERROR: "EXTERNAL_API_ERROR",
  TIMEOUT: "TIMEOUT",
  RATE_LIMIT: "RATE_LIMIT",

  // GDPR errors
  DELETION_IN_PROGRESS: "DELETION_IN_PROGRESS",
  DELETION_FAILED: "DELETION_FAILED",

  // LLM errors
  LLM_API_ERROR: "LLM_API_ERROR",
  LLM_RATE_LIMIT: "LLM_RATE_LIMIT",
  LLM_TIMEOUT: "LLM_TIMEOUT",
  LLM_VALIDATION_FAILED: "LLM_VALIDATION_FAILED",
} as const;

// ============================================================================
// HTTP STATUS CODES
// ============================================================================

export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  ACCEPTED: 202,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  UNPROCESSABLE_ENTITY: 422,
  TOO_MANY_REQUESTS: 429,
  INTERNAL_SERVER_ERROR: 500,
  SERVICE_UNAVAILABLE: 503,
} as const;

export const ERROR_CODE_TO_STATUS: Record<string, number> = {
  // Auth
  [ERROR_CODES.AUTH_REQUIRED]: 401,
  [ERROR_CODES.INVALID_CREDENTIALS]: 401,
  [ERROR_CODES.TOKEN_EXPIRED]: 401,
  [ERROR_CODES.FORBIDDEN]: 403,

  // Validation
  [ERROR_CODES.VALIDATION_ERROR]: 422,
  [ERROR_CODES.INVALID_INPUT]: 422,
  [ERROR_CODES.MISSING_FIELD]: 422,

  // Plan limits
  [ERROR_CODES.PLAN_LIMIT_EXCEEDED]: 429,
  [ERROR_CODES.INSUFFICIENT_PLAN]: 402,
  [ERROR_CODES.DAILY_LIMIT_EXCEEDED]: 429,

  // Job search
  [ERROR_CODES.NO_JOBS_FOUND]: 404,
  [ERROR_CODES.SEARCH_FAILED]: 500,
  [ERROR_CODES.PLATFORM_UNAVAILABLE]: 503,
  [ERROR_CODES.SCRAPER_ERROR]: 500,
  [ERROR_CODES.DEDUPLICATION_FAILED]: 500,

  // Resume
  [ERROR_CODES.RESUME_NOT_FOUND]: 404,
  [ERROR_CODES.INVALID_RESUME_FORMAT]: 422,
  [ERROR_CODES.RESUME_TOO_LARGE]: 413,
  [ERROR_CODES.ATS_SCORING_FAILED]: 500,
  [ERROR_CODES.RESUME_OPTIMIZATION_FAILED]: 500,

  // Application
  [ERROR_CODES.APPLICATION_NOT_FOUND]: 404,
  [ERROR_CODES.JOB_NOT_FOUND]: 404,
  [ERROR_CODES.ALREADY_APPLIED]: 409,
  [ERROR_CODES.FORM_FILL_FAILED]: 500,
  [ERROR_CODES.SUBMISSION_FAILED]: 500,
  [ERROR_CODES.CAPTCHA_DETECTED]: 429,
  [ERROR_CODES.APPROVAL_REQUIRED]: 202,
  [ERROR_CODES.APPROVAL_EXPIRED]: 410,

  // Channel
  [ERROR_CODES.CHANNEL_NOT_FOUND]: 404,
  [ERROR_CODES.MESSAGE_SEND_FAILED]: 500,
  [ERROR_CODES.INVALID_RECIPIENT]: 400,
  [ERROR_CODES.CHANNEL_SUPPRESSED]: 400,
  [ERROR_CODES.QUIET_HOURS_ACTIVE]: 429,

  // Default
  [ERROR_CODES.INTERNAL_ERROR]: 500,
  [ERROR_CODES.DATABASE_ERROR]: 500,
  [ERROR_CODES.EXTERNAL_API_ERROR]: 502,
  [ERROR_CODES.TIMEOUT]: 504,
  [ERROR_CODES.RATE_LIMIT]: 429,
};

// ============================================================================
// TIME CONSTANTS
// ============================================================================

export const TIME = {
  SECOND: 1000,
  MINUTE: 60 * 1000,
  HOUR: 60 * 60 * 1000,
  DAY: 24 * 60 * 60 * 1000,
  WEEK: 7 * 24 * 60 * 60 * 1000,
  MONTH: 30 * 24 * 60 * 60 * 1000,
  YEAR: 365 * 24 * 60 * 60 * 1000,
} as const;

// ============================================================================
// NOTIFICATION CONFIG
// ============================================================================

export const NOTIFICATION_CONFIG = {
  QUIET_HOURS_START_MINUTE: 1380, // 23:00 (11 PM)
  QUIET_HOURS_END_MINUTE: 420, // 07:00 (7 AM)
  DEDUP_TTL_SECONDS: 300, // 5 minutes
  RETRY_MAX_ATTEMPTS: 3,
  RETRY_BACKOFF_MULTIPLIER: 2,
} as const;

// ============================================================================
// GHOST JOB DETECTION
// ============================================================================

export const GHOST_JOB_CONFIG = {
  DAYS_POSTED_THRESHOLD: 30, // Job posted >30 days = ghost job
  REPOST_DETECTION_WINDOW_DAYS: 7, // Check if reposted within 7 days
  MAX_APPLICATIONS_FOR_REAL_JOB: 500, // Jobs with >500 apps likely real
} as const;

// ============================================================================
// LLM CONFIG
// ============================================================================

export const LLM_MODELS = {
  SONNET: "claude-3-5-sonnet-20241022", // Complex reasoning, generation
  HAIKU: "claude-haiku-4-5-20251001", // Fast, cheap scoring/classification
  OPUS: "claude-3-opus-20250805", // Most capable (fallback)
} as const;

export const LLM_CONFIG = {
  MAX_RETRIES: 3,
  RETRY_DELAY_MS: 1000,
  EXPONENTIAL_BACKOFF: true,
  TIMEOUT_MS: 30000,
  RATE_LIMIT_PER_MINUTE: 100,
} as const;

// ============================================================================
// STORAGE CONFIG
// ============================================================================

export const STORAGE_CONFIG = {
  MAX_RESUME_SIZE_BYTES: 5 * 1024 * 1024, // 5 MB
  MAX_SCREENSHOT_SIZE_BYTES: 2 * 1024 * 1024, // 2 MB
  MAX_VOICE_RECORDING_SIZE_BYTES: 10 * 1024 * 1024, // 10 MB
  VOICE_RETENTION_DAYS: 1, // Auto-delete after transcription
  SCREENSHOT_RETENTION_DAYS: 30,
} as const;

// ============================================================================
// REGEX PATTERNS
// ============================================================================

export const REGEX_PATTERNS = {
  EMAIL: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  PHONE: /^\+?[1-9]\d{1,14}$/,
  URL: /^https?:\/\/[^\s]+$/,
  SALARY: /\$?[\d,]+(?:\.\d{2})?(?:\s*-\s*\$?[\d,]+(?:\.\d{2})?)?/,
  JOB_ID: /^[a-zA-Z0-9-_]+$/,
} as const;

// ============================================================================
// LOCALE CONFIG
// ============================================================================

export const SUPPORTED_LANGUAGES = {
  en: "English",
  es: "Español",
  pt: "Português",
  ar: "العربية",
  ur: "اردو",
} as const;

export const TIMEZONE_DEFAULTS = {
  US: "America/New_York",
  UK: "Europe/London",
  EU: "Europe/Berlin",
  MIDDLE_EAST: "Asia/Dubai",
  SOUTH_ASIA: "Asia/Karachi",
} as const;
