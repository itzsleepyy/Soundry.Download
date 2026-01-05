const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const { PrismaClient } = require('@prisma/client');
const { Queue } = require('bullmq');
const Redis = require('ioredis');
const archiver = require('archiver');
const { getSpotifyData } = require('./services/spotify');
const QueueDispatcher = require('./services/queueDispatcher');
const path = require('path');
const fs = require('fs');

BigInt.prototype.toJSON = function () {
    const int = Number.parseInt(this.toString());
    return int ?? this.toString();
};

const PORT = process.env.PORT || 3001;
const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';
const DOWNLOADS_DIR = process.env.DOWNLOADS_DIR || '/data/downloads';
const ADMIN_SECRET = process.env.ADMIN_SECRET || 'changeme';

const prisma = new PrismaClient();
const redisConnection = new Redis(REDIS_URL, { maxRetriesPerRequest: null });
const redisSubscriber = new Redis(REDIS_URL);
const redisClient = new Redis(REDIS_URL); // General purpose client

const downloadQueue = new Queue('downloads', { connection: redisConnection });
const dispatcher = new QueueDispatcher(prisma, downloadQueue);

redisSubscriber.subscribe('soundry:dispatch', (err) => {
    if (err) console.error('Failed to subscribe to dispatch channel', err);
    else console.log('Subscribed to soundry:dispatch events');
});

redisSubscriber.on('message', (channel, message) => {
    if (channel === 'soundry:dispatch') {
        dispatcher.dispatch();
    }
});

const app = express();
app.use(cors());
app.use(express.json());
app.use(morgan('tiny'));

console.log('=== Soundry API Configuration ===');
console.log('Port:', PORT);
console.log('Redis URL:', REDIS_URL);
console.log('Downloads Dir:', DOWNLOADS_DIR);
console.log('Admin Secret:', ADMIN_SECRET === 'changeme' ? 'DEFAULT (changeme)' : 'SET');
const clientId = process.env.SPOTIFY_CLIENT_ID;
if (clientId) console.log('Spotify Client ID:', `${clientId.substring(0, 8)}...`);
else console.log('Spotify Client ID: NOT SET');
console.log('=================================');

const extractSession = (req, res, next) => {
    const token = req.headers['x-session-token'] || req.query.token;
    if (token) req.sessionToken = token;
    next();
};
app.use(extractSession);

const apiRouter = express.Router();
apiRouter.get('/health', (req, res) => res.json({ status: 'ok' }));

// ADMIN ENDPOINT
apiRouter.get('/admin/health', async (req, res) => {
    const secret = req.headers['x-admin-secret'];
    if (secret !== ADMIN_SECRET) return res.status(403).json({ error: 'Unauthorized' });

    try {
        const circuitOpen = await redisClient.get('soundry:circuit:open');

        // Count queues
        const queuedCount = await prisma.track.count({ where: { status: 'queued' } });
        const processingCount = await prisma.track.count({ where: { status: 'processing' } });
        const failedCount = await prisma.track.count({ where: { status: 'failed' } });

        res.json({
            circuit: {
                isOpen: circuitOpen === 'true',
                status: circuitOpen === 'true' ? 'SAFE_MODE' : 'NORMAL'
            },
            queue: {
                queued: queuedCount,
                processing: processingCount,
                failed: failedCount
            }
        });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});


// 1. POST /api/jobs
apiRouter.post('/jobs', async (req, res) => {
    try {
        const { url, formats } = req.body;
        console.log(`[API] Received Job Request: URL=${url}`);
        const sessionToken = req.sessionToken;

        if (!url) return res.status(400).json({ error: 'URL is required' });
        if (!formats || !Array.isArray(formats) || formats.length === 0) {
            return res.status(400).json({ error: 'At least one format is required' });
        }
        if (!sessionToken) return res.status(400).json({ error: 'Session token required' });

        let jobsToQueue = [];
        let groupId = null;
        let groupTitle = 'Playlist';

        if (url.includes('spotify.com')) {
            try {
                const data = await getSpotifyData(url);
                if (data.type === 'playlist' || data.type === 'album') {
                    const group = await prisma.sessionGroup.create({
                        data: {
                            sessionToken,
                            title: data.title || 'Unknown Header',
                            totalTracks: data.tracks.length
                        }
                    });
                    groupId = group.id;
                    groupTitle = data.title;

                    jobsToQueue = data.tracks.map(t => ({
                        url: t.url,
                        meta: { title: t.name, artist: t.artist },
                        formats,
                        sessionToken,
                        groupId
                    }));
                } else {
                    jobsToQueue.push({ url, formats, sessionToken });
                }
            } catch (e) {
                console.error("Spotify expansion failed", e);
                return res.status(400).json({ error: 'Failed to expand Spotify URL', details: e.message });
            }
        } else {
            jobsToQueue.push({ url, formats, sessionToken });
        }

        const jobs = [];
        for (const jobData of jobsToQueue) {
            let provider = 'youtube';
            const jobUrl = jobData.url;
            if (jobUrl.includes('spotify.com')) provider = 'spotify';
            else if (jobUrl.includes('soundcloud.com')) provider = 'soundcloud';
            else if (jobUrl.includes('youtube.com') || jobUrl.includes('youtu.be')) provider = 'youtube';

            const track = await prisma.track.create({
                data: {
                    provider: `${provider}:${jobUrl}`,
                    title: jobData.meta?.title || 'Processing...',
                    artist: jobData.meta?.artist || 'Unknown Artist',
                    durationSeconds: 0,
                    status: 'queued'
                }
            });

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
            jobs.push(track.id);
        }

        dispatcher.dispatch();

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
            orderBy: { createdAt: 'desc' },
            take: 100 // Cap to prevent massive dumps
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

        const item = await prisma.sessionItem.findFirst({
            where: { id, sessionToken },
            include: { track: true }
        });

        if (!item) return res.status(404).json({ error: 'Item not found' });

        await prisma.sessionItem.delete({ where: { id } });

        if (item.track && item.track.status !== 'completed' && item.track.status !== 'failed') {
            await prisma.track.update({
                where: { id: item.trackId },
                data: { status: 'cancelled' }
            });
        }

        dispatcher.dispatch();

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

        const item = await prisma.sessionItem.findFirst({
            where: { id, sessionToken },
            include: { track: true }
        });

        if (!item) return res.status(404).json({ error: 'Item not found' });
        if (item.track.status !== 'failed') {
            return res.status(400).json({ error: 'Can only retry failed tracks' });
        }

        const [providerType, providerId] = item.track.provider.split(':');
        let url; // Reconstruction logic omitted for brevity but similar to previous...
        // ... (Assume logic works as before) ...

        // Simpler for now:
        const newTrack = await prisma.track.create({
            data: {
                provider: item.track.provider,
                title: item.track.title,
                artist: item.track.artist,
                durationSeconds: 0,
                status: 'queued'
            }
        });

        await prisma.sessionItem.update({
            where: { id },
            data: { trackId: newTrack.id }
        });

        await prisma.track.delete({ where: { id: item.trackId } });
        dispatcher.dispatch();

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

// 5. GET /api/download-group/:groupId (Unchanged)
apiRouter.get('/download-group/:groupId', async (req, res) => {
    // ... (Zip logic unchanged) ...
    try {
        const { groupId } = req.params;
        const format = req.query.format || 'mp3';
        const group = await prisma.sessionGroup.findUnique({
            where: { id: groupId },
            include: { items: { include: { track: { include: { files: true } } } } }
        });
        if (!group) return res.status(404).json({ error: 'Not found' });

        const archive = archiver('zip', { zlib: { level: 9 } });
        res.attachment(`${group.title}.zip`);
        archive.pipe(res);

        for (const item of group.items) {
            if (item.track.status === 'completed') {
                const file = item.track.files.find(f => f.format === format) || item.track.files[0];
                if (file) {
                    const p = path.join(DOWNLOADS_DIR, file.path);
                    if (fs.existsSync(p)) archive.file(p, { name: `${item.track.artist} - ${item.track.title}.${format}` });
                }
            }
        }
        await archive.finalize();
    } catch (e) { res.status(500).end(); }
});

apiRouter.post('/library/group/:id/pause', async (req, res) => {
    try {
        const { id } = req.params;
        const sessionToken = req.sessionToken;
        if (!sessionToken) return res.status(400).json({ error: 'Auth required' });
        const group = await prisma.sessionGroup.findFirst({ where: { id, sessionToken } });
        if (!group) return res.status(404).json({ error: 'Group not found' });
        await prisma.sessionGroup.update({ where: { id }, data: { paused: true } });
        res.json({ status: 'paused' });
    } catch (e) { res.status(500).json({ error: e.message }); }
});

apiRouter.post('/library/group/:id/resume', async (req, res) => {
    try {
        const { id } = req.params;
        const sessionToken = req.sessionToken;
        if (!sessionToken) return res.status(400).json({ error: 'Auth required' });
        const group = await prisma.sessionGroup.findFirst({ where: { id, sessionToken } });
        if (!group) return res.status(404).json({ error: 'Group not found' });
        await prisma.sessionGroup.update({ where: { id }, data: { paused: false } });
        dispatcher.dispatch();
        res.json({ status: 'resumed' });
    } catch (e) { res.status(500).json({ error: e.message }); }
});

app.get('/health', (req, res) => res.json({ status: 'ok' }));

app.get('/test-spotify', async (req, res) => {
    try {
        const { getSpotifyData } = require('./services/spotify');
        const testUrl = 'https://open.spotify.com/track/3n3Ppam7vgaVa1iaRUc9Lp';
        const data = await getSpotifyData(testUrl);
        res.json({ success: true, message: 'Valid', testTrack: data.tracks[0]?.name });
    } catch (e) { res.status(500).json({ error: e.message }); }
});

app.use('/api', apiRouter);
const { startCleanupCron } = require('./cleanup');
startCleanupCron();
app.listen(PORT, () => console.log(`API Service running on port ${PORT}`));
