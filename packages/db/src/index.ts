// Export Prisma client
export { prisma, default } from "./client";
export type { PrismaClient } from "@prisma/client";

// Export all Prisma types
export * from "@prisma/client";

// Export GDPR utilities
export {
  GDPR_REGISTRY,
  PII_FIELDS,
  DATA_RETENTION,
  getDeletionPriority,
  isPiiField,
  getPiiTier,
} from "./gdpr-registry";
