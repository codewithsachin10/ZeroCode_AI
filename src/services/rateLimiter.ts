/**
 * Advanced Rate Limiting Service
 * Tracks and enforces rate limits for various features and API endpoints
 */

interface RateLimitConfig {
  maxRequests: number;
  windowMs: number; // Time window in milliseconds
  message?: string;
}

interface RateLimitRecord {
  count: number;
  resetTime: number;
}

interface RateLimitStatus {
  remaining: number;
  limit: number;
  resetTime: number;
  isLimited: boolean;
}

class RateLimiter {
  private limits: Map<string, RateLimitConfig> = new Map();
  private requests: Map<string, RateLimitRecord> = new Map();

  // Default configurations
  private defaultConfigs: Record<string, RateLimitConfig> = {
    chat: { maxRequests: 10, windowMs: 24 * 60 * 60 * 1000, message: 'Chat limit exceeded' },
    promptCopy: { maxRequests: 50, windowMs: 24 * 60 * 60 * 1000, message: 'Prompt copy limit exceeded' },
    videoCompletion: { maxRequests: 100, windowMs: 24 * 60 * 60 * 1000, message: 'Video completion limit exceeded' },
    certificateGeneration: { maxRequests: 5, windowMs: 24 * 60 * 60 * 1000, message: 'Certificate generation limit exceeded' },
    apiCall: { maxRequests: 100, windowMs: 60 * 1000, message: 'API rate limit exceeded' },
  };

  /**
   * Register a rate limit configuration
   */
  registerLimit(key: string, config: RateLimitConfig): void {
    this.limits.set(key, config);
  }

  /**
   * Get or create a rate limit configuration
   */
  private getOrCreateLimit(key: string): RateLimitConfig {
    if (!this.limits.has(key) && !this.defaultConfigs[key]) {
      // Default to 100 requests per minute
      return { maxRequests: 100, windowMs: 60 * 1000 };
    }

    return this.limits.get(key) || this.defaultConfigs[key]!;
  }

  /**
   * Check if a request is allowed under rate limit
   */
  isAllowed(key: string, identifier: string): RateLimitStatus {
    const config = this.getOrCreateLimit(key);
    const recordKey = `${key}:${identifier}`;
    const now = Date.now();

    let record = this.requests.get(recordKey);

    // Initialize or reset if window has passed
    if (!record || now > record.resetTime) {
      record = {
        count: 0,
        resetTime: now + config.windowMs,
      };
      this.requests.set(recordKey, record);
    }

    const isLimited = record.count >= config.maxRequests;

    if (!isLimited) {
      record.count++;
    }

    return {
      remaining: Math.max(0, config.maxRequests - record.count),
      limit: config.maxRequests,
      resetTime: record.resetTime,
      isLimited,
    };
  }

  /**
   * Consume a rate limit (increment count)
   */
  consume(key: string, identifier: string, amount: number = 1): RateLimitStatus {
    const config = this.getOrCreateLimit(key);
    const recordKey = `${key}:${identifier}`;
    const now = Date.now();

    let record = this.requests.get(recordKey);

    // Initialize or reset if window has passed
    if (!record || now > record.resetTime) {
      record = {
        count: 0,
        resetTime: now + config.windowMs,
      };
      this.requests.set(recordKey, record);
    }

    record.count += amount;

    const isLimited = record.count > config.maxRequests;

    return {
      remaining: Math.max(0, config.maxRequests - record.count),
      limit: config.maxRequests,
      resetTime: record.resetTime,
      isLimited,
    };
  }

  /**
   * Reset rate limit for a specific identifier
   */
  reset(key: string, identifier: string): void {
    const recordKey = `${key}:${identifier}`;
    this.requests.delete(recordKey);
  }

  /**
   * Reset all rate limits
   */
  resetAll(): void {
    this.requests.clear();
  }

  /**
   * Get statistics about rate limits
   */
  getStats(key?: string): Record<string, unknown> {
    if (key) {
      const recordKey = Array.from(this.requests.keys()).filter((k) => k.startsWith(key));
      return Object.fromEntries(recordKey.map((k) => [k, this.requests.get(k)]));
    }

    return Object.fromEntries(this.requests);
  }

  /**
   * Cleanup expired records
   */
  cleanup(): void {
    const now = Date.now();

    for (const [key, record] of this.requests.entries()) {
      if (now > record.resetTime) {
        this.requests.delete(key);
      }
    }
  }
}

export const rateLimiter = new RateLimiter();

export default rateLimiter;
