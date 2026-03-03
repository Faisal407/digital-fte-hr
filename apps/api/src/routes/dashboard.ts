/**
 * Dashboard endpoints
 * GET /dashboard/stats
 * GET /dashboard/activity
 * GET /dashboard/summary
 */

import type { Router, Request, Response } from "express";
import { prisma } from "@packages/db";
import {
  sendError,
  sendSuccess,
  logError,
} from "../lib/errors";
import {
  asyncHandler,
  assertAuthenticated,
} from "../lib/handler";
import { ERROR_CODES } from "@packages/shared";

export function registerDashboardRoutes(router: Router): void {
  /**
   * GET /dashboard/stats
   * Get user's dashboard statistics
   */
  router.get(
    "/dashboard/stats",
    asyncHandler(async (req: Request, res: Response) => {
      const authReq = assertAuthenticated(req, res);
      if (!authReq) return;

      try {
        // Get applications stats
        const totalApplications = await prisma.jobApplication.count({
          where: { userId: authReq.userId },
        });

        const viewedApplications = await prisma.jobApplication.count({
          where: {
            userId: authReq.userId,
            viewedByEmployer: true,
          },
        });

        const shortlistedApplications = await prisma.jobApplication.count({
          where: {
            userId: authReq.userId,
            shortlistedAt: { not: null },
          },
        });

        const rejectedApplications = await prisma.jobApplication.count({
          where: {
            userId: authReq.userId,
            rejectedAt: { not: null },
          },
        });

        // Get resumes stats
        const totalResumes = await prisma.resumeProfile.count({
          where: { userId: authReq.userId },
        });

        const avgAtsScore = await prisma.resumeProfile.aggregate({
          where: { userId: authReq.userId, atsScore: { not: null } },
          _avg: { atsScore: true },
        });

        // Get job matches stats
        const savedJobs = await prisma.jobMatch.count({
          where: {
            userId: authReq.userId,
            savedAt: { not: null },
          },
        });

        const avgMatchScore = await prisma.jobMatch.aggregate({
          where: { userId: authReq.userId },
          _avg: { overallScore: true },
        });

        // Get this month's activity
        const today = new Date();
        const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);

        const thisMonthApplications = await prisma.jobApplication.count({
          where: {
            userId: authReq.userId,
            appliedAt: { gte: monthStart },
          },
        });

        return sendSuccess(res, {
          applications: {
            total: totalApplications,
            viewed: viewedApplications,
            shortlisted: shortlistedApplications,
            rejected: rejectedApplications,
            viewRate:
              totalApplications > 0
                ? Math.round((viewedApplications / totalApplications) * 100)
                : 0,
          },
          resumes: {
            total: totalResumes,
            avgAtsScore: Math.round(avgAtsScore._avg.atsScore || 0),
          },
          jobs: {
            saved: savedJobs,
            avgMatchScore: Math.round(avgMatchScore._avg.overallScore || 0),
          },
          activity: {
            thisMonth: thisMonthApplications,
          },
        });
      } catch (error) {
        logError(error, { action: "get_dashboard_stats", userId: authReq.userId });
        return sendError(
          res,
          ERROR_CODES.INTERNAL_ERROR,
          "Failed to get dashboard stats",
          500
        );
      }
    })
  );

  /**
   * GET /dashboard/activity
   * Get recent activity
   */
  router.get(
    "/dashboard/activity",
    asyncHandler(async (req: Request, res: Response) => {
      const authReq = assertAuthenticated(req, res);
      if (!authReq) return;

      try {
        const limit = Math.min(20, parseInt((req.query.limit as string) || "10", 10));

        // Get recent applications
        const recentApplications = await prisma.jobApplication.findMany({
          where: { userId: authReq.userId },
          select: {
            id: true,
            job: {
              select: {
                title: true,
                company: true,
              },
            },
            status: true,
            appliedAt: true,
            viewedByEmployer: true,
            shortlistedAt: true,
          },
          orderBy: { appliedAt: "desc" },
          take: limit,
        });

        // Get recent resumes
        const recentResumes = await prisma.resumeProfile.findMany({
          where: { userId: authReq.userId },
          select: {
            id: true,
            title: true,
            atsScore: true,
            updatedAt: true,
          },
          orderBy: { updatedAt: "desc" },
          take: 5,
        });

        // Get recent notifications
        const recentNotifications = await prisma.notificationLog.findMany({
          where: { userId: authReq.userId },
          select: {
            id: true,
            channel: true,
            templateName: true,
            status: true,
            sentAt: true,
          },
          orderBy: { createdAt: "desc" },
          take: 10,
        });

        return sendSuccess(res, {
          applications: recentApplications,
          resumes: recentResumes,
          notifications: recentNotifications,
        });
      } catch (error) {
        logError(error, { action: "get_activity", userId: authReq.userId });
        return sendError(
          res,
          ERROR_CODES.INTERNAL_ERROR,
          "Failed to get activity",
          500
        );
      }
    })
  );

  /**
   * GET /dashboard/summary
   * Get quick summary for dashboard
   */
  router.get(
    "/dashboard/summary",
    asyncHandler(async (req: Request, res: Response) => {
      const authReq = assertAuthenticated(req, res);
      if (!authReq) return;

      try {
        const user = await prisma.user.findUnique({
          where: { id: authReq.userId },
          select: {
            fullName: true,
            planTier: true,
            createdAt: true,
            email: true,
          },
        });

        if (!user) {
          return sendError(
            res,
            ERROR_CODES.AUTH_REQUIRED,
            "User not found",
            404
          );
        }

        // Get quick stats
        const todayStart = new Date();
        todayStart.setHours(0, 0, 0, 0);

        const todayApplications = await prisma.jobApplication.count({
          where: {
            userId: authReq.userId,
            appliedAt: { gte: todayStart },
          },
        });

        const totalApplications = await prisma.jobApplication.count({
          where: { userId: authReq.userId },
        });

        const shortlistedApplications = await prisma.jobApplication.count({
          where: {
            userId: authReq.userId,
            shortlistedAt: { not: null },
          },
        });

        const bestResume = await prisma.resumeProfile.findFirst({
          where: { userId: authReq.userId },
          select: {
            title: true,
            atsScore: true,
          },
          orderBy: { atsScore: "desc" },
        });

        return sendSuccess(res, {
          user: {
            name: user.fullName,
            email: user.email,
            plan: user.planTier,
            memberSince: user.createdAt,
          },
          metrics: {
            todayApplications,
            totalApplications,
            shortlistedApplications,
            successRate:
              totalApplications > 0
                ? Math.round((shortlistedApplications / totalApplications) * 100)
                : 0,
          },
          bestResume: {
            title: bestResume?.title || "No resumes",
            atsScore: bestResume?.atsScore || 0,
          },
        });
      } catch (error) {
        logError(error, { action: "get_summary", userId: authReq.userId });
        return sendError(
          res,
          ERROR_CODES.INTERNAL_ERROR,
          "Failed to get summary",
          500
        );
      }
    })
  );
}
