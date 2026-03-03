/**
 * Request context middleware
 * Sets up correlation ID, request ID, logging
 */

import type { Request, Response, NextFunction } from "express";
import { v4 as uuidv4 } from "uuid";
import { AuditLogger } from "@packages/shared";

export interface RequestContext {
  requestId: string;
  correlationId: string;
  userId?: string;
  startTime: number;
}

export function contextMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  // Generate or extract correlation ID
  const correlationId =
    (req.headers["x-correlation-id"] as string) ||
    (req.headers["x-request-id"] as string) ||
    uuidv4();

  // Generate unique request ID
  const requestId = uuidv4();

  // Set up response locals
  res.locals.requestId = requestId;
  res.locals.correlationId = correlationId;
  res.locals.startTime = Date.now();

  // Set correlation ID in response headers
  res.setHeader("X-Correlation-ID", correlationId);
  res.setHeader("X-Request-ID", requestId);

  // Log request
  const method = req.method;
  const path = req.path;
  console.log(`[${requestId}] ${method} ${path}`);

  // Hook into response send to log completion
  const originalSend = res.send;
  res.send = function (data: any) {
    const duration = Date.now() - res.locals.startTime;
    const statusCode = res.statusCode;

    console.log(
      `[${requestId}] ${method} ${path} - ${statusCode} (${duration}ms)`
    );

    return originalSend.call(this, data);
  };

  next();
}

/**
 * Error logging middleware
 */
export function errorLoggingMiddleware(
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const requestId = res.locals.requestId;
  const correlationId = res.locals.correlationId;

  console.error(`[${requestId}] Error:`, {
    message: err.message,
    stack: err.stack,
    correlationId,
    path: req.path,
    method: req.method,
  });

  // Try to send error response
  if (!res.headersSent) {
    res.status(500).json({
      success: false,
      error: {
        code: "INTERNAL_ERROR",
        message: "An unexpected error occurred",
      },
      meta: {
        timestamp: new Date().toISOString(),
        requestId,
        correlationId,
      },
    });
  }
}

/**
 * Async handler wrapper (catches errors from async route handlers)
 */
export function asyncHandler(fn: Function) {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch((error) => {
      next(error);
    });
  };
}
