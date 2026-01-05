/**
 * YouTube Download Provider
 * 
 * Handles audio extraction from YouTube using yt-dlp.
 * Refactored for STABILIZATION:
 * - Uses SessionPool for sticky sessions and cooldowns.
 * - Single retry layer (BullMQ Backoff + Internal yt-dlp retries).
 * - Global concurrency limiting via RateLimiter.
 * - Structured logging.
 */

const ytDlp = require('yt-dlp-exec');
const fs = require('fs');
const path = require('path');
const sessionPool = require('../services/sessionPool');
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

        // Android client to avoid some 403s and formation issues
        extractorArgs: 'youtube:player_client=android',

        // Internal yt-dlp retries (Network/Fragment level ONLY)
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

function sanitizeUrl(url) {
    if (!url) return 'none';
    try {
        return new URL(url).host;
    } catch {
        return 'invalid';
    }
}

/**
 * Get YouTube video metadata
 * Uses SessionPool for identity.
 */
async function getYoutubeMetadata(url, logger = null) {
    const startTime = performance.now();

    // Acquire slot in Global Rate Limit
    return await rateLimiter.run('METADATA', async () => {
        let session = null;
        try {
            // Acquire Session (Cookie+Proxy)
            session = await sessionPool.acquire();

            console.log(`[YouTube] Fetching metadata for ${url} (Session: ${session.id})`);

            const options = buildDownloadOptions({
                dumpSingleJson: true,
                noWarnings: true,
                preferFreeFormats: true,
            }, session.cookiePath, session.proxyUrl);

            const output = await ytDlp(url, options);

            // Success
            sessionPool.release(session.id, true);
            logEvent(logger, 'metadata', 1, 'success', startTime, { providerId: output.id, session: session.id });

            return {
                title: output.title,
                artist: output.uploader || output.artist || 'Unknown Artist',
                duration: output.duration,
                providerId: output.id
            };

        } catch (error) {
            // Log failure & Release Session with error
            const errMsg = error.message || '';
            let errorType = 'other';
            if (errMsg.includes('429')) errorType = '429';
            else if (errMsg.includes('403')) errorType = '403';
            else if (errMsg.includes('Sign in') || errMsg.includes('captcha')) errorType = 'captcha';

            if (session) {
                sessionPool.release(session.id, false, errorType);
            }

            logEvent(logger, 'metadata', 1, 'failure', startTime, { error: errMsg, errorType });
            throw error;
        }
    });
}

/**
 * Download audio from YouTube URL
 * Uses SessionPool for identity.
 */
async function downloadYoutube(url, outputPath, logger = null) {
    const startTime = performance.now();

    return await rateLimiter.run('DOWNLOAD', async () => {
        let session = null;
        try {
            session = await sessionPool.acquire();
            console.log(`[YouTube] Starting download for ${url} (Session: ${session.id})`);

            const options = buildDownloadOptions({
                extractAudio: true,
                audioFormat: 'best',
                output: outputPath,
                noWarnings: true,
                ignoreErrors: true,
            }, session.cookiePath, session.proxyUrl);

            await ytDlp(url, options);

            // Success
            sessionPool.release(session.id, true);
            logEvent(logger, 'download', 1, 'success', startTime, { session: session.id });
            return true;

        } catch (error) {
            const errMsg = error.message || '';
            let errorType = 'other';
            if (errMsg.includes('429')) errorType = '429';
            else if (errMsg.includes('403')) errorType = '403';
            else if (errMsg.includes('Sign in') || errMsg.includes('captcha')) errorType = 'captcha';

            if (session) {
                sessionPool.release(session.id, false, errorType);
            }

            logEvent(logger, 'download', 1, 'failure', startTime, { error: errMsg, errorType });
            throw error;
        }
    });
}

module.exports = {
    getYoutubeMetadata,
    downloadYoutube
};
