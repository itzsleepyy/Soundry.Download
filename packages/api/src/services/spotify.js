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
            const data = await api.clientCredentialsGrant();
            api.setAccessToken(data.body['access_token']);
            tokenExpirationTime = now + (data.body['expires_in'] * 1000);
            console.log('Spotify access token refreshed (API)');
        } catch (error) {
            console.error('Failed to retrieve Spotify access token', error);
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
    const parts = url.split('/');
    const typeIndex = parts.findIndex(p => ['track', 'album', 'playlist'].includes(p));
    if (typeIndex === -1) throw new Error('Invalid Spotify URL: Type not found');

    const type = parts[typeIndex];
    const potentialId = parts[typeIndex + 1];
    if (!potentialId) throw new Error('Invalid Spotify URL: ID missing');

    const id = potentialId.split('?')[0];

    console.log(`[SpotifyService] Parsing URL: ${url}`);
    console.log(`[SpotifyService] Extracted Type: ${type}, ID: ${id}`);

    return executeWithRetry(async () => {
        if (type === 'track') {
            return { type: 'track', tracks: [{ id, url }] }; // Return formatted for ease
        } else if (type === 'playlist') {
            const data = await api.getPlaylist(id);
            const playlist = data.body;
            let tracks = playlist.tracks.items.map(t => ({
                id: t.track.id,
                url: t.track.external_urls.spotify,
                name: t.track.name,
                artist: t.track.artists[0].name
            }));

            // Handle pagination if needed? For MVP let's cap at first 100 (api default usually 100 with limit)
            // api.getPlaylistTracks(id) can be used for more.
            // Let's rely on standard response for now.

            return {
                type: 'playlist',
                title: playlist.name,
                total: playlist.tracks.total,
                tracks
            };
        } else if (type === 'album') {
            const data = await api.getAlbum(id);
            const album = data.body;
            let tracks = album.tracks.items.map(t => ({
                id: t.id,
                url: t.external_urls.spotify,
                name: t.name,
                artist: t.artists[0].name
            }));
            return {
                type: 'album',
                title: album.name,
                total: album.tracks.total,
                tracks
            };
        }
    });
}

module.exports = { getSpotifyData };
