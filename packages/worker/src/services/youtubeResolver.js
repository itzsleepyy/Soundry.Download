/**
 * YouTube Resolver Service
 * 
 * Resolves search queries to direct YouTube video URLs by scraping
 * YouTube's search results page. Now routes all traffic through
 * residential proxies via ProxyManager.
 * 
 * Architecture:
 * - All YouTube traffic goes through proxy layer
 * - Uses same proxy pool as download operations
 * - Consistent fingerprint (same proxy for resolve + download when possible)
 * 
 * This service is for RESOLUTION ONLY, not downloading.
 */

const https = require('https');
const http = require('http');
const { HttpsProxyAgent } = require('https-proxy-agent');
const { SocksProxyAgent } = require('socks-proxy-agent');
const proxyManager = require('./proxyManager');

/**
 * Create appropriate proxy agent based on URL scheme
 * @param {string} proxyUrl - Proxy URL (http:// or socks5://)
 * @returns {Object} Proxy agent
 */
function createProxyAgent(proxyUrl) {
    if (proxyUrl.startsWith('socks')) {
        return new SocksProxyAgent(proxyUrl);
    }
    return new HttpsProxyAgent(proxyUrl);
}

/**
 * Extracts video ID from YouTube search results page HTML/JSON
 * @param {string} html - Raw HTML response from YouTube
 * @returns {string|null} - First valid video ID or null
 */
function extractVideoId(html) {
    // YouTube embeds initial data as JSON in the page
    // Look for ytInitialData which contains search results

    // Method 1: Extract from ytInitialData JSON
    const ytInitialDataMatch = html.match(/var ytInitialData = ({.+?});<\/script>/s);
    if (ytInitialDataMatch) {
        try {
            const data = JSON.parse(ytInitialDataMatch[1]);
            const videoId = findVideoIdInData(data);
            if (videoId) return videoId;
        } catch (e) {
            console.warn('[YouTubeResolver] Failed to parse ytInitialData JSON');
        }
    }

    // Method 2: Look for ytInitialData in different format
    const altMatch = html.match(/ytInitialData['"]\s*\]\s*=\s*({.+?});/s);
    if (altMatch) {
        try {
            const data = JSON.parse(altMatch[1]);
            const videoId = findVideoIdInData(data);
            if (videoId) return videoId;
        } catch (e) {
            console.warn('[YouTubeResolver] Failed to parse alternate ytInitialData');
        }
    }

    // Method 3: Direct regex for video IDs in watch URLs
    // This is a fallback - less accurate but works
    const watchMatch = html.match(/\/watch\?v=([a-zA-Z0-9_-]{11})/);
    if (watchMatch) {
        return watchMatch[1];
    }

    // Method 4: Look for videoId in JSON structures
    const videoIdMatch = html.match(/"videoId"\s*:\s*"([a-zA-Z0-9_-]{11})"/);
    if (videoIdMatch) {
        return videoIdMatch[1];
    }

    return null;
}

/**
 * Recursively searches JSON structure for first videoId
 * Prioritizes organic video results over ads/shorts
 */
function findVideoIdInData(obj, depth = 0) {
    if (depth > 15) return null; // Prevent infinite recursion

    if (!obj || typeof obj !== 'object') return null;

    // Look for videoRenderer which contains organic video results
    if (obj.videoRenderer && obj.videoRenderer.videoId) {
        return obj.videoRenderer.videoId;
    }

    // Search through arrays and objects
    if (Array.isArray(obj)) {
        for (const item of obj) {
            const result = findVideoIdInData(item, depth + 1);
            if (result) return result;
        }
    } else {
        for (const key of Object.keys(obj)) {
            const result = findVideoIdInData(obj[key], depth + 1);
            if (result) return result;
        }
    }

    return null;
}

/**
 * Performs HTTP GET request to URL, optionally through proxy
 * @param {string} url - URL to fetch
 * @param {string|null} proxyUrl - Optional proxy URL
 * @returns {Promise<string>} - Response body
 */
function httpGet(url, proxyUrl = null) {
    return new Promise((resolve, reject) => {
        const parsedUrl = new URL(url);
        const isHttps = parsedUrl.protocol === 'https:';

        const options = {
            hostname: parsedUrl.hostname,
            port: parsedUrl.port || (isHttps ? 443 : 80),
            path: parsedUrl.pathname + parsedUrl.search,
            method: 'GET',
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
                'Accept-Language': 'en-US,en;q=0.5',
                'Accept-Encoding': 'identity', // Avoid gzip for simpler parsing
            }
        };

        // Add proxy agent if provided
        if (proxyUrl) {
            options.agent = createProxyAgent(proxyUrl);
        }

        const protocol = isHttps ? https : http;

        const req = protocol.request(options, (res) => {
            // Handle redirects
            if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
                return httpGet(res.headers.location, proxyUrl).then(resolve).catch(reject);
            }

            if (res.statusCode !== 200) {
                reject(new Error(`HTTP ${res.statusCode}`));
                return;
            }

            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => resolve(data));
            res.on('error', reject);
        });

        req.on('error', reject);
        req.setTimeout(30000, () => {
            req.destroy();
            reject(new Error('Request timeout'));
        });
        req.end();
    });
}

/**
 * Resolves a search query to a direct YouTube video URL
 * Routes through residential proxy if available
 * 
 * @param {string} query - Search query (e.g. "Drake One Dance official audio")
 * @returns {Promise<string>} - Direct YouTube URL (https://youtube.com/watch?v=...)
 * @throws {Error} - If no video found or network error
 */
async function resolveYouTubeUrl(query) {
    console.log(`[YouTubeResolver] Searching for: "${query}"`);

    // Build search URL
    const encodedQuery = encodeURIComponent(query);
    const searchUrl = `https://www.youtube.com/results?search_query=${encodedQuery}`;

    // Try with proxies, retry on failure
    const maxAttempts = Math.max(2, proxyManager.getProxyCount());
    let lastError = null;

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
        const proxy = proxyManager.getHealthyProxy();
        const proxyLabel = proxy ? proxyManager.sanitizeProxyUrl(proxy.url) : 'direct';

        console.log(`[YouTubeResolver] Attempt ${attempt}/${maxAttempts}: proxy=${proxyLabel}`);

        try {
            // Fetch search results page
            const html = await httpGet(searchUrl, proxy?.url);

            // Extract first video ID
            const videoId = extractVideoId(html);

            if (!videoId) {
                console.error('[YouTubeResolver] No video ID found in search results');
                throw new Error('No YouTube video found for query');
            }

            const videoUrl = `https://www.youtube.com/watch?v=${videoId}`;
            console.log(`[YouTubeResolver] Resolved to: ${videoUrl}`);

            // Success - mark proxy healthy
            if (proxy) proxyManager.markProxySuccess(proxy.index);

            return videoUrl;

        } catch (error) {
            lastError = error;
            console.error(`[YouTubeResolver] Attempt ${attempt} failed: ${error.message}`);

            // Check if proxy-related failure
            if (proxy && (error.message.includes('HTTP 4') || error.message.includes('HTTP 5') || error.message.includes('timeout'))) {
                proxyManager.markProxyFailure(proxy.index, error.message);
            }

            if (attempt < maxAttempts) {
                console.log('[YouTubeResolver] Retrying with different proxy...');
                continue;
            }
        }
    }

    throw new Error(`YouTube search failed after ${maxAttempts} attempts: ${lastError?.message}`);
}

/**
 * Builds an optimized search query for finding audio
 * Adds "official audio" to improve match accuracy
 * 
 * @param {string} artist - Artist name
 * @param {string} title - Track title
 * @returns {string} - Optimized search query
 */
function buildSearchQuery(artist, title) {
    // Remove common suffixes that hurt search
    const cleanTitle = title
        .replace(/\s*\(feat\..*?\)/gi, '') // Remove feat.
        .replace(/\s*\[.*?\]/g, '')        // Remove [brackets]
        .replace(/\s*\(.*?remix.*?\)/gi, '') // Remove remix markers
        .trim();

    const cleanArtist = artist
        .replace(/\s*,\s*/g, ' ') // Replace commas with spaces
        .trim();

    // Construct query optimized for official audio
    return `${cleanArtist} ${cleanTitle} official audio`;
}

module.exports = {
    resolveYouTubeUrl,
    buildSearchQuery
};
