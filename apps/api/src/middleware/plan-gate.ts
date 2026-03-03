/**
 * Plan tier gating middleware
 * Enforces feature access based on subscription plan
 */

import type { Request, Response, NextFunction } from "express";
import { sendError } from "../lib/errors";
import { ERROR_CODES, PLAN_LIMITS } from "@packages/shared";
import type { AuthenticatedRequest } from "./auth";
import { prisma } from "@packages/db";

type PlanTier = "free" | "pro" | "elite";

export interface PlanGateConfig {
  requirePlan?: PlanTier | PlanTier[]; // Require at least this plan
  checkLimit?: string; // Limit name to check (e.g., "dailyAutoApplies")
}

export function planGate(config: PlanGateConfig) {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const authReq = req as AuthenticatedRequest;

    // Skip if no authentication
    if (!authReq.userId) {
      next();
      return;
    }

    try {
      // Get user's current plan
      const user = await prisma.user.findUnique({
        where: { id: authReq.userId },
        select: { planTier: true },
      });

      if (!user) {
        sendError(res, ERROR_CODES.AUTH_REQUIRED, "User not found");
        return;
      }

      const planTier = user.planTier as PlanTier;

      // Check minimum required plan
      if (config.requirePlan) {
        const requiredPlans = Array.isArray(config.requirePlan)
          ? config.requirePlan
          : [config.requirePlan];

        const planHierarchy: Record<PlanTier, number> = {
          free: 0,
          pro: 1,
          elite: 2,
        };

        const userLevel = planHierarchy[planTier];
        const requiredLevel = Math.max(...requiredPlans.map((p) => planHierarchy[p]));

        if (userLevel < requiredLevel) {
          sendError(
            res,
            ERROR_CODES.INSUFFICIENT_PLAN,
            `This feature requires ${requiredPlans[requiredPlans.length - 1]} plan or higher`,
            402
          );
          return;
        }
      }

      // Check usage limits
      if (config.checkLimit) {
        const limits = PLAN_LIMITS[planTier];
        const limitKey = config.checkLimit as keyof typeof limits;
        const limit = limits[limitKey];

        // Special handling for different limit types
        if (limitKey === "dailyAutoApplies") {
          // Check if user has exceeded daily limit
          const today = new Date();
          today.setHours(0, 0, 0, 0);

          const applicationsToday = await prisma.jobApplication.count({
            where: {
              userId: authReq.userId,
              source: "auto_apply",
              appliedAt: {
                gte: today,
              },
            },
          });

          if (applicationsToday >= (limit as number)) {
            sendError(
              res,
              ERROR_CODES.DAILY_LIMIT_EXCEEDED,
              `Daily auto-apply limit (${limit}) reached. Resets tomorrow.`,
              429,
              {
                limit,
                used: applicationsToday,
                resetAt: new Date(today.getTime() + 24 * 60 * 60 * 1000),
              }
            );
            return;
          }

          // Store current usage in locals for handlers
          res.locals.dailyAutoApplesRemaining = (limit as number) - applicationsToday;
        }

        if (limitKey === "maxResumes") {
          // Check if user can create more resumes
          const resumeCount = await prisma.resumeProfile.count({
            where: { userId: authReq.userId },
          });

          if (resumeCount >= (limit as number)) {
            sendError(
              res,
              ERROR_CODES.PLAN_LIMIT_EXCEEDED,
              `Resume limit (${limit}) reached. Upgrade to increase.`,
              402,
              { limit, used: resumeCount }
            );
            return;
          }
        }
      }

      // Attach plan info to response locals
      res.locals.planTier = planTier;
      res.locals.planLimits = PLAN_LIMITS[planTier];

      next();
    } catch (error) {
      sendError(
        res,
        ERROR_CODES.INTERNAL_ERROR,
        "Plan gate check failed",
        500
      );
    }
  };
}

/**
 * Check if user has exceeded a specific limit
 */
export async function checkPlanLimit(
  userId: string,
  limitName: string
): Promise<{ exceeded: boolean; used: number; limit: number }> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { planTier: true },
  });

  if (!user) {
    throw new Error("User not found");
  }

  const planTier = user.planTier as PlanTier;
  const limits = PLAN_LIMITS[planTier];
  const limit = limits[limitName as keyof typeof limits] as number;

  let used = 0;

  if (limitName === "dailyAutoApplies") {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    used = await prisma.jobApplication.count({
      where: {
        userId,
        source: "auto_apply",
        appliedAt: { gte: today },
      },
    });
  } else if (limitName === "maxResumes") {
    used = await prisma.resumeProfile.count({
      where: { userId },
    });
  }

  return {
    exceeded: used >= limit,
    used,
    limit,
  };
}
