/**
 * Circuit Breaker Service
 * 
 * Monitors system health and triggers "Safe Mode" during failure spikes.
 */
const Redis = require('ioredis');
const rateLimiter = require('./rateLimiter');

const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';
const WINDOW_SIZE = 20; // Track last 20 operations
const FAILURE_THRESHOLD = 0.5; // 50% failure rate triggers breach
const RESET_TIMEOUT_MS = 5 * 60 * 1000; // Try handling normal traffic after 5 mins

class CircuitBreaker {
    constructor() {
        this.redis = new Redis(REDIS_URL);
        this.results = []; // true = success, false = failure
        this.isOpen = false;
        this.lastStateChange = 0;
    }

    /**
     * Record an operation result
     * @param {boolean} success 
     */
    async record(success) {
        this.results.push(success);
        if (this.results.length > WINDOW_SIZE) {
            this.results.shift();
        }

        await this.checkState();
    }

    async checkState() {
        if (this.results.length < 5) return; // Need minimum samples

        const failures = this.results.filter(r => r === false).length;
        const failureRate = failures / this.results.length;

        if (!this.isOpen && failureRate > FAILURE_THRESHOLD) {
            await this.open();
        } else if (this.isOpen) {
            // Recovery Check
            // If we have enough recent successes, close it.
            // Or if timeout passed.
            const recent = this.results.slice(-5);
            const recentSuccess = recent.filter(r => r === true).length;

            // If recently mostly successful (4/5), close it
            if (recentSuccess >= 4) {
                await this.close();
            } else {
                // Check timeout
                if (Date.now() - this.lastStateChange > RESET_TIMEOUT_MS) {
                    console.log('[CircuitBreaker] Timeout expired, attempting to close.');
                    await this.close();
                }
            }
        }
    }

    async open() {
        if (this.isOpen) return;
        this.isOpen = true;
        this.lastStateChange = Date.now();
        console.warn('[CircuitBreaker] 🔴 CIRCUIT OPENED! Failure Rate High. Entering Safe Mode.');

        // 1. Set Redis Flag for API Dispatcher
        await this.redis.set('soundry:circuit:open', 'true');

        // 2. Reduce Rate Limits
        rateLimiter.setLimit('DOWNLOAD', 1);
        rateLimiter.setLimit('METADATA', 1);
        rateLimiter.setLimit('RESOLVE', 1);
    }

    async close() {
        if (!this.isOpen) return;
        this.isOpen = false;
        this.lastStateChange = Date.now();
        console.log('[CircuitBreaker] 🟢 CIRCUIT CLOSED! Recovering.');

        // 1. Remove Redis Flag
        await this.redis.del('soundry:circuit:open');

        // 2. Restore Rate Limits (Default to 2)
        rateLimiter.setLimit('DOWNLOAD', 2);
        rateLimiter.setLimit('METADATA', 2);
        rateLimiter.setLimit('RESOLVE', 2);

        // Reset window to avoid immediate re-trigger
        this.results = [];
    }

    // Force specific state (Admin helper)
    async forceState(open) {
        if (open) await this.open();
        else await this.close();
    }
}

const circuitBreaker = new CircuitBreaker();
module.exports = circuitBreaker;
