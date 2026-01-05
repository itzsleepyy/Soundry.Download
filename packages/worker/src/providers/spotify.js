const SpotifyWebApi = require('spotify-web-api-node');

// Global instance to reuse token
let spotifyApi = null;
let tokenExpirationTime = 0;

// Initialize function
function getSpotifyApi() {
    if (!process.env.SPOTIFY_CLIENT_ID || !process.env.SPOTIFY_CLIENT_SECRET) {
        throw new Error('Missing Spotify Credentials');
    }

    if (!spotifyApi) {
        spotifyApi = new SpotifyWebApi({
            clientId: process.env.SPOTIFY_CLIENT_ID,
            clientSecret: process.env.SPOTIFY_CLIENT_SECRET
        });
    }
    return spotifyApi;
}

// Ensure valid token
async function ensureToken() {
    const api = getSpotifyApi();
    const now = Date.now();

    // Refresh 5 minutes before expiration
    if (now >= tokenExpirationTime - 300000) {
        try {
            const data = await api.clientCredentialsGrant();
            api.setAccessToken(data.body['access_token']);
            tokenExpirationTime = now + (data.body['expires_in'] * 1000);
            console.log('Spotify access token refreshed');
        } catch (error) {
            console.error('Failed to retrieve Spotify access token', error);
            throw error;
        }
    }
    return api;
}

// Helper for exponential backoff
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function executeWithRetry(fn, retries = 3) {
    for (let i = 0; i < retries; i++) {
        try {
            await ensureToken();
            return await fn();
        } catch (error) {
            // Check for Rate Limit (429)
            if (error.statusCode === 429) {
                const retryAfter = error.headers['retry-after']
                    ? parseInt(error.headers['retry-after']) * 1000
                    : Math.pow(2, i) * 1000; // Default exponential backoff

                console.warn(`Spotify Rate Limit. Retrying after ${retryAfter}ms...`);
                await sleep(retryAfter);
                continue;
            }
            // If it's not a rate limit or retries exhausted, throw
            if (i === retries - 1) throw error;

            // Other errors, random small backoff
            await sleep(1000);
        }
    }
}

async function getSpotifyMetadata(url) {
    const api = getSpotifyApi();

    // Use URL object for robust parsing
    let parsedUrl;
    try {
        parsedUrl = new URL(url);
    } catch (e) {
        throw new Error(`Invalid URL format: ${url}`);
    }

    const segments = parsedUrl.pathname.split('/').filter(Boolean);
    const typeIndex = segments.findIndex(s => ['track', 'album', 'playlist'].includes(s));

    if (typeIndex === -1 || typeIndex + 1 >= segments.length) {
        throw new Error(`Could not parse Spotify type/ID from: ${url}`);
    }

    const type = segments[typeIndex];
    const id = segments[typeIndex + 1];

    console.log(`[Spotify] Parsed URL: ${url} -> Type: ${type}, ID: ${id}`);

    return executeWithRetry(async () => {
        if (type === 'track') {
            const data = await api.getTrack(id);
            const track = data.body;
            return {
                type: 'track',
                title: track.name,
                artist: track.artists.map(a => a.name).join(', '),
                album: track.album.name,
                duration: track.duration_ms / 1000,
                providerId: id
            };
        } else {
            // The API service handles Playlist/Album expansion, so the worker
            // generally only receives single track URLs.
            // If a playlist URL reaches here, it's an error or untracked legacy job.
            throw new Error(`Unsupported Spotify Type: ${type}. Only Tracks are supported directly by the worker.`);
        }
    });
}

module.exports = { getSpotifyMetadata };
