/**
 * Rate limiting utility for MCP server
 */

interface RateLimitEntry {
    count: number;
    resetTime: number;
}

export class RateLimiter {
    private requests: Map<string, RateLimitEntry> = new Map();
    private readonly maxRequests: number;
    private readonly windowMs: number;
    private readonly cleanupInterval: ReturnType<typeof setInterval>;

    constructor(maxRequests: number = 100, windowMs: number = 60000) { // Default: 100 requests per minute
        this.maxRequests = maxRequests;
        this.windowMs = windowMs;
        
        // Clean up expired entries every minute
        this.cleanupInterval = setInterval(() => {
            this.cleanup();
        }, 60000);
    }

    /**
     * Check if a request should be allowed
     * @param identifier - Unique identifier for the client (IP, user ID, etc.)
     * @returns true if request is allowed, false if rate limited
     */
    public isAllowed(identifier: string): boolean {
        const now = Date.now();
        const entry = this.requests.get(identifier);

        if (!entry || now > entry.resetTime) {
            // First request or window expired
            this.requests.set(identifier, {
                count: 1,
                resetTime: now + this.windowMs
            });
            return true;
        }

        if (entry.count >= this.maxRequests) {
            return false; // Rate limit exceeded
        }

        entry.count++;
        return true;
    }

    /**
     * Get remaining requests for an identifier
     */
    public getRemainingRequests(identifier: string): number {
        const entry = this.requests.get(identifier);
        if (!entry || Date.now() > entry.resetTime) {
            return this.maxRequests;
        }
        return Math.max(0, this.maxRequests - entry.count);
    }

    /**
     * Get reset time for an identifier
     */
    public getResetTime(identifier: string): number {
        const entry = this.requests.get(identifier);
        if (!entry || Date.now() > entry.resetTime) {
            return Date.now() + this.windowMs;
        }
        return entry.resetTime;
    }

    /**
     * Clean up expired entries
     */
    private cleanup(): void {
        const now = Date.now();
        for (const [key, entry] of this.requests.entries()) {
            if (now > entry.resetTime) {
                this.requests.delete(key);
            }
        }
    }

    /**
     * Clear all rate limit data
     */
    public clear(): void {
        this.requests.clear();
    }

    /**
     * Destroy the rate limiter and cleanup interval
     */
    public destroy(): void {
        clearInterval(this.cleanupInterval);
        this.clear();
    }
}

// Global rate limiter instance
export const globalRateLimiter = new RateLimiter(100, 60000); // 100 requests per minute
