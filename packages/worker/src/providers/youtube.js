/**
 * YouTube Download Provider
 * 
 * Handles audio extraction from YouTube using yt-dlp.
 * Cookies are OPTIONAL and used ONLY as fallback when bot detection occurs.
 * 
 * Architecture:
 * - Primary: Download without cookies using user-agent spoofing
 * - Fallback: Retry with cookie files if available and bot detection occurs
 * 
 * This module handles DOWNLOADING ONLY, not search/resolution.
 */

const ytDlp = require('yt-dlp-exec');
const fs = require('fs');
const path = require('path');

// Cookie directory - operator can place cookie files here
const COOKIES_DIR = process.env.COOKIES_DIR || '/app/cookies';

/**
 * Get available cookie files from cookies directory
 * @returns {string[]} Array of cookie file paths
 */
function getAvailableCookies() {
    try {
        if (!fs.existsSync(COOKIES_DIR)) {
            return [];
        }

        const files = fs.readdirSync(COOKIES_DIR)
            .filter(f => f.endsWith('.txt'))
            .map(f => path.join(COOKIES_DIR, f));

        if (files.length > 0) {
            console.log(`[YouTube] Found ${files.length} cookie file(s) available`);
        }

        return files;
    } catch (e) {
        console.warn('[YouTube] Could not read cookies directory:', e.message);
        return [];
    }
}

/**
 * Build yt-dlp options for downloading
 * @param {Object} baseOptions - Base options to merge
 * @param {string|null} cookieFile - Optional cookie file path
 * @returns {Object} Merged options
 */
function buildDownloadOptions(baseOptions = {}, cookieFile = null) {
    const options = {
        ...baseOptions,
        // Always include these for reliability
        noPlaylist: true,
        referer: 'https://www.youtube.com/',
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    };

    if (cookieFile) {
        options.cookies = cookieFile;
        console.log(`[YouTube] Using cookie file: ${path.basename(cookieFile)}`);
    }

    return options;
}

/**
 * Check if error indicates bot detection
 * @param {Error} error - Error to check
 * @returns {boolean} True if bot detection error
 */
function isBotDetectionError(error) {
    const msg = error?.message || '';
    return msg.includes('Sign in to confirm') ||
        msg.includes('not a bot') ||
        msg.includes('HTTP Error 429') ||
        msg.includes('HTTP Error 403'); // YouTube blocks video downloads with 403
}

/**
 * Get YouTube video metadata
 * @param {string} url - Direct YouTube video URL (not search query)
 * @returns {Promise<Object>} Video metadata
 */
async function getYoutubeMetadata(url) {
    console.log(`[YouTube] Fetching metadata for: ${url}`);

    // Retry logic similar to downloadYoutube
    const cookieFiles = getAvailableCookies();
    const maxAttempts = 1 + cookieFiles.length;
    let lastError = null;

    // Attempt 1: Without cookies
    try {
        const options = buildDownloadOptions({
            dumpSingleJson: true,
            noWarnings: true,
            preferFreeFormats: true,
        });

        const output = await ytDlp(url, options);
        return {
            title: output.title,
            artist: output.uploader || output.artist || 'Unknown Artist',
            duration: output.duration,
            providerId: output.id
        };
    } catch (error) {
        lastError = error;
        if (!isBotDetectionError(error)) throw error;
        console.log('[YouTube] Metadata bot detection triggered');
        if (cookieFiles.length === 0) throw error;
    }

    // Attempts 2+: With cookie files
    for (const cookieFile of cookieFiles) {
        console.log(`[YouTube] Retrying metadata with cookie: ${path.basename(cookieFile)}`);
        try {
            const options = buildDownloadOptions({
                dumpSingleJson: true,
                noWarnings: true,
                preferFreeFormats: true,
            }, cookieFile);

            const output = await ytDlp(url, options);
            return {
                title: output.title,
                artist: output.uploader || output.artist || 'Unknown Artist',
                duration: output.duration,
                providerId: output.id
            };
        } catch (error) {
            lastError = error;
            if (isBotDetectionError(error)) continue;
            throw error;
        }
    }

    console.error('[YouTube] Metadata fetch failed after all attempts');
    throw lastError;
}

/**
 * Download audio from YouTube URL
 * 
 * Strategy:
 * 1. Try download without cookies
 * 2. If bot detection occurs and cookies available, retry with cookies
 * 3. Rotate through cookie files on subsequent failures
 * 
 * @param {string} url - Direct YouTube video URL
 * @param {string} outputPath - Path to save audio file
 * @returns {Promise<boolean>} True on success
 */
async function downloadYoutube(url, outputPath) {
    console.log(`[YouTube] Starting download: ${url}`);
    console.log(`[YouTube] Output path: ${outputPath}`);

    const cookieFiles = getAvailableCookies();
    const maxAttempts = 1 + cookieFiles.length; // Base attempt + one per cookie file

    let lastError = null;

    // Attempt 1: Without cookies
    console.log('[YouTube] Attempt 1: Downloading without cookies');
    try {
        const options = buildDownloadOptions({
            extractAudio: true,
            audioFormat: 'best',
            output: outputPath,
            noWarnings: true,
            ignoreErrors: true, // Prevent failure on skipped fragments
        });

        await ytDlp(url, options);
        console.log('[YouTube] Download successful (no cookies needed)');
        return true;

    } catch (error) {
        lastError = error;
        console.error('[YouTube] Download failed:', error.message);

        if (!isBotDetectionError(error)) {
            // Non-bot error, don't retry with cookies
            throw error;
        }

        console.log('[YouTube] Bot detection triggered');

        if (cookieFiles.length === 0) {
            console.error('[YouTube] No cookie files available for fallback');
            throw new Error('YouTube bot detection: No cookies available for fallback');
        }
    }

    // Attempts 2+: With cookie files
    for (let i = 0; i < cookieFiles.length; i++) {
        const cookieFile = cookieFiles[i];
        const attemptNum = i + 2;

        console.log(`[YouTube] Attempt ${attemptNum}: Retrying with cookies`);

        try {
            const options = buildDownloadOptions({
                extractAudio: true,
                audioFormat: 'best',
                output: outputPath,
                noWarnings: true,
                ignoreErrors: true, // Prevent failure on skipped fragments
            }, cookieFile);

            await ytDlp(url, options);
            console.log(`[YouTube] Download successful (with cookies: ${path.basename(cookieFile)})`);
            return true;

        } catch (error) {
            lastError = error;
            console.error(`[YouTube] Cookie attempt ${attemptNum} failed:`, error.message);

            if (isBotDetectionError(error) && i < cookieFiles.length - 1) {
                console.log('[YouTube] Bot detection persists, rotating to next cookie file');
                continue;
            }
        }
    }

    // All attempts failed
    const errorMsg = lastError?.message || 'Unknown error';
    console.error(`[YouTube] All ${maxAttempts} attempts failed`);

    throw new Error(`YouTube download failed after ${maxAttempts} attempts: ${errorMsg}`);
}

module.exports = {
    getYoutubeMetadata,
    downloadYoutube
};
