/**
 * App Constants
 * Colors, limits, platform names, and other configuration
 */

// ATS Score Thresholds
export const ATS_SCORE_THRESHOLDS = {
  RED: 60, // <60: block export
  YELLOW: 75, // 60-74: warn
  GREEN: 75, // 75+: optimized
} as const;

// Plan Tier Limits
export const PLAN_LIMITS = {
  free: {
    applyDailyLimit: 0,
    resumeCount: 1,
    optimization: false,
    reporting: false,
    jobSearch: true,
  },
  pro: {
    applyDailyLimit: 50,
    resumeCount: 10,
    optimization: true,
    reporting: false,
    jobSearch: true,
  },
  elite: {
    applyDailyLimit: 150,
    resumeCount: 999,
    optimization: true,
    reporting: true,
    jobSearch: true,
  },
} as const;

// Job Platforms
export const PLATFORMS = {
  linkedin: { name: 'LinkedIn', color: '#0A66C2', icon: '💼' },
  indeed: { name: 'Indeed', color: '#003580', icon: '🔍' },
  glassdoor: { name: 'Glassdoor', color: '#667398', icon: '⭐' },
  monster: { name: 'Monster', color: '#009900', icon: '👹' },
  greenhouse: { name: 'Greenhouse', color: '#34C759', icon: '🌱' },
  lever: { name: 'Lever', color: '#667EEA', icon: '🔗' },
  workday: { name: 'Workday', color: '#3C6FFF', icon: '📋' },
  taleo: { name: 'Oracle Taleo', color: '#F80000', icon: '📊' },
  icims: { name: 'iCIMS', color: '#FF6B6B', icon: '🏢' },
  naukrigulf: { name: 'NaukriGulf', color: '#0080D0', icon: '🌍' },
  bayt: { name: 'Bayt.com', color: '#FF6B6B', icon: '🏙️' },
  rozee_pk: { name: 'Rozee.pk', color: '#4CAF50', icon: '🇵🇰' },
  naukri: { name: 'Naukri', color: '#FF6B6B', icon: '🇮🇳' },
  reed_co_uk: { name: 'Reed.co.uk', color: '#0055CC', icon: '🇬🇧' },
  totaljobs: { name: 'Total Jobs', color: '#003580', icon: '🎯' },
  stepstone: { name: 'StepStone', color: '#003580', icon: '👣' },
} as const;

export type PlatformKey = keyof typeof PLATFORMS;

// Application Status Colors
export const STATUS_COLORS = {
  pending_review: { bg: 'bg-orange-100', text: 'text-orange-800', label: 'Pending Review' },
  approved: { bg: 'bg-blue-100', text: 'text-blue-800', label: 'Approved' },
  submitted: { bg: 'bg-cyan-100', text: 'text-cyan-800', label: 'Submitted' },
  viewed: { bg: 'bg-purple-100', text: 'text-purple-800', label: 'Viewed' },
  shortlisted: { bg: 'bg-emerald-100', text: 'text-emerald-800', label: 'Shortlisted' },
  rejected: { bg: 'bg-red-100', text: 'text-red-800', label: 'Rejected' },
  skipped: { bg: 'bg-gray-100', text: 'text-gray-800', label: 'Skipped' },
  failed: { bg: 'bg-red-100', text: 'text-red-800', label: 'Failed' },
  expired: { bg: 'bg-gray-100', text: 'text-gray-800', label: 'Expired' },
} as const;

// Channel Icons & Names
export const CHANNELS = {
  whatsapp: { name: 'WhatsApp', icon: '💬', color: '#25D366' },
  telegram: { name: 'Telegram', icon: '✈️', color: '#0088CC' },
  email: { name: 'Email', icon: '📧', color: '#3B82F6' },
  push: { name: 'Push Notification', icon: '🔔', color: '#FF6B6B' },
} as const;

// Experience Levels
export const EXPERIENCE_LEVELS = [
  { value: 'entry', label: 'Entry Level' },
  { value: 'mid', label: 'Mid Level' },
  { value: 'senior', label: 'Senior' },
  { value: 'executive', label: 'Executive' },
] as const;

// Job Types
export const JOB_TYPES = [
  { value: 'full-time', label: 'Full-time' },
  { value: 'part-time', label: 'Part-time' },
  { value: 'contract', label: 'Contract' },
  { value: 'freelance', label: 'Freelance' },
] as const;

// Date Posted Filters
export const DATE_POSTED = [
  { value: '24h', label: 'Last 24 hours' },
  { value: 'week', label: 'Last week' },
  { value: 'month', label: 'Last month' },
] as const;

// Quiet Hours (11 PM - 7 AM)
export const QUIET_HOURS = {
  START: 23, // 11 PM
  END: 7, // 7 AM
} as const;

// Approval Gate Timeout (24 hours in ms)
export const APPROVAL_GATE_TIMEOUT_MS = 24 * 60 * 60 * 1000;

// Resume ATS Checkpoints Categories
export const ATS_CHECKPOINT_CATEGORIES = {
  FORMATTING: 'Formatting',
  STRUCTURE: 'Structure',
  CONTENT: 'Content',
  KEYWORDS: 'Keywords',
  DESIGN: 'Design',
} as const;

// Pagination
export const PAGINATION = {
  DEFAULT_PAGE_SIZE: 20,
  MAX_PAGE_SIZE: 100,
} as const;

// Rate Limiting
export const RATE_LIMITS = {
  JOB_SEARCH: 10, // per minute
  RESUME_OPTIMIZE: 5, // per hour
  AUTO_APPLY: 150, // per day (hard cap)
} as const;

// Navigation Menu Items
export const MAIN_MENU = [
  { label: 'Overview', href: '/dashboard', icon: '📊' },
  { label: 'Job Search', href: '/dashboard/jobs', icon: '🔍' },
  { label: 'Resumes', href: '/dashboard/resume', icon: '📄' },
  { label: 'Applications', href: '/dashboard/apply', icon: '✉️' },
  { label: 'Tracker', href: '/dashboard/tracker', icon: '📋' },
  { label: 'Analytics', href: '/dashboard/analytics/weekly', icon: '📈' },
  { label: 'Settings', href: '/dashboard/settings/profile', icon: '⚙️' },
] as const;

// Error Messages
export const ERROR_MESSAGES = {
  NETWORK_ERROR: 'Network error. Please check your connection.',
  VALIDATION_ERROR: 'Please check your input and try again.',
  UNAUTHORIZED: 'Please log in to continue.',
  FORBIDDEN: 'You do not have permission to perform this action.',
  NOT_FOUND: 'The requested resource was not found.',
  PLAN_UPGRADE_REQUIRED: 'This feature requires a plan upgrade.',
  RATE_LIMIT_EXCEEDED: 'Too many requests. Please try again later.',
  SERVER_ERROR: 'An unexpected error occurred. Please try again.',
} as const;

// Success Messages
export const SUCCESS_MESSAGES = {
  SAVED: 'Changes saved successfully.',
  CREATED: 'Created successfully.',
  DELETED: 'Deleted successfully.',
  UPLOADED: 'File uploaded successfully.',
  APPLIED: 'Application submitted successfully.',
  EMAIL_VERIFIED: 'Email verified successfully.',
} as const;

// Toast Durations (ms)
export const TOAST_DURATION = {
  SHORT: 2000,
  NORMAL: 3000,
  LONG: 5000,
  PERSISTENT: undefined, // No auto-close
} as const;

// Currencies
export const CURRENCIES = [
  { code: 'USD', symbol: '$', name: 'US Dollar' },
  { code: 'EUR', symbol: '€', name: 'Euro' },
  { code: 'GBP', symbol: '£', name: 'British Pound' },
  { code: 'AED', symbol: 'د.إ', name: 'UAE Dirham' },
  { code: 'INR', symbol: '₹', name: 'Indian Rupee' },
  { code: 'PKR', symbol: '₨', name: 'Pakistani Rupee' },
  { code: 'SAR', symbol: 'ر.س', name: 'Saudi Riyal' },
  { code: 'QAR', symbol: 'ر.ق', name: 'Qatari Riyal' },
] as const;

// Timezones (Common)
export const TIMEZONES = [
  { value: 'UTC', label: 'UTC' },
  { value: 'America/New_York', label: 'Eastern Time' },
  { value: 'America/Chicago', label: 'Central Time' },
  { value: 'America/Denver', label: 'Mountain Time' },
  { value: 'America/Los_Angeles', label: 'Pacific Time' },
  { value: 'Europe/London', label: 'London' },
  { value: 'Europe/Paris', label: 'Paris' },
  { value: 'Asia/Dubai', label: 'Dubai' },
  { value: 'Asia/Kolkata', label: 'India Standard Time' },
  { value: 'Asia/Karachi', label: 'Pakistan Standard Time' },
  { value: 'Australia/Sydney', label: 'Sydney' },
  { value: 'Asia/Tokyo', label: 'Tokyo' },
] as const;
