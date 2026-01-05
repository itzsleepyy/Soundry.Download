/**
 * Simple Promise-based Semaphore / Rate Limiter
 * Used to limit concurrent operations to YouTube to avoid IP bans.
 */
class RateLimiter {
    constructor() {
        // Define limits for different operation types
        this.limits = {
            RESOLVE: 2,   // URL resolution
            METADATA: 2,  // Metadata fetching
            DOWNLOAD: 2   // Actual heavy downloads
        };

        // Track active counts
        this.active = {
            RESOLVE: 0,
            METADATA: 0,
            DOWNLOAD: 0
        };

        // Queues for waiting tasks
        this.queues = {
            RESOLVE: [],
            METADATA: [],
            DOWNLOAD: []
        };
    }

    /**
     * Acquire a slot for the given operation type
     * @param {string} type - 'RESOLVE', 'METADATA', or 'DOWNLOAD'
     * @returns {Promise<void>}
     */
    async acquire(type) {
        if (!this.limits[type]) {
            throw new Error(`Unknown rate limit type: ${type}`);
        }

        if (this.active[type] < this.limits[type]) {
            this.active[type]++;
            return Promise.resolve();
        }

        // Wait in queue
        return new Promise((resolve) => {
            this.queues[type].push(resolve);
        });
    }

    /**
     * Release a slot for the given operation type
     * @param {string} type - 'RESOLVE', 'METADATA', or 'DOWNLOAD'
     */
    release(type) {
        if (!this.limits[type]) return;

        if (this.queues[type].length > 0) {
            // Give slot to next in line (active count stays same)
            const nextResolve = this.queues[type].shift();
            nextResolve();
        } else {
            this.active[type]--;
        }
    }

    /**
     * Wrap a function execution with rate limiting
     * @param {string} type 
     * @param {Function} fn 
     */
    async run(type, fn) {
        await this.acquire(type);
        try {
            return await fn();
        } finally {
            this.release(type);
        }
    }
}

// Export singleton instance
const rateLimiter = new RateLimiter();
module.exports = rateLimiter;
