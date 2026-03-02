/**
 * GDPR Registry - Maps tables containing PII to deletion handlers
 * When a user requests deletion, all tables in this registry are purged
 * in cascade order (children before parents)
 */

export const GDPR_REGISTRY = {
  // Primary user record - DELETE LAST (cascade will handle relations)
  User: {
    deletionOrder: 100,
    piiFields: ["email", "phoneNumber", "fullName"],
    handler: "deleteUser",
  },

  // User's personal data - DELETE SECOND (has FK to User)
  ResumeProfile: {
    deletionOrder: 90,
    piiFields: [
      "fullName",
      "email",
      "phoneNumber",
      "location",
      "profileUrl",
      "summary",
      "experience",
      "education",
      "certifications",
    ],
    handler: "deleteResumes",
  },

  ResumeVersion: {
    deletionOrder: 85,
    piiFields: ["s3BucketUrl"],
    handler: "deleteResumeVersions",
  },

  JobApplication: {
    deletionOrder: 80,
    piiFields: ["formData", "screenshotBeforeUrl", "screenshotAfterUrl"],
    handler: "deleteApplications",
  },

  // Communication channels - DELETE THIRD
  ChannelSubscription: {
    deletionOrder: 70,
    piiFields: ["identifier"], // phone, email, telegram_id
    handler: "deleteChannelSubscriptions",
  },

  NotificationLog: {
    deletionOrder: 65,
    piiFields: ["subject", "body"],
    handler: "deleteNotificationLogs",
  },

  // Learning data
  AnswerMemoryEntry: {
    deletionOrder: 60,
    piiFields: ["questionText", "answer"],
    handler: "deleteAnswerMemory",
  },

  // Audit logs (may contain PII in context) - DELETE FIRST (read-only after deletion)
  AuditLog: {
    deletionOrder: 50,
    piiFields: ["inputData", "outputData", "context"],
    handler: "anonymizeAuditLogs",
  },

  // Job matches & listings (no direct PII, but linked to user)
  JobMatch: {
    deletionOrder: 75,
    piiFields: [],
    handler: "deleteJobMatches",
  },
} as const;

/**
 * PII data classification
 * Used to determine sensitivity and handling in various contexts
 */
export const PII_FIELDS = {
  // Tier 1: Direct identifiers (email, phone, name)
  DIRECT: [
    "email",
    "phoneNumber",
    "fullName",
    "cognitoId",
    "identifier", // for channels
  ],

  // Tier 2: Location/contact data
  LOCATION: ["location", "timezone", "phoneCountryCode", "targetLocations"],

  // Tier 3: Professional/sensitive
  PROFESSIONAL: [
    "skills",
    "experience",
    "education",
    "certifications",
    "salary",
    "salaryMin",
    "salaryMax",
    "yearsOfExperience",
    "targetRoles",
    "targetIndustries",
  ],

  // Tier 4: Behavioral/preference data
  BEHAVIORAL: [
    "summary",
    "profileUrl",
    "questionText",
    "answer",
    "formData",
    "desiredWorkType",
  ],

  // Tier 5: Derived/binary data (lowest sensitivity)
  DERIVED: [
    "atsScore",
    "semanticScore",
    "skillsMatch",
    "overallScore",
    "confidence",
  ],
} as const;

/**
 * Data retention policies
 * Automatic deletion after specified periods
 */
export const DATA_RETENTION = {
  AnswerMemoryEntry: { days: 180, reason: "User may update answers" },
  AuditLog: { days: 365, reason: "Compliance requirement (1 year)" },
  NotificationLog: { days: 90, reason: "Delivery proof retention" },
  screenshotData: {
    days: 30,
    reason: "Form-filling evidence (delete after dispute period)",
  },
  voiceRecordings: {
    days: 1,
    reason: "Security: auto-delete from S3 after transcription",
  },
} as const;

/**
 * Map table/field to deletion priority
 */
export function getDeletionPriority(table: string): number {
  const entry = GDPR_REGISTRY[table as keyof typeof GDPR_REGISTRY];
  return entry?.deletionOrder ?? 999;
}

/**
 * Check if a field contains PII
 */
export function isPiiField(
  field: string
): boolean {
  const allPiiFields = Object.values(PII_FIELDS).flat();
  return allPiiFields.includes(field as never);
}

/**
 * Get PII tier (sensitivity level) for a field
 */
export function getPiiTier(field: string): string | null {
  for (const [tier, fields] of Object.entries(PII_FIELDS)) {
    if (fields.includes(field as never)) {
      return tier;
    }
  }
  return null;
}
