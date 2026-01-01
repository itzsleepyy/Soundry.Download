const ytDlp = require('yt-dlp-exec');
const os = require('os');
const fs = require('fs');
const path = require('path');

// Detect available browsers for cookie extraction
function detectBrowsers() {
    const platform = os.platform();
    const browsers = [];

    // Check for Firefox (most reliable, doesn't require closing)
    const firefoxPaths = [
        '/root/.mozilla',
        path.join(os.homedir(), '.mozilla'),
        '/home/*/.mozilla'
    ];

    for (const firefoxPath of firefoxPaths) {
        try {
            if (fs.existsSync(firefoxPath)) {
                browsers.push('firefox');
                break;
            }
        } catch (e) {
            // Ignore permission errors
        }
    }

    console.log(`[YouTube] Detected browsers: ${browsers.length > 0 ? browsers.join(', ') : 'none'}`);
    return browsers;
}

// Build yt-dlp options with authentication
function buildYtDlpOptions(baseOptions = {}) {
    const options = { ...baseOptions };

    // Try to use browser cookies (most reliable method)
    const browsers = detectBrowsers();
    if (browsers.length > 0) {
        options.cookiesFromBrowser = browsers[0];
        console.log(`[YouTube] Using cookies from ${browsers[0]}`);
    } else {
        console.warn('[YouTube] No browser cookies available - may encounter bot detection');
    }

    // Add user-agent spoofing to appear as real browser
    options.userAgent = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

    return options;
}

async function getYoutubeMetadata(url) {
    try {
        const options = buildYtDlpOptions({
            dumpSingleJson: true,
            noWarnings: true,
            preferFreeFormats: true,
        });

        console.log('[YouTube] Fetching metadata with authentication');
        const output = await ytDlp(url, options);

        return {
            title: output.title,
            artist: output.uploader || output.artist || 'Unknown Artist',
            duration: output.duration,
            providerId: output.id
        };
    } catch (e) {
        console.error('[YouTube] Metadata Error:', e.message);

        // Check for bot detection
        if (e.message.includes('Sign in to confirm') || e.message.includes('not a bot')) {
            console.error('[YouTube] Bot detection triggered - cookies may be needed');
        }

        throw e;
    }
}

async function downloadYoutube(url, outputPath) {
    const maxRetries = 3;
    let lastError;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
            const options = buildYtDlpOptions({
                extractAudio: true,
                audioFormat: 'best',
                output: outputPath,
                noWarnings: true,
            });

            console.log(`[YouTube] Download attempt ${attempt}/${maxRetries}`);
            await ytDlp(url, options);
            console.log('[YouTube] Download successful');
            return true;
        } catch (e) {
            lastError = e;
            console.error(`[YouTube] Download attempt ${attempt} failed:`, e.message);

            // Check if it's a bot detection error
            if (e.message.includes('Sign in to confirm') || e.message.includes('not a bot')) {
                console.error('[YouTube] Bot detection triggered');
                console.error('[YouTube] Tip: Ensure Firefox is installed with valid cookies');
            }

            // Retry with exponential backoff (unless last attempt)
            if (attempt < maxRetries) {
                const delay = Math.min(attempt * 2000, 10000); // Cap at 10s
                console.log(`[YouTube] Retrying in ${delay}ms...`);
                await new Promise(resolve => setTimeout(resolve, delay));
            }
        }
    }

    // All retries failed
    const errorMsg = lastError?.message || 'Unknown error';
    if (errorMsg.includes('Sign in to confirm') || errorMsg.includes('not a bot')) {
        throw new Error('YouTube bot detection: Please ensure browser cookies are available. See https://github.com/yt-dlp/yt-dlp/wiki/FAQ#how-do-i-pass-cookies-to-yt-dlp');
    }

    throw new Error(`YouTube download failed after ${maxRetries} attempts: ${errorMsg}`);
}

module.exports = { getYoutubeMetadata, downloadYoutube };
