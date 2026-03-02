/**
 * Rate limiting middleware
 * Enforces API rate limits per user and per endpoint
 */

import type { Request, Response, NextFunction } from "express";
import { sendError } from "../lib/errors";
import { ERROR_CODES, TokenBucketLimiter } from "@packages/shared";

interface RateLimitConfig {
  windowSeconds: number;
  maxRequests: number;
}

// Rate limit configs per endpoint
const ENDPOINT_LIMITS: Record<string, RateLimitConfig> = {
  // Auth endpoints - higher limit
  "/auth/login": { windowSeconds: 60, maxRequests: 10 },
  "/auth/register": { windowSeconds: 60, maxRequests: 5 },

  // Job search - moderate limit
  "/jobs/search": { windowSeconds: 60, maxRequests: 20 },
  "/jobs/list": { windowSeconds: 60, maxRequests: 30 },

  // Resume endpoints - moderate limit
  "/resumes/upload": { windowSeconds: 60, maxRequests: 5 },
  "/resumes/optimize": { windowSeconds: 60, maxRequests: 3 },
  "/resumes/score": { windowSeconds: 60, maxRequests: 10 },

  // Application endpoints - strict limit (critical operation)
  "/applications/create": { windowSeconds: 60, maxRequests: 20 },
  "/applications/submit": { windowSeconds: 60, maxRequests: 10 },

  // Default fallback
  default: { windowSeconds: 60, maxRequests: 100 },
};

// Per-user rate limiters (stored in memory for now, use Redis in production)
const userLimiters = new Map<string, TokenBucketLimiter>();

function getOrCreateLimiter(
  userId: string,
  config: RateLimitConfig
): TokenBucketLimiter {
  const key = `${userId}`;

  if (!userLimiters.has(key)) {
    userLimiters.set(
      key,
      new TokenBucketLimiter({
        capacity: config.maxRequests,
        refillRate: config.maxRequests / config.windowSeconds,
        window: config.windowSeconds,
      })
    );
  }

  return userLimiters.get(key)!;
}

export function rateLimitMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  // Skip rate limiting for unauthenticated requests (auth endpoints)
  const userId = (req as any).userId;
  if (!userId) {
    next();
    return;
  }

  // Get rate limit config for this endpoint
  const path = req.path;
  const config = ENDPOINT_LIMITS[path] || ENDPOINT_LIMITS.default;

  // Get or create limiter for this user
  const limiter = getOrCreateLimiter(userId, config);

  // Check if request is allowed
  (async () => {
    const result = await limiter.checkLimit(1);

    if (!result.allowed) {
      return sendError(
        res,
        ERROR_CODES.RATE_LIMIT,
        `Rate limit exceeded. Retry after ${result.retryAfter} seconds`,
        429,
        {
          retryAfter: result.retryAfter,
          resetAt: result.resetAt.toISOString(),
        }
      );
    }

    // Attach rate limit info to response headers
    res.setHeader("X-RateLimit-Remaining", result.remaining);
    res.setHeader("X-RateLimit-Reset", result.resetAt.toISOString());

    next();
  })();
}

/**
 * Get current rate limit status for a user
 */
export function getRateLimitStatus(userId: string, endpoint: string): object {
  const config = ENDPOINT_LIMITS[endpoint] || ENDPOINT_LIMITS.default;
  const limiter = getOrCreateLimiter(userId, config);

  return {
    remaining: limiter.getRemainingTokens(),
    capacity: config.maxRequests,
    windowSeconds: config.windowSeconds,
  };
}

/**
 * Reset rate limit for a user (admin only)
 */
export function resetRateLimit(userId: string): void {
  const key = userId;
  userLimiters.delete(key);
}
