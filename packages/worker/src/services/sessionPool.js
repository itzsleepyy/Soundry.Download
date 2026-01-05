/**
 * Session Pool Service
 * 
 * Manages "Sessions" (Identity Resources) to ensure:
 * 1. Exclusive Access: A cookie/proxy pair is used by only one job at a time.
 * 2. Cooldowns: Sessions are suspended after failures (429/403) to recover.
 * 3. Sticky Pairing: Cookies stay with their assigned proxies (mostly).
 */

const fs = require('fs');
const path = require('path');

const COOKIES_DIR = process.env.COOKIES_DIR || '/app/cookies';
const COOLDOWN_MS = 20 * 60 * 1000; // 20 minutes cooldown on 429/Block
const MAX_FAILURES = 5; // Disable after this many consecutive critical failures
const ACQUIRE_TIMEOUT_MS = 60 * 1000; // Wait up to 60s for a session

class SessionPool {
    constructor() {
        this.sessions = [];
        this.initialized = false;
        this.waiting = []; // Queue of {resolve, reject, timer}
    }

    /**
     * Initialize pool from env and fs
     */
    initialize() {
        if (this.initialized) return;

        const proxyUrls = (process.env.PROXY_URLS || '')
            .split(',')
            .map(u => u.trim())
            .filter(u => u);

        let cookieFiles = [];
        try {
            if (fs.existsSync(COOKIES_DIR)) {
                cookieFiles = fs.readdirSync(COOKIES_DIR)
                    .filter(f => f.endsWith('.txt'))
                    .map(f => path.join(COOKIES_DIR, f));
            }
        } catch (e) {
            console.warn('[SessionPool] Failed to read cookies dir:', e.message);
        }

        console.log(`[SessionPool] Found ${cookieFiles.length} cookies and ${proxyUrls.length} proxies.`);

        // Strategy: 1 Session per Cookie. Assign proxies Round-Robin.
        // If no cookies, 1 Session per Proxy.
        // If neither, 1 "Direct" Session.

        if (cookieFiles.length > 0) {
            this.sessions = cookieFiles.map((cookiePath, i) => ({
                id: `session-cookie-${i}`,
                cookiePath,
                proxyUrl: proxyUrls.length > 0 ? proxyUrls[i % proxyUrls.length] : null,
                status: 'available', // available, busy, cooling_down, disabled
                failures: 0,
                cooldownUntil: 0,
                lastUsed: 0, // timestamp
                usageCount: 0
            }));
        } else if (proxyUrls.length > 0) {
            this.sessions = proxyUrls.map((proxyUrl, i) => ({
                id: `session-proxy-${i}`,
                cookiePath: null,
                proxyUrl,
                status: 'available',
                failures: 0,
                cooldownUntil: 0,
                lastUsed: 0,
                usageCount: 0
            }));
        } else {
            console.warn('[SessionPool] No proxies or cookies found. Creating single direct session.');
            this.sessions = [{
                id: 'session-direct',
                cookiePath: null,
                proxyUrl: null,
                status: 'available',
                failures: 0,
                cooldownUntil: 0,
                lastUsed: 0,
                usageCount: 0
            }];
        }

        this.initialized = true;
        this.logStats();
    }

    /**
     * Acquire a session. Waits if all busy.
     * @returns {Promise<Object>} The session object (READ ONLY properties please)
     */
    async acquire() {
        this.initialize();

        // Check availability immediately
        const session = this._findAvailableSession();
        if (session) {
            this._markBusy(session);
            return session;
        }

        // Wait
        return new Promise((resolve, reject) => {
            const timer = setTimeout(() => {
                // Remove from queue
                const idx = this.waiting.findIndex(w => w.resolve === resolve);
                if (idx !== -1) {
                    this.waiting.splice(idx, 1);
                    reject(new Error('Timeout waiting for available session'));
                }
            }, ACQUIRE_TIMEOUT_MS);

            this.waiting.push({ resolve, reject, timer });
        });
    }

    /**
     * Release a session back to the pool
     * @param {string} sessionId 
     * @param {boolean} success 
     * @param {string|null} errorType '429', '403', 'captcha', 'other'
     */
    release(sessionId, success, errorType = null) {
        const session = this.sessions.find(s => s.id === sessionId);
        if (!session) {
            console.error(`[SessionPool] Released unknown session: ${sessionId}`);
            return;
        }

        session.lastUsed = Date.now();

        if (success) {
            session.status = 'available';
            session.failures = 0; // Reset failures on success? Maybe decay instead? 
            // Resetting is safer to avoid permanent disablement from sporadic errors.
            session.usageCount++;
        } else {
            console.log(`[SessionPool] Session ${session.id} failed: ${errorType}`);

            if (['429', '403', 'captcha', 'Sign in'].some(t => errorType && errorType.includes(t))) {
                // Critical failure -> Cooldown
                session.failures++;
                session.usageCount++;

                if (session.failures >= MAX_FAILURES) {
                    session.status = 'disabled';
                    console.error(`[SessionPool] Session ${session.id} DISABLED after ${session.failures} failures.`);
                } else {
                    session.status = 'cooling_down';
                    session.cooldownUntil = Date.now() + COOLDOWN_MS;
                    const min = Math.round(COOLDOWN_MS / 60000);
                    console.warn(`[SessionPool] Session ${session.id} cooling down for ${min} mins.`);

                    // Schedule auto-revive check? 
                    // No, passive check in _findAvailableSession is better.
                }
            } else {
                // Non-critical error (network timeout, etc)
                // Just release as available, maybe count failure
                session.status = 'available';
            }
        }

        // Try to fulfill waiting requests
        this._processQueue();
    }

    _findAvailableSession() {
        const now = Date.now();

        // 1. Check for cooldowns to expire
        for (const s of this.sessions) {
            if (s.status === 'cooling_down' && s.cooldownUntil <= now) {
                console.log(`[SessionPool] Session ${s.id} cooldown expired. Available.`);
                s.status = 'available';
                s.cooldownUntil = 0;
            }
        }

        // 2. Find available
        // Prefer least used? Or random? Round robin?
        // Let's sort by lastUsed to rotate usage
        const available = this.sessions.filter(s => s.status === 'available');

        if (available.length === 0) return null;

        // Sort: Least recently used first
        available.sort((a, b) => a.lastUsed - b.lastUsed);

        return available[0];
    }

    _markBusy(session) {
        session.status = 'busy';
    }

    _processQueue() {
        if (this.waiting.length === 0) return;

        const session = this._findAvailableSession();
        if (session) {
            const { resolve, timer } = this.waiting.shift();
            clearTimeout(timer);
            this._markBusy(session);
            resolve(session);
        }
    }

    _sanitizeUrl(url) {
        if (!url) return 'none';
        try {
            return new URL(url).host;
        } catch {
            return 'invalid';
        }
    }

    logStats() {
        const stats = {
            total: this.sessions.length,
            available: this.sessions.filter(s => s.status === 'available').length,
            busy: this.sessions.filter(s => s.status === 'busy').length,
            cooling: this.sessions.filter(s => s.status === 'cooling_down').length,
            disabled: this.sessions.filter(s => s.status === 'disabled').length,
        };
        console.log(`[SessionPool] Stats: ${JSON.stringify(stats)}`);
    }
}

const sessionPool = new SessionPool();
module.exports = sessionPool;
