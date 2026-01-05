/**
 * Global Rate Limiter
 * 
 * Simple Semaphore implementation to limit concurrent operations across the worker.
 * Integrated with CircuitBreaker to dynamically lower limits during failure storms.
 */

class RateLimiter {
    constructor() {
        this.limits = {
            RESOLVE: 2,
            METADATA: 2,
            DOWNLOAD: 2
        };

        this.active = {
            RESOLVE: 0,
            METADATA: 0,
            DOWNLOAD: 0
        };

        this.queues = {
            RESOLVE: [],
            METADATA: [],
            DOWNLOAD: []
        };
    }

    /**
     * Set a new limit for a specific operation type
     * Used by CircuitBreaker to throttle concurrency.
     */
    setLimit(type, limit) {
        if (this.limits[type] !== undefined) {
            console.log(`[RateLimiter] Updating limit for ${type}: ${this.limits[type]} -> ${limit}`);
            this.limits[type] = limit;
            // Attempt to process queue in case limit was raised
            this._processQueue(type);
        }
    }

    async acquire(type) {
        if (!this.limits[type]) throw new Error(`Unknown rate limit type: ${type}`);

        if (this.active[type] < this.limits[type]) {
            this.active[type]++;
            return true;
        }

        return new Promise(resolve => {
            this.queues[type].push(resolve);
        });
    }

    release(type) {
        if (this.active[type] > 0) {
            this.active[type]--;
            this._processQueue(type);
        }
    }

    _processQueue(type) {
        if (this.queues[type].length > 0 && this.active[type] < this.limits[type]) {
            this.active[type]++;
            const next = this.queues[type].shift();
            next(true);
        }
    }

    async run(type, fn) {
        await this.acquire(type);
        try {
            return await fn();
        } finally {
            this.release(type);
        }
    }
}

const rateLimiter = new RateLimiter();
module.exports = rateLimiter;
