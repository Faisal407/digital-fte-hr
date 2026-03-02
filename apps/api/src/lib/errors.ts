/**
 * API Error handling
 */

import type { Response } from "express";
import {
  ERROR_CODES,
  ERROR_CODE_TO_STATUS,
  HTTP_STATUS,
  sanitizeForLogging,
} from "@packages/shared";

export class ApiError extends Error {
  constructor(
    public code: string,
    public message: string,
    public statusCode: number = 400,
    public details?: Record<string, unknown>
  ) {
    super(message);
    this.name = "ApiError";
  }
}

export function getHttpStatus(errorCode: string): number {
  return ERROR_CODE_TO_STATUS[errorCode] || HTTP_STATUS.INTERNAL_SERVER_ERROR;
}

export function sendError(
  res: Response,
  code: string,
  message: string,
  statusCode?: number,
  details?: Record<string, unknown>
): Response {
  const status = statusCode || getHttpStatus(code);

  return res.status(status).json({
    success: false,
    error: {
      code,
      message,
      ...(details && { details }),
    },
    meta: {
      timestamp: new Date().toISOString(),
      requestId: res.locals.requestId,
    },
  });
}

export function sendSuccess<T>(
  res: Response,
  data: T,
  statusCode: number = HTTP_STATUS.OK,
  meta?: Record<string, unknown>
): Response {
  return res.status(statusCode).json({
    success: true,
    data,
    meta: {
      timestamp: new Date().toISOString(),
      requestId: res.locals.requestId,
      ...meta,
    },
  });
}

export function sendPaginated<T>(
  res: Response,
  data: T[],
  page: number,
  pageSize: number,
  total: number,
  statusCode: number = HTTP_STATUS.OK
): Response {
  const hasMore = page * pageSize < total;

  return res.status(statusCode).json({
    success: true,
    data,
    pagination: {
      page,
      pageSize,
      total,
      hasMore,
    },
    meta: {
      timestamp: new Date().toISOString(),
      requestId: res.locals.requestId,
    },
  });
}

export function sendAccepted(
  res: Response,
  jobId: string,
  message: string = "Request accepted for processing"
): Response {
  return res.status(HTTP_STATUS.ACCEPTED).json({
    success: true,
    data: {
      jobId,
      status: "accepted",
      message,
    },
    meta: {
      timestamp: new Date().toISOString(),
      requestId: res.locals.requestId,
    },
  });
}

/**
 * Safe error logging (masks PII)
 */
export function logError(
  error: unknown,
  context: Record<string, unknown> = {}
): void {
  const sanitized = sanitizeForLogging({
    error: error instanceof Error ? error.message : String(error),
    stack: error instanceof Error ? error.stack : undefined,
    ...context,
  });

  console.error("[API Error]", JSON.stringify(sanitized));
}
