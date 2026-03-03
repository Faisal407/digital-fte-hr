/**
 * Job application endpoints
 * POST /applications/create
 * GET /applications/review/:id
 * POST /applications/:id/approve
 * POST /applications/:id/skip
 * GET /applications/list
 * GET /applications/:id/status
 */

import type { Router, Request, Response } from "express";
import { z } from "zod";
import { prisma } from "@packages/db";
import {
  sendError,
  sendSuccess,
  sendPaginated,
  sendAccepted,
  logError,
} from "../lib/errors";
import {
  asyncHandler,
  assertAuthenticated,
  assertOwnership,
  getPaginationParams,
  getContext,
  logActionStart,
  logActionComplete,
  logActionFailed,
} from "../lib/handler";
import {
  ERROR_CODES,
  HTTP_STATUS,
  AUTO_APPLY_LIMITS,
} from "@packages/shared";

const CreateApplicationSchema = z.object({
  jobId: z.string().cuid(),
  resumeId: z.string().cuid(),
  source: z.enum(["manual", "auto_apply"]).default("manual"),
});

const ApplicationIdSchema = z.object({
  id: z.string().cuid(),
});

export function registerApplicationRoutes(router: Router): void {
  /**
   * POST /applications/create
   * Create a new job application
   * For auto-apply, this triggers the review gate
   */
  router.post(
    "/applications/create",
    asyncHandler(async (req: Request, res: Response) => {
      const authReq = assertAuthenticated(req, res);
      if (!authReq) return;

      const validation = CreateApplicationSchema.safeParse(req.body);
      if (!validation.success) {
        return sendError(
          res,
          ERROR_CODES.VALIDATION_ERROR,
          "Invalid application data",
          422,
          { errors: validation.error.flatten() }
        );
      }

      const context = getContext(req);
      const { jobId, resumeId, source } = validation.data;

      try {
        await logActionStart(context, "application_create", "auto_apply_agent", {
          jobId,
          source,
        });

        // Verify resume belongs to user
        const resume = await prisma.resumeProfile.findUnique({
          where: { id: resumeId },
          select: { userId: true },
        });

        if (!resume) {
          await logActionFailed(
            context,
            "application_create",
            "auto_apply_agent",
            "Resume not found"
          );
          return sendError(
            res,
            ERROR_CODES.RESUME_NOT_FOUND,
            "Resume not found",
            404
          );
        }

        if (!assertOwnership(authReq.userId, resume.userId, res)) return;

        // Check for auto-apply limits (CRITICAL SAFETY CHECK)
        if (source === "auto_apply") {
          const dailyLimit =
            authReq.planTier === "free"
              ? AUTO_APPLY_LIMITS.FREE_TIER
              : authReq.planTier === "pro"
                ? AUTO_APPLY_LIMITS.PRO_TIER
                : AUTO_APPLY_LIMITS.ELITE_TIER;

          if (dailyLimit === 0) {
            await logActionFailed(
              context,
              "application_create",
              "auto_apply_agent",
              "Auto-apply not available on free plan"
            );
            return sendError(
              res,
              ERROR_CODES.INSUFFICIENT_PLAN,
              "Auto-apply requires Pro plan or higher",
              402
            );
          }

          // Check daily usage
          const today = new Date();
          today.setHours(0, 0, 0, 0);

          const appliedToday = await prisma.jobApplication.count({
            where: {
              userId: authReq.userId,
              source: "auto_apply",
              appliedAt: { gte: today },
            },
          });

          if (appliedToday >= dailyLimit) {
            await logActionFailed(
              context,
              "application_create",
              "auto_apply_agent",
              `Daily limit ${dailyLimit} exceeded`
            );
            return sendError(
              res,
              ERROR_CODES.DAILY_LIMIT_EXCEEDED,
              `Daily auto-apply limit (${dailyLimit}) reached`,
              429,
              {
                limit: dailyLimit,
                used: appliedToday,
                resetAt: new Date(today.getTime() + 24 * 60 * 60 * 1000),
              }
            );
          }
        }

        // Check if already applied
        const existing = await prisma.jobApplication.findUnique({
          where: {
            userId_jobId_resumeId: {
              userId: authReq.userId,
              jobId,
              resumeId,
            },
          },
        });

        if (existing) {
          await logActionFailed(
            context,
            "application_create",
            "auto_apply_agent",
            "Already applied to this job"
          );
          return sendError(
            res,
            ERROR_CODES.ALREADY_APPLIED,
            "Already applied to this job",
            409
          );
        }

        // Create application
        const application = await prisma.jobApplication.create({
          data: {
            userId: authReq.userId,
            jobId,
            resumeId,
            source,
            status: source === "auto_apply" ? "pending_review" : "pending_review",
            appliedVia: "direct_submit",
            // Set review gate expiry for auto-apply
            ...(source === "auto_apply" && {
              reviewGateExpiresAt: new Date(Date.now() + 60 * 60 * 1000), // 1 hour
            }),
          },
          select: {
            id: true,
            jobId: true,
            resumeId: true,
            status: true,
            source: true,
            reviewGateExpiresAt: true,
          },
        });

        await logActionComplete(context, "application_create", "auto_apply_agent", {
          applicationId: application.id,
        });

        // For auto-apply, return 202 Accepted (requires user approval)
        if (source === "auto_apply") {
          return sendAccepted(
            res,
            application.id,
            "Application created. Awaiting your approval before submission."
          );
        }

        return sendSuccess(res, application, HTTP_STATUS.CREATED);
      } catch (error) {
        logError(error, {
          action: "create_application",
          userId: authReq.userId,
          jobId,
        });
        await logActionFailed(
          context,
          "application_create",
          "auto_apply_agent",
          error instanceof Error ? error : new Error(String(error))
        );

        return sendError(
          res,
          ERROR_CODES.INTERNAL_ERROR,
          "Failed to create application",
          500
        );
      }
    })
  );

  /**
   * GET /applications/review/:id
   * Get application review gate (for user approval before auto-submit)
   */
  router.get(
    "/applications/review/:id",
    asyncHandler(async (req: Request, res: Response) => {
      const authReq = assertAuthenticated(req, res);
      if (!authReq) return;

      const validation = ApplicationIdSchema.safeParse(req.params);
      if (!validation.success) {
        return sendError(
          res,
          ERROR_CODES.VALIDATION_ERROR,
          "Invalid application ID",
          422
        );
      }

      const { id } = validation.data;

      try {
        const application = await prisma.jobApplication.findUnique({
          where: { id },
          select: {
            id: true,
            userId: true,
            jobId: true,
            job: {
              select: {
                title: true,
                company: true,
              },
            },
            resumeId: true,
            status: true,
            reviewGateExpiresAt: true,
            formData: true,
          },
        });

        if (!application) {
          return sendError(
            res,
            ERROR_CODES.APPLICATION_NOT_FOUND,
            "Application not found",
            404
          );
        }

        if (!assertOwnership(authReq.userId, application.userId, res)) return;

        // Check if review gate expired
        if (
          application.reviewGateExpiresAt &&
          application.reviewGateExpiresAt < new Date()
        ) {
          return sendError(
            res,
            ERROR_CODES.APPROVAL_EXPIRED,
            "Review gate has expired. Please create a new application.",
            410
          );
        }

        return sendSuccess(res, {
          applicationId: application.id,
          jobTitle: application.job.title,
          company: application.job.company,
          status: application.status,
          expiresAt: application.reviewGateExpiresAt,
          // TODO: Include form data with user-reviewable answers
          formAnswers: application.formData || [],
        });
      } catch (error) {
        logError(error, {
          action: "get_review_gate",
          applicationId: id,
          userId: authReq.userId,
        });
        return sendError(
          res,
          ERROR_CODES.INTERNAL_ERROR,
          "Failed to get review gate",
          500
        );
      }
    })
  );

  /**
   * POST /applications/:id/approve
   * User approves application for submission
   * CRITICAL: Only approve = submit. Never bypass this.
   */
  router.post(
    "/applications/:id/approve",
    asyncHandler(async (req: Request, res: Response) => {
      const authReq = assertAuthenticated(req, res);
      if (!authReq) return;

      const validation = ApplicationIdSchema.safeParse(req.params);
      if (!validation.success) {
        return sendError(
          res,
          ERROR_CODES.VALIDATION_ERROR,
          "Invalid application ID",
          422
        );
      }

      const context = getContext(req);
      const { id } = validation.data;

      try {
        await logActionStart(context, "application_approve", "auto_apply_agent", {
          applicationId: id,
        });

        const application = await prisma.jobApplication.findUnique({
          where: { id },
          select: {
            id: true,
            userId: true,
            status: true,
            reviewGateExpiresAt: true,
          },
        });

        if (!application) {
          await logActionFailed(
            context,
            "application_approve",
            "auto_apply_agent",
            "Application not found"
          );
          return sendError(
            res,
            ERROR_CODES.APPLICATION_NOT_FOUND,
            "Application not found",
            404
          );
        }

        if (!assertOwnership(authReq.userId, application.userId, res)) return;

        // Check review gate
        if (
          application.reviewGateExpiresAt &&
          application.reviewGateExpiresAt < new Date()
        ) {
          await logActionFailed(
            context,
            "application_approve",
            "auto_apply_agent",
            "Review gate expired"
          );
          return sendError(
            res,
            ERROR_CODES.APPROVAL_EXPIRED,
            "Review gate has expired",
            410
          );
        }

        // Update application status
        const updated = await prisma.jobApplication.update({
          where: { id },
          data: {
            status: "approved",
            reviewedAt: new Date(),
            reviewedBy: authReq.userId,
          },
          select: {
            id: true,
            status: true,
            reviewedAt: true,
          },
        });

        await logActionComplete(
          context,
          "application_approve",
          "auto_apply_agent",
          { applicationId: id, newStatus: "approved" }
        );

        return sendSuccess(res, {
          ...updated,
          message: "Application approved. Submitting now...",
        });
      } catch (error) {
        logError(error, {
          action: "approve_application",
          applicationId: id,
          userId: authReq.userId,
        });
        await logActionFailed(
          context,
          "application_approve",
          "auto_apply_agent",
          error instanceof Error ? error : new Error(String(error))
        );

        return sendError(
          res,
          ERROR_CODES.INTERNAL_ERROR,
          "Failed to approve application",
          500
        );
      }
    })
  );

  /**
   * GET /applications/list
   * List user's applications
   */
  router.get(
    "/applications/list",
    asyncHandler(async (req: Request, res: Response) => {
      const authReq = assertAuthenticated(req, res);
      if (!authReq) return;

      const { page, pageSize } = getPaginationParams(req.query as any);
      const status = (req.query.status as string) || undefined;

      try {
        const applications = await prisma.jobApplication.findMany({
          where: {
            userId: authReq.userId,
            ...(status && { status: status as any }),
          },
          skip: (page - 1) * pageSize,
          take: pageSize,
          select: {
            id: true,
            jobId: true,
            job: {
              select: {
                title: true,
                company: true,
                location: true,
              },
            },
            status: true,
            source: true,
            appliedAt: true,
            viewedByEmployer: true,
            shortlistedAt: true,
            rejectedAt: true,
          },
          orderBy: { appliedAt: "desc" },
        });

        const total = await prisma.jobApplication.count({
          where: {
            userId: authReq.userId,
            ...(status && { status: status as any }),
          },
        });

        return sendPaginated(res, applications, page, pageSize, total);
      } catch (error) {
        logError(error, { action: "list_applications", userId: authReq.userId });
        return sendError(
          res,
          ERROR_CODES.INTERNAL_ERROR,
          "Failed to list applications",
          500
        );
      }
    })
  );
}
