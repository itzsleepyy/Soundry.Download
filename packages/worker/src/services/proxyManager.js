/**
 * Proxy Manager Service
 * 
 * Manages a pool of residential proxies for YouTube downloads and resolution.
 * Designed for use with Oxylabs but works with any HTTP/SOCKS5 proxy provider.
 * 
 * Architecture:
 * - Dynamic pool management with health scoring
 * - Round-robin with degradation tracking
 * - Separate cookie pool (not permanently tied to proxies)
 * - All YouTube traffic routes through this layer
 */

const fs = require('fs');
const path = require('path');

// Configuration
const COOKIES_DIR = process.env.COOKIES_DIR || '/app/cookies';
const DEGRADED_THRESHOLD = 3; // Mark degraded after N consecutive failures
const RECOVERY_TIME_MS = 5 * 60 * 1000; // 5 minutes before retrying degraded proxy

/**
 * Proxy state tracking
 */
const proxyPool = {
    proxies: [],      // Array of { url, consecutiveFailures, lastFailure, totalSuccess, totalFailure }
    cookies: [],      // Array of { path, lastUsed, successRate, usageCount }
    initialized: false,
    cookiesInitialized: false
};

/**
 * Initialize proxy pool from environment variable
 * Format: PROXY_URLS="http://user:pass@host:port,socks5://user:pass@host:port"
 */
function initializeProxyPool() {
    if (proxyPool.initialized) return;

    const proxyUrls = process.env.PROXY_URLS || '';

    if (!proxyUrls.trim()) {
        console.log('[ProxyManager] No proxies configured (PROXY_URLS not set)');
        console.log('[ProxyManager] Downloads will proceed without proxy rotation');
        proxyPool.initialized = true;
        return;
    }

    const urls = proxyUrls.split(',').map(u => u.trim()).filter(u => u);

    proxyPool.proxies = urls.map(url => ({
        url,
        consecutiveFailures: 0,
        lastFailure: null,
        totalSuccess: 0,
        totalFailure: 0
    }));

    console.log(`[ProxyManager] Loaded ${proxyPool.proxies.length} proxy(ies)`);

    // Log sanitized proxy info (hide credentials)
    proxyPool.proxies.forEach((p, i) => {
        const sanitized = sanitizeProxyUrl(p.url);
        console.log(`[ProxyManager]   ${i + 1}. ${sanitized}`);
    });

    proxyPool.initialized = true;
}

/**
 * Initialize cookie pool from cookies directory
 * Cookies are NOT permanently tied to proxies - dynamically paired per request
 */
function initializeCookiePool() {
    // Only initialize once to preserve lastUsed tracking between calls
    if (proxyPool.cookiesInitialized) return;

    try {
        if (!fs.existsSync(COOKIES_DIR)) {
            console.log('[ProxyManager] No cookies directory found');
            proxyPool.cookiesInitialized = true;
            return;
        }

        const files = fs.readdirSync(COOKIES_DIR)
            .filter(f => f.endsWith('.txt'))
            .map(f => path.join(COOKIES_DIR, f));

        proxyPool.cookies = files.map(filepath => ({
            path: filepath,
            lastUsed: null,
            successRate: 1.0,
            usageCount: 0
        }));

        if (proxyPool.cookies.length > 0) {
            console.log(`[ProxyManager] Loaded ${proxyPool.cookies.length} cookie file(s)`);
            proxyPool.cookies.forEach((c, i) => {
                console.log(`[ProxyManager]   ${i + 1}. ${path.basename(c.path)}`);
            });
        }

        proxyPool.cookiesInitialized = true;
    } catch (e) {
        console.warn('[ProxyManager] Could not read cookies directory:', e.message);
        proxyPool.cookiesInitialized = true;
    }
}

/**
 * Sanitize proxy URL for logging (hide credentials)
 */
function sanitizeProxyUrl(url) {
    try {
        const parsed = new URL(url);
        if (parsed.password) {
            parsed.password = '***';
        }
        return parsed.toString();
    } catch {
        return url.replace(/:[^@:]+@/, ':***@');
    }
}

/**
 * Get a healthy proxy from the pool
 * Uses round-robin with degradation awareness
 * @returns {{ url: string, index: number } | null}
 */
function getHealthyProxy() {
    initializeProxyPool();

    if (proxyPool.proxies.length === 0) {
        return null;
    }

    const now = Date.now();

    // Find all available proxies (not degraded, or recovered)
    const available = proxyPool.proxies
        .map((p, index) => ({ ...p, index }))
        .filter(p => {
            // Not degraded
            if (p.consecutiveFailures < DEGRADED_THRESHOLD) return true;
            // Degraded but recovery time passed
            if (p.lastFailure && (now - p.lastFailure) > RECOVERY_TIME_MS) {
                console.log(`[ProxyManager] Proxy ${p.index + 1} recovered, retrying`);
                return true;
            }
            return false;
        });

    if (available.length === 0) {
        console.warn('[ProxyManager] All proxies degraded, using random fallback');
        // Return random proxy as last resort
        const randomIdx = Math.floor(Math.random() * proxyPool.proxies.length);
        return { url: proxyPool.proxies[randomIdx].url, index: randomIdx };
    }

    // Round-robin: pick the one with fewest total uses
    available.sort((a, b) => (a.totalSuccess + a.totalFailure) - (b.totalSuccess + b.totalFailure));
    const chosen = available[0];

    return { url: chosen.url, index: chosen.index };
}

/**
 * Get a healthy cookie from the pool
 * Prefers least-recently-used cookies
 * @returns {{ path: string, index: number } | null}
 */
function getHealthyCookie() {
    initializeCookiePool();

    if (proxyPool.cookies.length === 0) {
        return null;
    }

    // Sort by last used (null = never used = first priority)
    const sorted = proxyPool.cookies
        .map((c, index) => ({ ...c, index }))
        .sort((a, b) => {
            if (a.lastUsed === null) return -1;
            if (b.lastUsed === null) return 1;
            return a.lastUsed - b.lastUsed;
        });

    const chosen = sorted[0];
    chosen.lastUsed = Date.now();
    chosen.usageCount++;
    proxyPool.cookies[chosen.index] = chosen;

    return { path: chosen.path, index: chosen.index };
}

/**
 * Get a proxy+cookie pair for a download attempt
 * @returns {{ proxy: { url: string, index: number } | null, cookie: { path: string, index: number } | null }}
 */
function getDownloadPair() {
    return {
        proxy: getHealthyProxy(),
        cookie: getHealthyCookie()
    };
}

/**
 * Mark a proxy as successful
 * @param {number} proxyIndex 
 */
function markProxySuccess(proxyIndex) {
    if (proxyIndex < 0 || proxyIndex >= proxyPool.proxies.length) return;

    const proxy = proxyPool.proxies[proxyIndex];
    proxy.consecutiveFailures = 0;
    proxy.totalSuccess++;

    console.log(`[ProxyManager] Proxy ${proxyIndex + 1} success (total: ${proxy.totalSuccess})`);
}

/**
 * Mark a proxy as failed
 * @param {number} proxyIndex 
 * @param {string} reason - Error reason for logging
 */
function markProxyFailure(proxyIndex, reason = 'unknown') {
    if (proxyIndex < 0 || proxyIndex >= proxyPool.proxies.length) return;

    const proxy = proxyPool.proxies[proxyIndex];
    proxy.consecutiveFailures++;
    proxy.lastFailure = Date.now();
    proxy.totalFailure++;

    const sanitized = sanitizeProxyUrl(proxy.url);
    console.log(`[ProxyManager] Proxy ${proxyIndex + 1} failed (consecutive: ${proxy.consecutiveFailures}, reason: ${reason})`);

    if (proxy.consecutiveFailures >= DEGRADED_THRESHOLD) {
        console.warn(`[ProxyManager] Proxy ${proxyIndex + 1} DEGRADED: ${sanitized}`);
    }
}

/**
 * Mark a cookie as successful
 * @param {number} cookieIndex 
 */
function markCookieSuccess(cookieIndex) {
    if (cookieIndex < 0 || cookieIndex >= proxyPool.cookies.length) return;

    const cookie = proxyPool.cookies[cookieIndex];
    // Improve success rate with exponential moving average
    cookie.successRate = cookie.successRate * 0.9 + 0.1;
}

/**
 * Mark a cookie as failed
 * @param {number} cookieIndex 
 */
function markCookieFailure(cookieIndex) {
    if (cookieIndex < 0 || cookieIndex >= proxyPool.cookies.length) return;

    const cookie = proxyPool.cookies[cookieIndex];
    // Decrease success rate
    cookie.successRate = cookie.successRate * 0.9;

    const cookieName = path.basename(cookie.path);
    console.log(`[ProxyManager] Cookie ${cookieName} failed (successRate: ${(cookie.successRate * 100).toFixed(1)}%)`);
}

/**
 * Get pool statistics for monitoring
 * @returns {Object}
 */
function getPoolStats() {
    initializeProxyPool();

    return {
        proxies: {
            total: proxyPool.proxies.length,
            healthy: proxyPool.proxies.filter(p => p.consecutiveFailures < DEGRADED_THRESHOLD).length,
            degraded: proxyPool.proxies.filter(p => p.consecutiveFailures >= DEGRADED_THRESHOLD).length,
            details: proxyPool.proxies.map((p, i) => ({
                index: i + 1,
                url: sanitizeProxyUrl(p.url),
                status: p.consecutiveFailures >= DEGRADED_THRESHOLD ? 'degraded' : 'healthy',
                successRate: p.totalSuccess / Math.max(1, p.totalSuccess + p.totalFailure)
            }))
        },
        cookies: {
            total: proxyPool.cookies.length,
            details: proxyPool.cookies.map((c, i) => ({
                index: i + 1,
                name: path.basename(c.path),
                usageCount: c.usageCount,
                successRate: c.successRate
            }))
        }
    };
}

/**
 * Get the number of available proxies
 * @returns {number}
 */
function getProxyCount() {
    initializeProxyPool();
    return proxyPool.proxies.length;
}

/**
 * Check if proxies are configured
 * @returns {boolean}
 */
function hasProxies() {
    initializeProxyPool();
    return proxyPool.proxies.length > 0;
}

module.exports = {
    initializeProxyPool,
    initializeCookiePool,
    getHealthyProxy,
    getHealthyCookie,
    getDownloadPair,
    markProxySuccess,
    markProxyFailure,
    markCookieSuccess,
    markCookieFailure,
    getPoolStats,
    getProxyCount,
    hasProxies,
    sanitizeProxyUrl
};
