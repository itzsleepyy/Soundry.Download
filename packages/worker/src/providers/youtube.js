/**
 * YouTube Download Provider
 * 
 * Handles audio extraction from YouTube using yt-dlp.
 * Refactored for STABILIZATION:
 * - Single retry layer (BullMQ + yt-dlp internal), no application-level retry loops.
 * - Global concurrency limiting via RateLimiter.
 * - Structured logging.
 */

const ytDlp = require('yt-dlp-exec');
const fs = require('fs');
const path = require('path');
const proxyManager = require('../services/proxyManager');
const rateLimiter = require('../services/rateLimiter');
const { performance } = require('perf_hooks');

/**
 * Helper to log structured events
 */
function logEvent(logger, operation, attempt, outcome, startTime, extra = {}) {
    const elapsed_ms = Math.round(performance.now() - startTime);
    const logData = {
        operation,
        attempt: attempt || 1,
        outcome,
        elapsed_ms,
        ...extra
    };

    if (logger && typeof logger.info === 'function') {
        logger.info(logData);
    } else {
        console.log(JSON.stringify(logData));
    }
}

/**
 * Build yt-dlp options for downloading
 */
function buildDownloadOptions(baseOptions = {}, cookiePath = null, proxyUrl = null) {
    const options = {
        ...baseOptions,
        // Reliability settings
        noPlaylist: true,
        referer: 'https://www.youtube.com/',
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',

        // Android client to avoid some 403s and format issues
        extractorArgs: 'youtube:player_client=android',

        // Internal yt-dlp retries (Network/Fragment level ONLY)
        // We do NOT restart the whole process here, only small packet retries
        extractorRetries: 3,
        retries: 10,
        fragmentRetries: 10,

        // Relaxed format selection
        format: 'bestaudio[ext=m4a]/bestaudio/18/best',

        // Headers
        addHeader: [
            'Origin:https://www.youtube.com',
            'Sec-Fetch-Mode:navigate'
        ],

        // Sleep to be polite
        sleepInterval: 2,
        maxSleepInterval: 10,
    };

    if (cookiePath) options.cookies = cookiePath;
    if (proxyUrl) options.proxy = proxyUrl;

    return options;
}

/**
 * Get YouTube video metadata
 * Single attempt with rate limiting.
 */
async function getYoutubeMetadata(url, logger = null) {
    const startTime = performance.now();

    // Acquire slot
    return await rateLimiter.run('METADATA', async () => {
        // Get one proxy/cookie pair
        const { proxy, cookie } = proxyManager.getDownloadPair();

        const proxyUrl = proxy ? proxy.url : null;
        const cookiePath = cookie ? cookie.path : null;

        try {
            console.log(`[YouTube] Fetching metadata for ${url} (Proxy: ${proxy ? proxyManager.sanitizeProxyUrl(proxyUrl) : 'Direct'})`);

            const options = buildDownloadOptions({
                dumpSingleJson: true,
                noWarnings: true,
                preferFreeFormats: true,
            }, cookiePath, proxyUrl);

            const output = await ytDlp(url, options);

            // Success
            if (proxy) proxyManager.markProxySuccess(proxy.index);
            logEvent(logger, 'metadata', 1, 'success', startTime, { providerId: output.id });

            return {
                title: output.title,
                artist: output.uploader || output.artist || 'Unknown Artist',
                duration: output.duration,
                providerId: output.id
            };

        } catch (error) {
            // Log failure
            const isRateLimit = error.message.includes('429') || error.message.includes('Sign in');
            if (isRateLimit && proxy) {
                proxyManager.markProxyFailure(proxy.index, '429');
            }

            logEvent(logger, 'metadata', 1, 'failure', startTime, { error: error.message });
            throw error;
        }
    });
}

/**
 * Download audio from YouTube URL
 * Single attempt with rate limiting.
 */
async function downloadYoutube(url, outputPath, logger = null) {
    const startTime = performance.now();

    return await rateLimiter.run('DOWNLOAD', async () => {
        const { proxy, cookie } = proxyManager.getDownloadPair();
        const proxyUrl = proxy ? proxy.url : null;
        const cookiePath = cookie ? cookie.path : null;

        try {
            console.log(`[YouTube] Starting download for ${url} (Proxy: ${proxy ? proxyManager.sanitizeProxyUrl(proxyUrl) : 'Direct'})`);

            const options = buildDownloadOptions({
                extractAudio: true,
                audioFormat: 'best',
                output: outputPath,
                noWarnings: true,
                ignoreErrors: true,
            }, cookiePath, proxyUrl);

            await ytDlp(url, options);

            // Success
            if (proxy) proxyManager.markProxySuccess(proxy.index);
            logEvent(logger, 'download', 1, 'success', startTime);
            return true;

        } catch (error) {
            const isRateLimit = error.message.includes('429') || error.message.includes('Sign in');
            if (isRateLimit && proxy) {
                proxyManager.markProxyFailure(proxy.index, '429');
            }

            logEvent(logger, 'download', 1, 'failure', startTime, { error: error.message });
            throw error;
        }
    });
}

module.exports = {
    getYoutubeMetadata,
    downloadYoutube
};
