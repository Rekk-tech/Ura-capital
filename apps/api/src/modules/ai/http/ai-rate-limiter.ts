/**
 * In-memory sliding window rate limiter for Aura Intelligence AI endpoints.
 * Enforces per-user limits to prevent inference flooding and server collapse.
 */
export interface RateLimitStatus {
  allowed: boolean;
  limit: number;
  remaining: number;
  retryAfterSeconds: number;
}

export interface AIRateLimiterOptions {
  windowMs?: number;
  subscriberLimit?: number;
  adminLimit?: number;
}

export class AIRateLimiter {
  private readonly windowMs: number;
  private readonly subscriberLimit: number;
  private readonly adminLimit: number;
  private readonly userTimestamps: Map<string, number[]>;

  constructor(options: AIRateLimiterOptions = {}) {
    this.windowMs = options.windowMs ?? 60_000; // 1 minute window
    this.subscriberLimit = options.subscriberLimit ?? 20; // 20 req/min for subscribers
    this.adminLimit = options.adminLimit ?? 100; // 100 req/min for admins
    this.userTimestamps = new Map();
  }

  /**
   * Checks whether the user is permitted to make an AI request.
   * If permitted, records the timestamp and returns remaining quota.
   */
  checkLimit(userId: string, role: string = "LEARNER"): RateLimitStatus {
    const now = Date.now();
    const limit = role === "ADMIN" ? this.adminLimit : this.subscriberLimit;
    const windowStart = now - this.windowMs;

    // Retrieve existing timestamps and prune expired entries
    const timestamps = this.userTimestamps.get(userId) || [];
    const validTimestamps = timestamps.filter((t) => t > windowStart);

    if (validTimestamps.length >= limit) {
      // Oldest timestamp in window determines retry-after
      const oldest = validTimestamps[0] || windowStart;
      const retryAfterMs = Math.max(1_000, oldest + this.windowMs - now);
      const retryAfterSeconds = Math.ceil(retryAfterMs / 1000);

      this.userTimestamps.set(userId, validTimestamps);

      return {
        allowed: false,
        limit,
        remaining: 0,
        retryAfterSeconds,
      };
    }

    // Record this request
    validTimestamps.push(now);
    this.userTimestamps.set(userId, validTimestamps);

    return {
      allowed: true,
      limit,
      remaining: Math.max(0, limit - validTimestamps.length),
      retryAfterSeconds: 0,
    };
  }

  /**
   * Resets rate limiter memory.
   */
  reset(userId?: string): void {
    if (userId) {
      this.userTimestamps.delete(userId);
    } else {
      this.userTimestamps.clear();
    }
  }
}

export const aiRateLimiter = new AIRateLimiter();
