const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const { PrismaClient } = require('@prisma/client');
const { Queue } = require('bullmq');
const Redis = require('ioredis');
const archiver = require('archiver');
const { getSpotifyData } = require('./services/spotify');
const path = require('path');
const fs = require('fs');

// --- Configuration ---
const PORT = process.env.PORT || 3001;
const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';
const DOWNLOADS_DIR = process.env.DOWNLOADS_DIR || '/data/downloads'; // Used for serving files

// --- Services ---
const prisma = new PrismaClient();

// Redis connection for BullMQ
const redisConnection = new Redis(REDIS_URL, {
    maxRetriesPerRequest: null,
});

const downloadQueue = new Queue('downloads', { connection: redisConnection });

// --- Express Setup ---
const app = express();

app.use(cors());
app.use(express.json());
app.use(morgan('tiny'));

// Log environment configuration at startup
console.log('=== Soundry API Configuration ===');
console.log('Port:', PORT);
console.log('Redis URL:', REDIS_URL);
console.log('Downloads Dir:', DOWNLOADS_DIR);

// Detailed Spotify credentials logging
const clientId = process.env.SPOTIFY_CLIENT_ID;
const clientSecret = process.env.SPOTIFY_CLIENT_SECRET;

if (clientId) {
    console.log('Spotify Client ID:', `${clientId.substring(0, 8)}...${clientId.substring(clientId.length - 4)}`);
    console.log('  - Length:', clientId.length);
    console.log('  - First char code:', clientId.charCodeAt(0));
    console.log('  - Last char code:', clientId.charCodeAt(clientId.length - 1));
} else {
    console.log('Spotify Client ID: NOT SET');
}

if (clientSecret) {
    console.log('Spotify Client Secret: SET (hidden)');
    console.log('  - Length:', clientSecret.length);
    console.log('  - First char code:', clientSecret.charCodeAt(0));
    console.log('  - Last char code:', clientSecret.charCodeAt(clientSecret.length - 1));
} else {
    console.log('Spotify Client Secret: NOT SET');
}

console.log('=================================');


// --- Middleware ---
const extractSession = (req, res, next) => {
    const token = req.headers['x-session-token'] || req.query.token;
    if (token) {
        req.sessionToken = token;
    }
    next();
};
app.use(extractSession);

// --- Routes ---
const apiRouter = express.Router();

apiRouter.get('/health', (req, res) => res.json({ status: 'ok' }));

// 1. POST /api/jobs
apiRouter.post('/jobs', async (req, res) => {
    try {
        const { url, formats } = req.body;
        const sessionToken = req.sessionToken;

        if (!url) return res.status(400).json({ error: 'URL is required' });
        if (!formats || !Array.isArray(formats) || formats.length === 0) {
            return res.status(400).json({ error: 'At least one format is required' });
        }
        if (!sessionToken) return res.status(400).json({ error: 'Session token required' });

        // Check for Spotify URL to expand
        let jobsToQueue = [];
        let groupId = null;
        let groupTitle = 'Playlist';

        if (url.includes('spotify.com')) {
            try {
                const data = await getSpotifyData(url);
                if (data.type === 'playlist' || data.type === 'album') {
                    // Create Session Group
                    // Use actual tracks length to avoid mismatch with Spotify's total which might include local/unplayable files
                    const group = await prisma.sessionGroup.create({
                        data: {
                            sessionToken,
                            title: data.title || 'Unknown Header',
                            totalTracks: data.tracks.length
                        }
                    });
                    groupId = group.id;
                    groupTitle = data.title;

                    // Prepare items
                    jobsToQueue = data.tracks.map(t => ({
                        url: t.url,
                        meta: { title: t.name, artist: t.artist },
                        formats,
                        sessionToken,
                        groupId
                    }));
                } else {
                    // Single track
                    jobsToQueue.push({
                        url,
                        formats,
                        sessionToken
                    });
                }
            } catch (e) {
                console.error("Spotify expansion failed", e);
                return res.status(400).json({ error: 'Failed to expand Spotify URL', details: e.message });
            }
        } else {
            // Standard handling
            jobsToQueue.push({
                url,
                formats,
                sessionToken
            });
        }

        // Queue all - create Track and SessionItem records first
        const jobs = [];
        for (const jobData of jobsToQueue) {
            // Determine provider for Track record
            let provider = 'youtube';
            const jobUrl = jobData.url;
            if (jobUrl.includes('spotify.com')) provider = 'spotify';
            else if (jobUrl.includes('soundcloud.com')) provider = 'soundcloud';
            else if (jobUrl.includes('youtube.com') || jobUrl.includes('youtu.be')) provider = 'youtube';

            // Create Track record immediately in 'queued' status
            const track = await prisma.track.create({
                data: {
                    provider: `${provider}:${jobUrl}`, // Temporary, worker will update with real provider ID
                    title: jobData.meta?.title || 'Processing...',
                    artist: jobData.meta?.artist || 'Unknown Artist',
                    durationSeconds: 0,
                    status: 'queued'
                }
            });

            // Create SessionItem immediately
            if (sessionToken) {
                await prisma.sessionItem.create({
                    data: {
                        sessionToken,
                        trackId: track.id,
                        source: 'requested',
                        groupId: jobData.groupId
                    }
                });
            }

            // Queue job with trackId
            // Job Priorities:
            // - Priority 1 (High): Single tracks. Ensures fast users don't wait for playlists.
            // - Priority 5 (Low): Playlist tracks. Bulk downloads yield to single requests.
            const job = await downloadQueue.add('download', {
                ...jobData,
                trackId: track.id,
                requestId: require('uuid').v4()
            }, {
                priority: jobData.groupId ? 5 : 1
            });
            jobs.push(job);
        }

        res.json({
            count: jobs.length,
            status: 'queued',
            groupId,
            message: groupId ? `Queued ${jobs.length} tracks from ${groupTitle}` : 'Job queued'
        });

    } catch (error) {
        console.error('Job error:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// 2. GET /api/library/global
apiRouter.get('/library/global', async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const pageSize = parseInt(req.query.pageSize) || 20;
        const offset = (page - 1) * pageSize;
        const q = req.query.q;

        const now = new Date();
        const where = {
            expiresAt: { gt: now },
            status: 'completed'
        };

        if (q) {
            where.OR = [
                { title: { contains: q } },
                { artist: { contains: q } }
            ];
        }

        const tracks = await prisma.track.findMany({
            where,
            include: { files: true },
            orderBy: { createdAt: 'desc' },
            take: pageSize,
            skip: offset
        });

        const total = await prisma.track.count({ where });

        res.json({
            tracks,
            pagination: {
                page,
                pageSize,
                total,
                totalPages: Math.ceil(total / pageSize)
            }
        });
    } catch (error) {
        console.error('Global library error:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// 3. GET /api/library/session
apiRouter.get('/library/session', async (req, res) => {
    try {
        const sessionToken = req.sessionToken;
        const q = req.query.q;
        if (!sessionToken) return res.status(400).json({ error: 'Session token required' });

        const where = { sessionToken };
        if (q) {
            // Search inside tracks
            where.track = {
                OR: [
                    { title: { contains: q } },
                    { artist: { contains: q } }
                ]
            };
        }

        const sessionItems = await prisma.sessionItem.findMany({
            where,
            include: {
                track: {
                    include: { files: true }
                },
                group: true
            },
            orderBy: { createdAt: 'desc' }
        });

        res.json({ items: sessionItems });
    } catch (error) {
        console.error('Session library error:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// 3.1 DELETE /api/library/session/:id
apiRouter.delete('/library/session/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const sessionToken = req.sessionToken;
        if (!sessionToken) return res.status(400).json({ error: 'Session token required' });

        // Verify ownership and existence
        const item = await prisma.sessionItem.findFirst({
            where: { id, sessionToken },
            include: { track: true }
        });

        if (!item) return res.status(404).json({ error: 'Item not found' });

        await prisma.sessionItem.delete({
            where: { id }
        });

        // If track is not completed, mark as cancelled to stop worker
        if (item.track && item.track.status !== 'completed' && item.track.status !== 'failed') {
            await prisma.track.update({
                where: { id: item.trackId },
                data: { status: 'cancelled' }
            });
        }

        res.json({ status: 'deleted' });
    } catch (error) {
        console.error('Delete item error:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// 3.2 POST /api/library/session/:id/retry
apiRouter.post('/library/session/:id/retry', async (req, res) => {
    try {
        const { id } = req.params;
        const sessionToken = req.sessionToken;
        if (!sessionToken) return res.status(400).json({ error: 'Session token required' });

        // Get the SessionItem and Track
        const item = await prisma.sessionItem.findFirst({
            where: { id, sessionToken },
            include: { track: true }
        });

        if (!item) return res.status(404).json({ error: 'Item not found' });
        if (item.track.status !== 'failed') {
            return res.status(400).json({ error: 'Can only retry failed tracks' });
        }

        // Reconstruct URL from provider field (format: "provider:id")
        const [providerType, providerId] = item.track.provider.split(':');
        let url;

        if (providerType === 'spotify') {
            url = `https://open.spotify.com/track/${providerId}`;
        } else if (providerType === 'youtube') {
            url = `https://www.youtube.com/watch?v=${providerId}`;
        } else {
            return res.status(400).json({ error: 'Unsupported provider for retry' });
        }

        // Use default formats (mp3, flac, wav)
        const formats = ['mp3', 'flac', 'wav'];

        // Create new Track in queued status
        const newTrack = await prisma.track.create({
            data: {
                provider: item.track.provider,
                title: item.track.title,
                artist: item.track.artist,
                durationSeconds: 0,
                status: 'queued'
            }
        });

        // Update SessionItem to point to new track
        await prisma.sessionItem.update({
            where: { id },
            data: { trackId: newTrack.id }
        });

        // Delete old failed track
        await prisma.track.delete({
            where: { id: item.trackId }
        });

        // Queue job
        await downloadQueue.add('download', {
            url,
            formats,
            sessionToken,
            trackId: newTrack.id,
            groupId: item.groupId,
            requestId: require('uuid').v4()
        });

        res.json({ status: 'retrying', trackId: newTrack.id });
    } catch (error) {
        console.error('Retry error:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// 4. GET /api/download/:trackId/:format
apiRouter.get('/download/:trackId/:format', async (req, res) => {
    try {
        const { trackId, format } = req.params;
        const sessionToken = req.sessionToken;

        const track = await prisma.track.findUnique({
            where: { id: trackId },
            include: { files: true }
        });

        if (!track) return res.status(404).json({ error: 'Track not found' });
        // Simplified expire check
        if (track.expiresAt && new Date() > track.expiresAt) res.status(410).json({ error: 'Track expired' });

        const file = track.files.find(f => f.format === format);
        if (!file) return res.status(404).json({ error: 'Format not available' });

        if (sessionToken) {
            const existing = await prisma.sessionItem.findFirst({ where: { sessionToken, trackId } });
            if (!existing) {
                await prisma.sessionItem.create({
                    data: { sessionToken, trackId, source: 'downloaded' }
                });
            }
        }

        const absolutePath = path.join(DOWNLOADS_DIR, file.path);
        res.download(absolutePath, `${track.title}.${format}`);

    } catch (error) {
        console.error('Download error:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// 5. GET /api/download-group/:groupId
apiRouter.get('/download-group/:groupId', async (req, res) => {
    try {
        const { groupId } = req.params;
        const format = req.query.format || 'mp3'; // Default format preference for zip? Or zip all?

        const group = await prisma.sessionGroup.findUnique({
            where: { id: groupId },
            include: {
                items: {
                    include: {
                        track: { include: { files: true } }
                    }
                }
            }
        });

        if (!group) return res.status(404).json({ error: 'Group not found' });

        // Setup Zip
        const archive = archiver('zip', { zlib: { level: 9 } });
        res.attachment(`${group.title}.zip`);

        archive.pipe(res);

        for (const item of group.items) {
            if (item.track.status === 'completed') {
                const file = item.track.files.find(f => f.format === format) || item.track.files[0];
                if (file) {
                    const absPath = path.join(DOWNLOADS_DIR, file.path);
                    if (fs.existsSync(absPath)) {
                        archive.file(absPath, { name: `${item.track.artist} - ${item.track.title}.${file.format}` });
                    }
                }
            }
        }

        await archive.finalize();

    } catch (error) {
        console.error('Group download error:', error);
        res.status(500).end();
    }
});


// Health check endpoint
app.get('/health', (req, res) => {
    res.json({
        status: 'ok',
        spotify: {
            clientIdSet: !!process.env.SPOTIFY_CLIENT_ID,
            clientSecretSet: !!process.env.SPOTIFY_CLIENT_SECRET
        }
    });
});

// Spotify credentials test endpoint
app.get('/test-spotify', async (req, res) => {
    try {
        const { getSpotifyData } = require('./services/spotify');
        // Test with a known public Spotify track
        const testUrl = 'https://open.spotify.com/track/3n3Ppam7vgaVa1iaRUc9Lp'; // Mr. Brightside
        const data = await getSpotifyData(testUrl);
        res.json({
            success: true,
            message: 'Spotify credentials are valid',
            testTrack: data.tracks[0]?.name || 'Unknown'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message,
            details: error.toString()
        });
    }
});

app.use('/api', apiRouter);

const { startCleanupCron } = require('./cleanup');
startCleanupCron();

app.listen(PORT, () => {
    console.log(`API Service running on port ${PORT}`);
});
