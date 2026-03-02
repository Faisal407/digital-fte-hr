/**
 * Authentication middleware
 * Validates Cognito JWT tokens
 */

import type { Request, Response, NextFunction } from "express";
import { sendError } from "../lib/errors";
import { ERROR_CODES, HTTP_STATUS, extractUserId, isTokenExpired, parseJwtPayload } from "@packages/shared";

export interface AuthenticatedRequest extends Request {
  userId: string;
  email: string;
  cognitoId: string;
  planTier: string;
  token: string;
}

export function authMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  try {
    // Extract token from Authorization header
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      sendError(res, ERROR_CODES.AUTH_REQUIRED, "Missing or invalid authorization header");
      return;
    }

    const token = authHeader.slice(7); // Remove "Bearer " prefix

    // Parse JWT (no external verification needed for Cognito in dev)
    const payload = parseJwtPayload(token);
    if (!payload) {
      sendError(res, ERROR_CODES.INVALID_CREDENTIALS, "Invalid JWT format");
      return;
    }

    // Check expiration
    if (isTokenExpired(payload)) {
      sendError(res, ERROR_CODES.TOKEN_EXPIRED, "Token has expired");
      return;
    }

    // Attach to request
    (req as AuthenticatedRequest).userId = payload.sub;
    (req as AuthenticatedRequest).email = payload.email;
    (req as AuthenticatedRequest).cognitoId = payload.cognitoId;
    (req as AuthenticatedRequest).planTier = payload.planTier;
    (req as AuthenticatedRequest).token = token;

    next();
  } catch (error) {
    sendError(
      res,
      ERROR_CODES.AUTH_REQUIRED,
      "Authentication failed",
      HTTP_STATUS.UNAUTHORIZED
    );
  }
}

/**
 * Optional auth middleware (doesn't fail if no token)
 */
export function optionalAuthMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  try {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith("Bearer ")) {
      const token = authHeader.slice(7);
      const payload = parseJwtPayload(token);

      if (payload && !isTokenExpired(payload)) {
        (req as AuthenticatedRequest).userId = payload.sub;
        (req as AuthenticatedRequest).email = payload.email;
        (req as AuthenticatedRequest).cognitoId = payload.cognitoId;
        (req as AuthenticatedRequest).planTier = payload.planTier;
        (req as AuthenticatedRequest).token = token;
      }
    }
  } catch {
    // Silently fail - continue without auth
  }

  next();
}
