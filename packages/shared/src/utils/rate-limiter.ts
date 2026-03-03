/**
 * Rate limiting with Redis token bucket
 * Mandatory for all platform APIs and LLM calls
 */

import type { RateLimitResult, TokenBucket } from "../types/index";

export interface RateLimiterConfig {
  capacity: number; // Max tokens
  refillRate: number; // Tokens per second
  window?: number; // Time window in seconds (optional, for reset)
}

export class TokenBucketLimiter {
  private bucket: TokenBucket;
  private config: RateLimiterConfig;

  constructor(config: RateLimiterConfig) {
    this.config = config;
    this.bucket = {
      tokens: config.capacity,
      capacity: config.capacity,
      lastRefillAt: Date.now(),
    };
  }

  async checkLimit(tokensNeeded: number = 1): Promise<RateLimitResult> {
    this.refill();

    if (this.bucket.tokens >= tokensNeeded) {
      this.bucket.tokens -= tokensNeeded;
      return {
        allowed: true,
        remaining: this.bucket.tokens,
        resetAt: new Date(this.bucket.lastRefillAt + this.config.window! * 1000),
      };
    }

    const tokensNeededMs = (tokensNeeded - this.bucket.tokens) / this.config.refillRate;
    const resetAt = new Date(Date.now() + tokensNeededMs * 1000);

    return {
      allowed: false,
      remaining: this.bucket.tokens,
      resetAt,
      retryAfter: Math.ceil(tokensNeededMs / 1000),
    };
  }

  private refill(): void {
    const now = Date.now();
    const timePassed = (now - this.bucket.lastRefillAt) / 1000;
    const tokensToAdd = timePassed * this.config.refillRate;

    this.bucket.tokens = Math.min(
      this.bucket.capacity,
      this.bucket.tokens + tokensToAdd
    );
    this.bucket.lastRefillAt = now;
  }

  getRemainingTokens(): number {
    this.refill();
    return Math.floor(this.bucket.tokens);
  }
}

// ============================================================================
// Redis-backed rate limiter (for distributed systems)
// ============================================================================

export class RedisTokenBucketLimiter {
  constructor(
    private redisClient: any, // Redis client
    private keyPrefix: string,
    private config: RateLimiterConfig
  ) {}

  async checkLimit(identifier: string, tokensNeeded: number = 1): Promise<RateLimitResult> {
    const key = `${this.keyPrefix}:${identifier}`;

    // Use Redis SCRIPT to atomically check and deduct tokens
    const lua = `
      local key = KEYS[1]
      local now = tonumber(ARGV[1])
      local capacity = tonumber(ARGV[2])
      local refillRate = tonumber(ARGV[3])
      local tokensNeeded = tonumber(ARGV[4])

      local current = redis.call('HGETALL', key)
      local tokens = 0
      local lastRefillAt = now

      if #current > 0 then
        tokens = tonumber(current[2])
        lastRefillAt = tonumber(current[4])
      end

      -- Calculate refilled tokens
      local timePassed = (now - lastRefillAt) / 1000
      local tokensAdded = timePassed * refillRate
      tokens = math.min(capacity, tokens + tokensAdded)

      -- Check if we have enough tokens
      if tokens >= tokensNeeded then
        tokens = tokens - tokensNeeded
        redis.call('HSET', key, 'tokens', tokens, 'lastRefillAt', now)
        redis.call('EXPIRE', key, capacity)
        return {1, tokens, now}
      else
        return {0, tokens, now}
      end
    `;

    const result = await this.redisClient.eval(lua, 1, key, Date.now(), this.config.capacity, this.config.refillRate, tokensNeeded);

    if (result[0] === 1) {
      return {
        allowed: true,
        remaining: Math.floor(result[1]),
        resetAt: new Date(Date.now() + this.config.window! * 1000),
      };
    }

    const tokensNeededMs = (tokensNeeded - result[1]) / this.config.refillRate;
    const resetAt = new Date(Date.now() + tokensNeededMs * 1000);

    return {
      allowed: false,
      remaining: Math.floor(result[1]),
      resetAt,
      retryAfter: Math.ceil(tokensNeededMs / 1000),
    };
  }

  async reset(identifier: string): Promise<void> {
    const key = `${this.keyPrefix}:${identifier}`;
    await this.redisClient.del(key);
  }
}

// ============================================================================
// Rate limit middleware helpers
// ============================================================================

export async function checkRateLimit(
  limiter: TokenBucketLimiter | RedisTokenBucketLimiter,
  identifier: string,
  tokensNeeded?: number
): Promise<RateLimitResult> {
  if (limiter instanceof RedisTokenBucketLimiter) {
    return limiter.checkLimit(identifier, tokensNeeded);
  } else {
    return limiter.checkLimit(tokensNeeded);
  }
}
