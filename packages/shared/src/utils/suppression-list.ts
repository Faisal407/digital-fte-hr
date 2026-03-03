/**
 * Suppression list management
 * Track blocked recipients per channel
 */

export interface SuppressionEntry {
  identifier: string; // phone, email, telegram_id
  channel: string;
  reason: string; // "user_requested" | "bounce" | "spam_complaint" | "invalid"
  addedAt: Date;
  expiresAt?: Date;
}

export class SuppressionList {
  private suppressions = new Map<string, SuppressionEntry>();

  /**
   * Check if recipient is suppressed
   */
  isBlocked(channel: string, identifier: string): boolean {
    const key = `${channel}:${identifier}`;
    const entry = this.suppressions.get(key);

    if (!entry) return false;

    // Check expiration
    if (entry.expiresAt && entry.expiresAt < new Date()) {
      this.suppressions.delete(key);
      return false;
    }

    return true;
  }

  /**
   * Add to suppression list
   */
  add(
    channel: string,
    identifier: string,
    reason: string,
    expiresAt?: Date
  ): void {
    const key = `${channel}:${identifier}`;
    this.suppressions.set(key, {
      identifier,
      channel,
      reason,
      addedAt: new Date(),
      expiresAt,
    });
  }

  /**
   * Remove from suppression list
   */
  remove(channel: string, identifier: string): void {
    const key = `${channel}:${identifier}`;
    this.suppressions.delete(key);
  }

  /**
   * Get all suppressed for a channel
   */
  getForChannel(channel: string): SuppressionEntry[] {
    const result: SuppressionEntry[] = [];

    for (const entry of this.suppressions.values()) {
      if (
        entry.channel === channel &&
        (!entry.expiresAt || entry.expiresAt >= new Date())
      ) {
        result.push(entry);
      }
    }

    return result;
  }

  /**
   * Bulk add suppressions (e.g., from bounce handling)
   */
  bulkAdd(entries: SuppressionEntry[]): void {
    for (const entry of entries) {
      const key = `${entry.channel}:${entry.identifier}`;
      this.suppressions.set(key, entry);
    }
  }

  /**
   * Export suppressions for backup/sync
   */
  export(): SuppressionEntry[] {
    return Array.from(this.suppressions.values());
  }

  /**
   * Clear expired entries
   */
  cleanup(): number {
    let removed = 0;
    const now = new Date();

    for (const [key, entry] of this.suppressions.entries()) {
      if (entry.expiresAt && entry.expiresAt < now) {
        this.suppressions.delete(key);
        removed++;
      }
    }

    return removed;
  }

  /**
   * Get statistics
   */
  getStats(): Record<string, number> {
    const stats: Record<string, number> = {};

    for (const entry of this.suppressions.values()) {
      stats[entry.channel] = (stats[entry.channel] || 0) + 1;
    }

    return stats;
  }
}

// ============================================================================
// Redis-backed suppression list (for distributed systems)
// ============================================================================

export class RedisSuppressionList {
  constructor(
    private redisClient: any, // Redis client
    private keyPrefix: string = "suppression"
  ) {}

  async isBlocked(channel: string, identifier: string): Promise<boolean> {
    const key = `${this.keyPrefix}:${channel}:${identifier}`;
    const exists = await this.redisClient.exists(key);
    return exists === 1;
  }

  async add(
    channel: string,
    identifier: string,
    reason: string,
    ttlSeconds?: number
  ): Promise<void> {
    const key = `${this.keyPrefix}:${channel}:${identifier}`;
    await this.redisClient.set(key, JSON.stringify({ reason, addedAt: new Date().toISOString() }));

    if (ttlSeconds) {
      await this.redisClient.expire(key, ttlSeconds);
    }
  }

  async remove(channel: string, identifier: string): Promise<void> {
    const key = `${this.keyPrefix}:${channel}:${identifier}`;
    await this.redisClient.del(key);
  }

  async getForChannel(channel: string): Promise<SuppressionEntry[]> {
    const pattern = `${this.keyPrefix}:${channel}:*`;
    const keys = await this.redisClient.keys(pattern);

    const entries: SuppressionEntry[] = [];

    for (const key of keys) {
      const value = await this.redisClient.get(key);
      if (value) {
        const [, chan, identifier] = key.split(":");
        const data = JSON.parse(value);
        entries.push({
          identifier,
          channel: chan,
          reason: data.reason,
          addedAt: new Date(data.addedAt),
        });
      }
    }

    return entries;
  }

  async bulkAdd(entries: SuppressionEntry[], ttlSeconds?: number): Promise<void> {
    const pipeline = this.redisClient.pipeline();

    for (const entry of entries) {
      const key = `${this.keyPrefix}:${entry.channel}:${entry.identifier}`;
      pipeline.set(key, JSON.stringify(entry));

      if (ttlSeconds) {
        pipeline.expire(key, ttlSeconds);
      }
    }

    await pipeline.exec();
  }

  async cleanup(): Promise<number> {
    // Redis TTLs handle automatic expiration
    return 0;
  }

  async getStats(): Promise<Record<string, number>> {
    const pattern = `${this.keyPrefix}:*:*`;
    const keys = await this.redisClient.keys(pattern);

    const stats: Record<string, number> = {};

    for (const key of keys) {
      const [, channel] = key.split(":");
      stats[channel] = (stats[channel] || 0) + 1;
    }

    return stats;
  }
}

/**
 * Global instance (use in single-server scenarios)
 */
export const suppressionList = new SuppressionList();
