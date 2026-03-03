/**
 * Job search endpoints
 * GET /jobs/search
 * GET /jobs/list
 * GET /jobs/:id
 * GET /jobs/:id/matches
 * GET /jobs/:id/match-score
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
  getPaginationParams,
  getContext,
  logActionStart,
  logActionComplete,
  logActionFailed,
} from "../lib/handler";
import {
  ERROR_CODES,
  JobSearchInputSchema,
  HTTP_STATUS,
} from "@packages/shared";

const GetJobSchema = z.object({
  id: z.string().cuid(),
});

const ListJobsSchema = z.object({
  page: z.string().default("1"),
  pageSize: z.string().default("20"),
  platform: z.string().optional(),
  minScore: z.string().optional(),
});

export function registerJobRoutes(router: Router): void {
  /**
   * POST /jobs/search
   * Search for jobs matching user profile
   */
  router.post(
    "/jobs/search",
    asyncHandler(async (req: Request, res: Response) => {
      const authReq = assertAuthenticated(req, res);
      if (!authReq) return;

      const validation = JobSearchInputSchema.safeParse(req.body);
      if (!validation.success) {
        return sendError(
          res,
          ERROR_CODES.VALIDATION_ERROR,
          "Invalid search parameters",
          422,
          { errors: validation.error.flatten() }
        );
      }

      const context = getContext(req);
      const searchParams = validation.data;

      try {
        await logActionStart(context, "job_search", "job_search_agent", {
          platforms: searchParams.platforms?.length || 0,
          limit: searchParams.limit,
        });

        // Get user profile for matching
        const user = await prisma.user.findUnique({
          where: { id: authReq.userId },
          select: {
            targetRoles: true,
            targetLocations: true,
            targetIndustries: true,
            yearsOfExperience: true,
          },
        });

        if (!user) {
          await logActionFailed(context, "job_search", "job_search_agent", "User not found");
          return sendError(res, ERROR_CODES.AUTH_REQUIRED, "User not found", 404);
        }

        // TODO: Call Job Search Agent via LangGraph
        // For now, return placeholder results
        const mockJobs = [
          {
            jobId: "job-1",
            title: "Senior Software Engineer",
            company: "TechCorp",
            location: "San Francisco, CA",
            description: "We're looking for a senior engineer with 5+ years experience...",
            platform: "linkedin",
            platformUrl: "https://linkedin.com/jobs/12345",
            matchScore: 92,
            scoreBreakdown: {
              semanticScore: 90,
              skillsMatch: 95,
              roleMatch: 88,
              locationMatch: 100,
            },
          },
        ];

        await logActionComplete(
          context,
          "job_search",
          "job_search_agent",
          { jobsFound: mockJobs.length }
        );

        return sendSuccess(res, {
          matches: mockJobs,
          totalFound: mockJobs.length,
          platformsSearched: ["linkedin"],
          deduplicatedCount: 0,
        });
      } catch (error) {
        logError(error, { action: "search_jobs", userId: authReq.userId });
        await logActionFailed(
          context,
          "job_search",
          "job_search_agent",
          error instanceof Error ? error : new Error(String(error))
        );

        return sendError(
          res,
          ERROR_CODES.SEARCH_FAILED,
          "Job search failed",
          500
        );
      }
    })
  );

  /**
   * GET /jobs/list
   * List all available jobs
   */
  router.get(
    "/jobs/list",
    asyncHandler(async (req: Request, res: Response) => {
      const authReq = assertAuthenticated(req, res);
      if (!authReq) return;

      const validation = ListJobsSchema.safeParse(req.query);
      if (!validation.success) {
        return sendError(
          res,
          ERROR_CODES.VALIDATION_ERROR,
          "Invalid query parameters",
          422
        );
      }

      const { page, pageSize } = getPaginationParams(validation.data);
      const minScore = validation.data.minScore ? parseInt(validation.data.minScore, 10) : 0;

      try {
        // Get jobs with user's match scores
        const jobs = await prisma.jobListing.findMany({
          skip: (page - 1) * pageSize,
          take: pageSize,
          select: {
            id: true,
            title: true,
            company: true,
            location: true,
            salary: true,
            description: true,
            matches: {
              where: { userId: authReq.userId },
              select: { overallScore: true },
              take: 1,
            },
          },
        });

        const total = await prisma.jobListing.count();

        const formatted = jobs.map((job) => ({
          id: job.id,
          title: job.title,
          company: job.company,
          location: job.location,
          salary: job.salary,
          matchScore: job.matches[0]?.overallScore || 0,
        }));

        return sendPaginated(res, formatted, page, pageSize, total);
      } catch (error) {
        logError(error, { action: "list_jobs", userId: authReq.userId });
        return sendError(
          res,
          ERROR_CODES.SEARCH_FAILED,
          "Failed to list jobs",
          500
        );
      }
    })
  );

  /**
   * GET /jobs/:id
   * Get job details
   */
  router.get(
    "/jobs/:id",
    asyncHandler(async (req: Request, res: Response) => {
      const authReq = assertAuthenticated(req, res);
      if (!authReq) return;

      const validation = GetJobSchema.safeParse(req.params);
      if (!validation.success) {
        return sendError(res, ERROR_CODES.VALIDATION_ERROR, "Invalid job ID", 422);
      }

      const { id } = validation.data;

      try {
        const job = await prisma.jobListing.findUnique({
          where: { id },
          select: {
            id: true,
            title: true,
            company: true,
            location: true,
            salary: true,
            description: true,
            requirements: true,
            benefits: true,
            isGhostJob: true,
            platforms: {
              select: { platform: true, platformUrl: true, platformPostedAt: true },
            },
            matches: {
              where: { userId: authReq.userId },
              take: 1,
            },
          },
        });

        if (!job) {
          return sendError(
            res,
            ERROR_CODES.JOB_NOT_FOUND,
            "Job not found",
            404
          );
        }

        return sendSuccess(res, {
          ...job,
          matchScore: job.matches[0]?.overallScore || null,
        });
      } catch (error) {
        logError(error, { action: "get_job", jobId: id, userId: authReq.userId });
        return sendError(
          res,
          ERROR_CODES.SEARCH_FAILED,
          "Failed to get job details",
          500
        );
      }
    })
  );

  /**
   * GET /jobs/saved
   * Get user's saved jobs
   */
  router.get(
    "/jobs/saved",
    asyncHandler(async (req: Request, res: Response) => {
      const authReq = assertAuthenticated(req, res);
      if (!authReq) return;

      const { page, pageSize } = getPaginationParams(req.query as any);

      try {
        const savedJobs = await prisma.jobMatch.findMany({
          where: {
            userId: authReq.userId,
            savedAt: { not: null },
          },
          skip: (page - 1) * pageSize,
          take: pageSize,
          select: {
            id: true,
            job: {
              select: {
                id: true,
                title: true,
                company: true,
                location: true,
                salary: true,
              },
            },
            overallScore: true,
            savedAt: true,
          },
        });

        const total = await prisma.jobMatch.count({
          where: {
            userId: authReq.userId,
            savedAt: { not: null },
          },
        });

        return sendPaginated(res, savedJobs, page, pageSize, total);
      } catch (error) {
        logError(error, { action: "get_saved_jobs", userId: authReq.userId });
        return sendError(
          res,
          ERROR_CODES.INTERNAL_ERROR,
          "Failed to get saved jobs",
          500
        );
      }
    })
  );
}
