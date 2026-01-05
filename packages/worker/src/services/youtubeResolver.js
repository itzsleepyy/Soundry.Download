/**
 * YouTube Resolver Service
 * 
 * Resolves search queries to direct YouTube video URLs by scraping
 * YouTube's search results page.
 * 
 * Architecture:
 * - Uses SessionPool to acquire a proxy/identity.
 * - Respects global rate limits (caller handles RateLimiter interaction).
 */

const https = require('https');
const http = require('http');
const { HttpsProxyAgent } = require('https-proxy-agent');
const { SocksProxyAgent } = require('socks-proxy-agent');
const sessionPool = require('./sessionPool');

/**
 * Create appropriate proxy agent based on URL scheme
 */
function createProxyAgent(proxyUrl) {
    if (proxyUrl.startsWith('socks')) {
        return new SocksProxyAgent(proxyUrl);
    }
    return new HttpsProxyAgent(proxyUrl);
}

/**
 * Extracts video ID from YouTube search results page HTML/JSON
 */
function extractVideoId(html) {
    // Method 1: ytInitialData JSON
    const ytInitialDataMatch = html.match(/var ytInitialData = ({.+?});<\/script>/s);
    if (ytInitialDataMatch) {
        try {
            const data = JSON.parse(ytInitialDataMatch[1]);
            const videoId = findVideoIdInData(data);
            if (videoId) return videoId;
        } catch (e) {
            // ignore
        }
    }

    // Method 2: Alternate ytInitialData
    const altMatch = html.match(/ytInitialData['"]\s*\]\s*=\s*({.+?});/s);
    if (altMatch) {
        try {
            const data = JSON.parse(altMatch[1]);
            const videoId = findVideoIdInData(data);
            if (videoId) return videoId;
        } catch (e) {
            // ignore
        }
    }

    // Method 3: Direct regex
    const watchMatch = html.match(/\/watch\?v=([a-zA-Z0-9_-]{11})/);
    if (watchMatch) {
        return watchMatch[1];
    }

    // Method 4: JSON "videoId"
    const videoIdMatch = html.match(/"videoId"\s*:\s*"([a-zA-Z0-9_-]{11})"/);
    if (videoIdMatch) {
        return videoIdMatch[1];
    }

    return null;
}

/**
 * Recursively searches JSON structure for first videoId
 */
function findVideoIdInData(obj, depth = 0) {
    if (depth > 15) return null;
    if (!obj || typeof obj !== 'object') return null;

    if (obj.videoRenderer && obj.videoRenderer.videoId) {
        return obj.videoRenderer.videoId;
    }

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
                'Accept-Encoding': 'identity',
            }
        };

        if (proxyUrl) {
            options.agent = createProxyAgent(proxyUrl);
        }

        const protocol = isHttps ? https : http;

        const req = protocol.request(options, (res) => {
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
 * Uses SessionPool to get an identity.
 */
async function resolveYouTubeUrl(query) {
    console.log(`[YouTubeResolver] Searching for: "${query}"`);

    const encodedQuery = encodeURIComponent(query);
    const searchUrl = `https://www.youtube.com/results?search_query=${encodedQuery}`;

    // Try up to 2 times
    const attempts = 2;
    let lastError = null;

    for (let i = 0; i < attempts; i++) {
        let session = null;
        try {
            session = await sessionPool.acquire();
            const proxyLabel = session.proxyUrl ? new URL(session.proxyUrl).host : 'direct';
            console.log(`[YouTubeResolver] Attempt ${i + 1}/${attempts} using Session ${session.id} (Proxy: ${proxyLabel})`);

            const html = await httpGet(searchUrl, session.proxyUrl);
            const videoId = extractVideoId(html);

            if (!videoId) {
                // If the pages loads but no ID, maybe blocked or format changed?
                // Treat as failure to retry
                throw new Error('No YouTube video found in response');
            }

            const videoUrl = `https://www.youtube.com/watch?v=${videoId}`;
            console.log(`[YouTubeResolver] Resolved to: ${videoUrl}`);

            // Success
            sessionPool.release(session.id, true);
            return videoUrl;

        } catch (error) {
            lastError = error;
            console.error(`[YouTubeResolver] Attempt ${i + 1} failed: ${error.message}`);

            // Release session with failure info
            if (session) {
                let errorType = 'other';
                if (error.message.includes('HTTP 429')) errorType = '429';
                if (error.message.includes('403')) errorType = '403';
                sessionPool.release(session.id, false, errorType);
            }
            // continue loop
        }
    }

    throw new Error(`YouTube search failed: ${lastError?.message}`);
}

/**
 * Builds an optimized search query
 */
function buildSearchQuery(artist, title) {
    const cleanTitle = title
        .replace(/\s*\(feat\..*?\)/gi, '')
        .replace(/\s*\[.*?\]/g, '')
        .replace(/\s*\(.*?remix.*?\)/gi, '')
        .trim();

    const cleanArtist = artist
        .replace(/\s*,\s*/g, ' ')
        .trim();

    return `${cleanArtist} ${cleanTitle} official audio`;
}

module.exports = {
    resolveYouTubeUrl,
    buildSearchQuery
};
