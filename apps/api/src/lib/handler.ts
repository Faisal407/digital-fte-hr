/**
 * Handler utilities and helpers
 * Base functions for creating API handlers
 */

import type { Request, Response, NextFunction } from "express";
import { z } from "zod";
import { sendError, sendSuccess, sendAccepted, logError } from "./errors";
import { validateData } from "../middleware/validation";
import { AuditLogger } from "@packages/shared";
import type { AuthenticatedRequest } from "../middleware/auth";

export interface HandlerContext {
  userId: string;
  planTier: string;
  correlationId: string;
  requestId: string;
}

/**
 * Extract handler context from request
 */
export function getContext(req: Request): HandlerContext {
  const authReq = req as AuthenticatedRequest;
  return {
    userId: authReq.userId || "anonymous",
    planTier: authReq.planTier || "free",
    correlationId: req.headers["x-correlation-id"] as string,
    requestId: (req as any).requestId,
  };
}

/**
 * Validate request data and return context
 */
export async function validateAndGetContext(
  req: Request,
  bodySchema?: z.ZodSchema
): Promise<{
  valid: boolean;
  context: HandlerContext;
  data?: any;
  error?: any;
}> {
  const context = getContext(req);

  if (bodySchema) {
    const validation = validateData(bodySchema, req.body);
    if (!validation.valid) {
      return {
        valid: false,
        context,
        error: validation.errors,
      };
    }
    return {
      valid: true,
      context,
      data: validation.data,
    };
  }

  return {
    valid: true,
    context,
  };
}

/**
 * Log action (before execution)
 */
export async function logActionStart(
  context: HandlerContext,
  action: string,
  agent: string,
  inputData?: any
): Promise<void> {
  try {
    await AuditLogger.logStart(
      context.correlationId,
      context.userId,
      action,
      agent,
      inputData
    );
  } catch (error) {
    // Don't fail the request if audit logging fails
    console.error("Failed to log action start:", error);
  }
}

/**
 * Log action completion
 */
export async function logActionComplete(
  context: HandlerContext,
  action: string,
  agent: string,
  outputData?: any,
  resultCode?: string
): Promise<void> {
  try {
    await AuditLogger.logCompleted(
      context.correlationId,
      context.userId,
      action,
      agent,
      outputData,
      resultCode
    );
  } catch (error) {
    console.error("Failed to log action completion:", error);
  }
}

/**
 * Log action failure
 */
export async function logActionFailed(
  context: HandlerContext,
  action: string,
  agent: string,
  error: Error | string,
  context_data?: any
): Promise<void> {
  try {
    await AuditLogger.logFailed(
      context.correlationId,
      context.userId,
      action,
      agent,
      error,
      context_data
    );
  } catch (err) {
    console.error("Failed to log action failure:", err);
  }
}

/**
 * Wrap handler with error handling and context
 */
export function withMiddleware<T extends (req: Request, res: Response) => Promise<void>>(
  handler: T
): T {
  return (async (req: Request, res: Response) => {
    try {
      await handler(req, res);
    } catch (error) {
      logError(error, {
        path: req.path,
        method: req.method,
        userId: (req as AuthenticatedRequest).userId,
      });

      if (!res.headersSent) {
        sendError(res, "INTERNAL_ERROR", "An unexpected error occurred", 500);
      }
    }
  }) as T;
}

/**
 * Type-safe async handler
 */
export function asyncHandler(
  fn: (req: Request, res: Response, next: NextFunction) => Promise<void>
) {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch((error) => {
      next(error);
    });
  };
}

/**
 * Assert user is authenticated
 */
export function assertAuthenticated(
  req: Request,
  res: Response
): AuthenticatedRequest | null {
  const authReq = req as AuthenticatedRequest;
  if (!authReq.userId) {
    sendError(res, "AUTH_REQUIRED", "Authentication required", 401);
    return null;
  }
  return authReq;
}

/**
 * Assert user has access to resource (row-level security)
 */
export function assertOwnership(
  userId: string,
  resourceOwnerId: string,
  res: Response
): boolean {
  if (userId !== resourceOwnerId) {
    sendError(res, "FORBIDDEN", "Access denied", 403);
    return false;
  }
  return true;
}

/**
 * Paginate query results
 */
export function getPaginationParams(query: any) {
  const page = Math.max(1, parseInt(query.page || "1", 10));
  const pageSize = Math.min(100, Math.max(1, parseInt(query.pageSize || "20", 10)));
  const skip = (page - 1) * pageSize;

  return { page, pageSize, skip };
}
