/**
 * Validation middleware
 * Validates request bodies, query params, and path params
 */

import type { Request, Response, NextFunction } from "express";
import { z } from "zod";
import { sendError } from "../lib/errors";
import { ERROR_CODES } from "@packages/shared";

export type ValidationSchema = z.ZodSchema;

export interface ValidationConfig {
  body?: ValidationSchema;
  query?: ValidationSchema;
  params?: ValidationSchema;
}

export function validateRequest(config: ValidationConfig) {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      // Validate body
      if (config.body) {
        const result = config.body.safeParse(req.body);
        if (!result.success) {
          sendError(
            res,
            ERROR_CODES.VALIDATION_ERROR,
            "Request body validation failed",
            422,
            { errors: result.error.flatten() }
          );
          return;
        }
        req.body = result.data;
      }

      // Validate query parameters
      if (config.query) {
        const result = config.query.safeParse(req.query);
        if (!result.success) {
          sendError(
            res,
            ERROR_CODES.VALIDATION_ERROR,
            "Query parameters validation failed",
            422,
            { errors: result.error.flatten() }
          );
          return;
        }
        req.query = result.data as any;
      }

      // Validate path parameters
      if (config.params) {
        const result = config.params.safeParse(req.params);
        if (!result.success) {
          sendError(
            res,
            ERROR_CODES.VALIDATION_ERROR,
            "Path parameters validation failed",
            422,
            { errors: result.error.flatten() }
          );
          return;
        }
        req.params = result.data as any;
      }

      next();
    } catch (error) {
      sendError(
        res,
        ERROR_CODES.VALIDATION_ERROR,
        "Validation failed",
        422,
        { error: String(error) }
      );
    }
  };
}

/**
 * Quick validation function for handlers
 */
export function validateData<T>(
  schema: ValidationSchema,
  data: unknown
): { valid: true; data: T } | { valid: false; errors: unknown } {
  const result = schema.safeParse(data);
  if (result.success) {
    return { valid: true, data: result.data as T };
  }
  return { valid: false, errors: result.error.flatten() };
}
