const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const { PrismaClient } = require('@prisma/client');
const { Queue } = require('bullmq');
const Redis = require('ioredis');

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

// --- Middleware ---
// Simple session extraction, validation happens in logic if needed
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

// Health Check
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

        // TODO: Validate formats enum
        // TODO: Check rate limits (can use express-rate-limit middleware globally or per route)

        // For MVP, simplistic check:
        // Actually, we don't check for existing track here in a complex way for MVP speed,
        // we just push to queue. The worker will handle "idempotency" or we can do a quick check.
        // Let's do a quick check if a track exists and is valid to save queue time.

        // Simulating a unique provider ID check would be ideal, but for now we just accept the URL.
        // We will enqueue it.

        const job = await downloadQueue.add('download', {
            url,
            formats,
            sessionToken,
            requestId: require('uuid').v4()
        });

        res.json({ jobId: job.id, status: 'queued' });

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

        // Filter: ExpiresAt > Now AND Status = completed
        const now = new Date();

        const tracks = await prisma.track.findMany({
            where: {
                expiresAt: { gt: now },
                status: 'completed'
            },
            include: {
                files: true
            },
            orderBy: {
                createdAt: 'desc'
            },
            take: pageSize,
            skip: offset
        });

        res.json({ tracks });
    } catch (error) {
        console.error('Global library error:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// 3. GET /api/library/session
apiRouter.get('/library/session', async (req, res) => {
    try {
        const sessionToken = req.sessionToken;
        if (!sessionToken) return res.status(400).json({ error: 'Session token required' });

        const sessionItems = await prisma.sessionItem.findMany({
            where: { sessionToken },
            include: {
                track: {
                    include: { files: true }
                }
            },
            orderBy: { createdAt: 'desc' }
        });

        res.json({ items: sessionItems });
    } catch (error) {
        console.error('Session library error:', error);
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
        if (track.expiresAt && new Date() > track.expiresAt) {
            return res.status(410).json({ error: 'Track expired' });
        }

        const file = track.files.find(f => f.format === format);
        if (!file) return res.status(404).json({ error: 'Format not available' });

        // Record download session item if token present
        if (sessionToken) {
            // Fire and forget or await? Await is safer for consistency.
            // Check if exists first to avoid dupes?
            // "source" should be "downloaded".
            // If the user requested it, they already have a "requested" item.
            // Requirement: "the tracks the user downloaded from the Global Library"
            // So if they requested it, it's already there. If not, add it.

            const existing = await prisma.sessionItem.findFirst({
                where: {
                    sessionToken,
                    trackId
                }
            });

            if (!existing) {
                await prisma.sessionItem.create({
                    data: {
                        sessionToken,
                        trackId,
                        source: 'downloaded'
                    }
                });
            }
        }

        // Stream file
        // The path in DB is relative to /data/downloads, e.g. "uuid/mp3.mp3"
        // But we need to serve it from the absolute path in the container.
        const absolutePath = require('path').join(DOWNLOADS_DIR, file.path);

        // Simple download with express.download
        // We set Content-Disposition attachment to trigger download
        res.download(absolutePath, `${track.title}.${format}`);

    } catch (error) {
        console.error('Download error:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

app.use('/api', apiRouter);

// Start
// Start Cleanup Task
const { startCleanupCron } = require('./cleanup');
startCleanupCron();

app.listen(PORT, () => {
    console.log(`API Service running on port ${PORT}`);
});
