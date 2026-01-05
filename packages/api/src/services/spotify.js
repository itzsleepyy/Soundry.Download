const SpotifyWebApi = require('spotify-web-api-node');

let spotifyApi = null;
let tokenExpirationTime = 0;

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

async function ensureToken() {
    const api = getSpotifyApi();
    const now = Date.now();

    if (now >= tokenExpirationTime - 300000) {
        try {
            console.log('[Spotify] Requesting access token...');
            console.log('[Spotify] Client ID (first 10):', process.env.SPOTIFY_CLIENT_ID?.substring(0, 10));
            console.log('[Spotify] Client ID length:', process.env.SPOTIFY_CLIENT_ID?.length);
            console.log('[Spotify] Client Secret length:', process.env.SPOTIFY_CLIENT_SECRET?.length);

            const data = await api.clientCredentialsGrant();
            api.setAccessToken(data.body['access_token']);
            tokenExpirationTime = now + (data.body['expires_in'] * 1000);
            console.log('[Spotify] Access token refreshed successfully');
        } catch (error) {
            console.error('[Spotify] Failed to retrieve access token');
            console.error('[Spotify] Error status:', error.statusCode);
            console.error('[Spotify] Error message:', error.message);
            console.error('[Spotify] Error body:', JSON.stringify(error.body || {}));
            console.error('[Spotify] Full error:', error);
            throw error;
        }
    }
    return api;
}

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function executeWithRetry(fn, retries = 3) {
    for (let i = 0; i < retries; i++) {
        try {
            await ensureToken();
            return await fn();
        } catch (error) {
            if (error.statusCode === 429) {
                const retryAfter = error.headers['retry-after']
                    ? parseInt(error.headers['retry-after']) * 1000
                    : Math.pow(2, i) * 1000;
                console.warn(`Spotify Rate Limit. Retrying after ${retryAfter}ms...`);
                await sleep(retryAfter);
                continue;
            }
            if (i === retries - 1) throw error;
            await sleep(1000);
        }
    }
}

async function getSpotifyData(url) {
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

    console.log(`[SpotifyService] Parsed URL: ${url} -> Type: ${type}, ID: ${id}`);

    return executeWithRetry(async () => {
        if (type === 'track') {
            return { type: 'track', tracks: [{ id, url }] }; // Return formatted for ease
        } else if (type === 'playlist') {
            const data = await api.getPlaylist(id);
            const playlist = data.body;

            // Fetch all tracks with pagination
            let tracks = [];
            let offset = 0;
            const limit = 100; // Spotify's max
            const total = playlist.tracks.total;

            // Get first page (already have it from getPlaylist)
            tracks = playlist.tracks.items
                .filter(item => item.track && item.track.id) // Filter out null/local tracks
                .map(t => ({
                    id: t.track.id,
                    url: t.track.external_urls.spotify,
                    name: t.track.name,
                    artist: t.track.artists[0].name
                }));

            // Fetch remaining pages
            offset = limit;
            while (offset < total) {
                console.log(`[SpotifyService] Fetching playlist tracks: ${offset}/${total}`);
                const nextPage = await api.getPlaylistTracks(id, { offset, limit });
                const nextTracks = nextPage.body.items
                    .filter(item => item.track && item.track.id) // Filter out null/local tracks
                    .map(t => ({
                        id: t.track.id,
                        url: t.track.external_urls.spotify,
                        name: t.track.name,
                        artist: t.track.artists[0].name
                    }));
                tracks = tracks.concat(nextTracks);
                offset += limit;
            }

            console.log(`[SpotifyService] Fetched ${tracks.length} tracks from playlist "${playlist.name}"`);

            return {
                type: 'playlist',
                title: playlist.name,
                total: tracks.length, // Use actual fetched count
                tracks
            };
        } else if (type === 'album') {
            const data = await api.getAlbum(id);
            const album = data.body;

            // Fetch all tracks with pagination (rare for albums to exceed 100, but possible)
            let tracks = [];
            let offset = 0;
            const limit = 50; // Spotify's max for album tracks
            const total = album.tracks.total;

            // Get first page (already have it from getAlbum)
            tracks = album.tracks.items
                .filter(t => t && t.id) // Filter out null tracks
                .map(t => ({
                    id: t.id,
                    url: t.external_urls.spotify,
                    name: t.name,
                    artist: t.artists[0].name
                }));

            // Fetch remaining pages if needed
            offset = limit;
            while (offset < total) {
                console.log(`[SpotifyService] Fetching album tracks: ${offset}/${total}`);
                const nextPage = await api.getAlbumTracks(id, { offset, limit });
                const nextTracks = nextPage.body.items
                    .filter(t => t && t.id)
                    .map(t => ({
                        id: t.id,
                        url: t.external_urls.spotify,
                        name: t.name,
                        artist: t.artists[0].name
                    }));
                tracks = tracks.concat(nextTracks);
                offset += limit;
            }

            console.log(`[SpotifyService] Fetched ${tracks.length} tracks from album "${album.name}"`);

            return {
                type: 'album',
                title: album.name,
                total: tracks.length, // Use actual fetched count
                tracks
            };
        }
    });
}

module.exports = { getSpotifyData };
