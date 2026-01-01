/**
 * YouTube Resolver Service
 * 
 * Resolves search queries to direct YouTube video URLs by scraping
 * YouTube's search results page. This avoids yt-dlp's ytsearch which
 * triggers bot detection.
 * 
 * Architecture:
 * - Search: HTTP GET to YouTube search (no auth, no cookies)
 * - Download: Separate concern handled by yt-dlp
 * 
 * This service is for RESOLUTION ONLY, not downloading.
 */

const https = require('https');

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
 * Performs HTTP GET request to URL
 * @param {string} url - URL to fetch
 * @returns {Promise<string>} - Response body
 */
function httpGet(url) {
    return new Promise((resolve, reject) => {
        const options = {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
                'Accept-Language': 'en-US,en;q=0.5',
                'Accept-Encoding': 'identity', // Avoid gzip for simpler parsing
            }
        };

        https.get(url, options, (res) => {
            // Handle redirects
            if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
                return httpGet(res.headers.location).then(resolve).catch(reject);
            }

            if (res.statusCode !== 200) {
                reject(new Error(`HTTP ${res.statusCode}`));
                return;
            }

            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => resolve(data));
            res.on('error', reject);
        }).on('error', reject);
    });
}

/**
 * Resolves a search query to a direct YouTube video URL
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

    try {
        // Fetch search results page
        const html = await httpGet(searchUrl);

        // Extract first video ID
        const videoId = extractVideoId(html);

        if (!videoId) {
            console.error('[YouTubeResolver] No video ID found in search results');
            throw new Error('No YouTube video found for query');
        }

        const videoUrl = `https://www.youtube.com/watch?v=${videoId}`;
        console.log(`[YouTubeResolver] Resolved to: ${videoUrl}`);

        return videoUrl;

    } catch (error) {
        console.error(`[YouTubeResolver] Search failed: ${error.message}`);
        throw new Error(`YouTube search failed: ${error.message}`);
    }
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
