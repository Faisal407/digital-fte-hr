/**
 * Authentication endpoints
 * POST /auth/register
 * POST /auth/login
 * POST /auth/verify
 * POST /auth/refresh
 * POST /auth/logout
 */

import type { Router, Request, Response } from "express";
import { z } from "zod";
import { prisma } from "@packages/db";
import {
  sendError,
  sendSuccess,
  logError,
} from "../lib/errors";
import {
  validateAndGetContext,
  logActionStart,
  logActionComplete,
  logActionFailed,
  asyncHandler,
  assertAuthenticated,
} from "../lib/handler";
import { ERROR_CODES, EmailSchema, HTTP_STATUS } from "@packages/shared";
import type { AuthenticatedRequest } from "../middleware/auth";

// Validation schemas
const RegisterSchema = z.object({
  email: EmailSchema,
  password: z.string().min(8, "Password must be at least 8 characters"),
  fullName: z.string().min(1),
});

const LoginSchema = z.object({
  email: EmailSchema,
  password: z.string(),
});

const VerifyEmailSchema = z.object({
  email: EmailSchema,
  code: z.string(),
});

export function registerAuthRoutes(router: Router): void {
  /**
   * POST /auth/register
   * Create new user account
   */
  router.post(
    "/auth/register",
    asyncHandler(async (req: Request, res: Response) => {
      const validation = z.object({}).merge(RegisterSchema).safeParse(req.body);

      if (!validation.success) {
        return sendError(
          res,
          ERROR_CODES.VALIDATION_ERROR,
          "Invalid input",
          422,
          { errors: validation.error.flatten() }
        );
      }

      const { email, password, fullName } = validation.data;
      const context = {
        userId: "anonymous",
        planTier: "free",
        correlationId: req.headers["x-correlation-id"] as string,
        requestId: (req as any).requestId,
      };

      try {
        await logActionStart(context, "user_registration", "auth", { email });

        // Check if user already exists
        const existingUser = await prisma.user.findUnique({
          where: { email },
        });

        if (existingUser) {
          await logActionFailed(
            context,
            "user_registration",
            "auth",
            "User already exists"
          );
          return sendError(
            res,
            ERROR_CODES.VALIDATION_ERROR,
            "Email already registered",
            409
          );
        }

        // In production, create Cognito user here
        // For now, create local user
        const user = await prisma.user.create({
          data: {
            email,
            fullName,
            cognitoId: `cognito-${email}`, // Would be actual Cognito ID
            planTier: "free",
            status: "active",
          },
        });

        await logActionComplete(context, "user_registration", "auth", {
          userId: user.id,
          email: user.email,
        });

        return sendSuccess(
          res,
          {
            userId: user.id,
            email: user.email,
            planTier: user.planTier,
            message: "Account created successfully. Please verify your email.",
          },
          HTTP_STATUS.CREATED
        );
      } catch (error) {
        logError(error, { action: "register", email });
        await logActionFailed(context, "user_registration", "auth", error instanceof Error ? error : new Error(String(error)));

        return sendError(
          res,
          ERROR_CODES.INTERNAL_ERROR,
          "Registration failed",
          500
        );
      }
    })
  );

  /**
   * POST /auth/login
   * Authenticate user and return JWT
   */
  router.post(
    "/auth/login",
    asyncHandler(async (req: Request, res: Response) => {
      const validation = LoginSchema.safeParse(req.body);

      if (!validation.success) {
        return sendError(
          res,
          ERROR_CODES.VALIDATION_ERROR,
          "Invalid input",
          422,
          { errors: validation.error.flatten() }
        );
      }

      const { email, password } = validation.data;
      const context = {
        userId: "anonymous",
        planTier: "free",
        correlationId: req.headers["x-correlation-id"] as string,
        requestId: (req as any).requestId,
      };

      try {
        await logActionStart(context, "user_login", "auth", { email });

        // Find user
        const user = await prisma.user.findUnique({
          where: { email },
          select: {
            id: true,
            email: true,
            fullName: true,
            planTier: true,
            status: true,
            cognitoId: true,
          },
        });

        if (!user || user.status === "suspended" || user.status === "deleted") {
          await logActionFailed(context, "user_login", "auth", "Invalid credentials");
          return sendError(
            res,
            ERROR_CODES.INVALID_CREDENTIALS,
            "Invalid email or password",
            401
          );
        }

        // In production, verify password against Cognito
        // For now, just accept any password
        const token = Buffer.from(
          JSON.stringify({
            sub: user.id,
            email: user.email,
            cognito_username: user.cognitoId,
            "custom:plan_tier": user.planTier,
            iat: Math.floor(Date.now() / 1000),
            exp: Math.floor(Date.now() / 1000) + 86400, // 24 hours
          })
        ).toString("base64");

        // Add .header.payload.signature format (not cryptographically valid, but structurally correct for testing)
        const fullToken = `header.${token}.signature`;

        await logActionComplete(context, "user_login", "auth", {
          userId: user.id,
          email: user.email,
        });

        return sendSuccess(res, {
          token: fullToken,
          user: {
            id: user.id,
            email: user.email,
            fullName: user.fullName,
            planTier: user.planTier,
          },
        });
      } catch (error) {
        logError(error, { action: "login", email });
        await logActionFailed(
          context,
          "user_login",
          "auth",
          error instanceof Error ? error : new Error(String(error))
        );

        return sendError(
          res,
          ERROR_CODES.INTERNAL_ERROR,
          "Login failed",
          500
        );
      }
    })
  );

  /**
   * POST /auth/verify
   * Verify email address
   */
  router.post(
    "/auth/verify",
    asyncHandler(async (req: Request, res: Response) => {
      const validation = VerifyEmailSchema.safeParse(req.body);

      if (!validation.success) {
        return sendError(
          res,
          ERROR_CODES.VALIDATION_ERROR,
          "Invalid input",
          422,
          { errors: validation.error.flatten() }
        );
      }

      const { email, code } = validation.data;

      try {
        // In production, verify code against Cognito
        // For now, just accept valid looking codes
        if (code.length < 4) {
          return sendError(
            res,
            ERROR_CODES.VALIDATION_ERROR,
            "Invalid verification code",
            422
          );
        }

        return sendSuccess(res, {
          message: "Email verified successfully",
        });
      } catch (error) {
        logError(error, { action: "verify", email });
        return sendError(
          res,
          ERROR_CODES.INTERNAL_ERROR,
          "Verification failed",
          500
        );
      }
    })
  );

  /**
   * POST /auth/me
   * Get current user info (authenticated)
   */
  router.post(
    "/auth/me",
    asyncHandler(async (req: Request, res: Response) => {
      const authReq = assertAuthenticated(req, res);
      if (!authReq) return;

      try {
        const user = await prisma.user.findUnique({
          where: { id: authReq.userId },
          select: {
            id: true,
            email: true,
            fullName: true,
            planTier: true,
            createdAt: true,
            timezone: true,
            language: true,
          },
        });

        if (!user) {
          return sendError(res, ERROR_CODES.AUTH_REQUIRED, "User not found", 404);
        }

        return sendSuccess(res, user);
      } catch (error) {
        logError(error, { action: "get_current_user", userId: authReq.userId });
        return sendError(
          res,
          ERROR_CODES.INTERNAL_ERROR,
          "Failed to get user info",
          500
        );
      }
    })
  );
}
