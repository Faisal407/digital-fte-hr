/**
 * Resume endpoints
 * POST /resumes/upload
 * GET /resumes/list
 * GET /resumes/:id
 * POST /resumes/:id/optimize
 * POST /resumes/:id/score
 * DELETE /resumes/:id
 */

import type { Router, Request, Response } from "express";
import { z } from "zod";
import { prisma } from "@packages/db";
import {
  sendError,
  sendSuccess,
  sendPaginated,
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
  ATS_THRESHOLDS,
  HTTP_STATUS,
} from "@packages/shared";

const UploadResumeSchema = z.object({
  title: z.string().min(1),
  sourceType: z.enum(["upload", "linkedin", "form", "voice"]),
});

const ResumeIdSchema = z.object({
  id: z.string().cuid(),
});

export function registerResumeRoutes(router: Router): void {
  /**
   * POST /resumes/upload
   * Upload or create a new resume
   */
  router.post(
    "/resumes/upload",
    asyncHandler(async (req: Request, res: Response) => {
      const authReq = assertAuthenticated(req, res);
      if (!authReq) return;

      const validation = UploadResumeSchema.safeParse(req.body);
      if (!validation.success) {
        return sendError(
          res,
          ERROR_CODES.VALIDATION_ERROR,
          "Invalid resume data",
          422,
          { errors: validation.error.flatten() }
        );
      }

      const context = getContext(req);
      const { title, sourceType } = validation.data;

      try {
        await logActionStart(context, "resume_upload", "resume_builder_agent", {
          sourceType,
          title,
        });

        // Check plan limits
        const resumeCount = await prisma.resumeProfile.count({
          where: { userId: authReq.userId },
        });

        if (resumeCount >= 1 && authReq.planTier === "free") {
          await logActionFailed(
            context,
            "resume_upload",
            "resume_builder_agent",
            "Resume limit exceeded for free tier"
          );
          return sendError(
            res,
            ERROR_CODES.PLAN_LIMIT_EXCEEDED,
            "Free tier allows only 1 resume. Upgrade to create more.",
            402
          );
        }

        // Create resume profile
        const resume = await prisma.resumeProfile.create({
          data: {
            userId: authReq.userId,
            title,
            sourceType,
            atsScore: null, // Will be computed
          },
        });

        await logActionComplete(context, "resume_upload", "resume_builder_agent", {
          resumeId: resume.id,
        });

        return sendSuccess(
          res,
          {
            id: resume.id,
            title: resume.title,
            sourceType: resume.sourceType,
            currentVersion: resume.currentVersion,
            atsScore: null,
            createdAt: resume.createdAt,
          },
          HTTP_STATUS.CREATED
        );
      } catch (error) {
        logError(error, { action: "upload_resume", userId: authReq.userId });
        await logActionFailed(
          context,
          "resume_upload",
          "resume_builder_agent",
          error instanceof Error ? error : new Error(String(error))
        );

        return sendError(
          res,
          ERROR_CODES.INTERNAL_ERROR,
          "Failed to upload resume",
          500
        );
      }
    })
  );

  /**
   * GET /resumes/list
   * List all user's resumes
   */
  router.get(
    "/resumes/list",
    asyncHandler(async (req: Request, res: Response) => {
      const authReq = assertAuthenticated(req, res);
      if (!authReq) return;

      const { page, pageSize } = getPaginationParams(req.query as any);

      try {
        const resumes = await prisma.resumeProfile.findMany({
          where: { userId: authReq.userId },
          skip: (page - 1) * pageSize,
          take: pageSize,
          select: {
            id: true,
            title: true,
            sourceType: true,
            currentVersion: true,
            atsScore: true,
            lastScoredAt: true,
            createdAt: true,
            updatedAt: true,
          },
          orderBy: { createdAt: "desc" },
        });

        const total = await prisma.resumeProfile.count({
          where: { userId: authReq.userId },
        });

        return sendPaginated(res, resumes, page, pageSize, total);
      } catch (error) {
        logError(error, { action: "list_resumes", userId: authReq.userId });
        return sendError(
          res,
          ERROR_CODES.INTERNAL_ERROR,
          "Failed to list resumes",
          500
        );
      }
    })
  );

  /**
   * GET /resumes/:id
   * Get resume details
   */
  router.get(
    "/resumes/:id",
    asyncHandler(async (req: Request, res: Response) => {
      const authReq = assertAuthenticated(req, res);
      if (!authReq) return;

      const validation = ResumeIdSchema.safeParse(req.params);
      if (!validation.success) {
        return sendError(
          res,
          ERROR_CODES.VALIDATION_ERROR,
          "Invalid resume ID",
          422
        );
      }

      const { id } = validation.data;

      try {
        const resume = await prisma.resumeProfile.findUnique({
          where: { id },
          select: {
            id: true,
            userId: true,
            title: true,
            sourceType: true,
            s3BucketUrl: true,
            currentVersion: true,
            fullName: true,
            email: true,
            phoneNumber: true,
            location: true,
            summary: true,
            skills: true,
            experience: true,
            education: true,
            certifications: true,
            atsScore: true,
            atsDetails: true,
            lastScoredAt: true,
            createdAt: true,
            updatedAt: true,
            versions: {
              orderBy: { versionNumber: "desc" },
              take: 5,
            },
          },
        });

        if (!resume) {
          return sendError(
            res,
            ERROR_CODES.RESUME_NOT_FOUND,
            "Resume not found",
            404
          );
        }

        // Check ownership
        if (!assertOwnership(authReq.userId, resume.userId, res)) return;

        return sendSuccess(res, resume);
      } catch (error) {
        logError(error, { action: "get_resume", resumeId: id, userId: authReq.userId });
        return sendError(
          res,
          ERROR_CODES.INTERNAL_ERROR,
          "Failed to get resume",
          500
        );
      }
    })
  );

  /**
   * POST /resumes/:id/score
   * Score resume for ATS compatibility
   */
  router.post(
    "/resumes/:id/score",
    asyncHandler(async (req: Request, res: Response) => {
      const authReq = assertAuthenticated(req, res);
      if (!authReq) return;

      const validation = ResumeIdSchema.safeParse(req.params);
      if (!validation.success) {
        return sendError(
          res,
          ERROR_CODES.VALIDATION_ERROR,
          "Invalid resume ID",
          422
        );
      }

      const context = getContext(req);
      const { id } = validation.data;

      try {
        await logActionStart(context, "resume_score", "resume_builder_agent", {
          resumeId: id,
        });

        const resume = await prisma.resumeProfile.findUnique({
          where: { id },
          select: { userId: true },
        });

        if (!resume) {
          await logActionFailed(context, "resume_score", "resume_builder_agent", "Resume not found");
          return sendError(
            res,
            ERROR_CODES.RESUME_NOT_FOUND,
            "Resume not found",
            404
          );
        }

        if (!assertOwnership(authReq.userId, resume.userId, res)) return;

        // TODO: Call Resume Builder Agent to score ATS
        // Mock result for now
        const mockScore = 78;
        const atsLevel =
          mockScore >= ATS_THRESHOLDS.GREEN
            ? "GREEN"
            : mockScore >= ATS_THRESHOLDS.YELLOW
              ? "YELLOW"
              : "RED";

        // Update resume with score
        const updated = await prisma.resumeProfile.update({
          where: { id },
          data: {
            atsScore: mockScore,
            lastScoredAt: new Date(),
            atsDetails: {
              level: atsLevel,
              checkpoints: [
                { name: "Keywords", status: "pass", impact: 20 },
                { name: "Formatting", status: "pass", impact: 15 },
                { name: "Structure", status: "warning", impact: 10 },
              ],
            },
          },
          select: {
            id: true,
            atsScore: true,
            atsDetails: true,
            lastScoredAt: true,
          },
        });

        await logActionComplete(context, "resume_score", "resume_builder_agent", {
          resumeId: id,
          score: mockScore,
          level: atsLevel,
        });

        return sendSuccess(res, updated);
      } catch (error) {
        logError(error, { action: "score_resume", resumeId: id, userId: authReq.userId });
        await logActionFailed(
          context,
          "resume_score",
          "resume_builder_agent",
          error instanceof Error ? error : new Error(String(error))
        );

        return sendError(
          res,
          ERROR_CODES.ATS_SCORING_FAILED,
          "Failed to score resume",
          500
        );
      }
    })
  );

  /**
   * DELETE /resumes/:id
   * Delete a resume
   */
  router.delete(
    "/resumes/:id",
    asyncHandler(async (req: Request, res: Response) => {
      const authReq = assertAuthenticated(req, res);
      if (!authReq) return;

      const validation = ResumeIdSchema.safeParse(req.params);
      if (!validation.success) {
        return sendError(
          res,
          ERROR_CODES.VALIDATION_ERROR,
          "Invalid resume ID",
          422
        );
      }

      const { id } = validation.data;

      try {
        const resume = await prisma.resumeProfile.findUnique({
          where: { id },
          select: { userId: true },
        });

        if (!resume) {
          return sendError(
            res,
            ERROR_CODES.RESUME_NOT_FOUND,
            "Resume not found",
            404
          );
        }

        if (!assertOwnership(authReq.userId, resume.userId, res)) return;

        await prisma.resumeProfile.delete({
          where: { id },
        });

        return sendSuccess(res, { message: "Resume deleted successfully" });
      } catch (error) {
        logError(error, { action: "delete_resume", resumeId: id, userId: authReq.userId });
        return sendError(
          res,
          ERROR_CODES.INTERNAL_ERROR,
          "Failed to delete resume",
          500
        );
      }
    })
  );
}
