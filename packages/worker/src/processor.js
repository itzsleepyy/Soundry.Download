const fs = require('fs');
const path = require('path');
const { downloadYoutube, getYoutubeMetadata } = require('./providers/youtube');
const { getSpotifyMetadata } = require('./providers/spotify');
const { resolveYouTubeUrl, buildSearchQuery } = require('./services/youtubeResolver');
const { transcodeFile } = require('./transcoder');
const { v4: uuidv4 } = require('uuid');
const rateLimiter = require('./services/rateLimiter');
const CacheService = require('./services/cacheService');
const circuitBreaker = require('./services/circuitBreaker');

const DOWNLOADS_DIR = process.env.DOWNLOADS_DIR || '/data/downloads';

if (!fs.existsSync(DOWNLOADS_DIR)) {
    fs.mkdirSync(DOWNLOADS_DIR, { recursive: true });
}

async function processJob(job, prisma) {
    const { url, formats, sessionToken, groupId, trackId: existingTrackId } = job.data;
    const jobId = job.id;
    const cache = new CacheService(prisma);

    const logger = {
        info: (obj) => {
            console.log(JSON.stringify({
                jobId,
                trackId: existingTrackId || 'unknown',
                timestamp: new Date().toISOString(),
                ...obj
            }));
        },
        error: (obj) => {
            console.error(JSON.stringify({
                jobId,
                trackId: existingTrackId || 'unknown',
                timestamp: new Date().toISOString(),
                ...obj
            }));
        }
    };

    let track;
    let trackId;
    let trackDir;

    if (existingTrackId) {
        track = await prisma.track.findUnique({ where: { id: existingTrackId } });

        if (!track) {
            // Unrecoverable: Track deleted from DB?
            // Throwing here implies we want to retry finding it? No.
            // But if DB is down, findUnique throws.
            // If just null, it's logical error.
            throw new Error(`Track ${existingTrackId} not found`);
        }

        if (track.status === 'cancelled') {
            logger.info({ message: 'Track cancelled, skipping' });
            return { trackId: existingTrackId, status: 'cancelled' };
        }

        trackId = existingTrackId;
        trackDir = path.join(DOWNLOADS_DIR, trackId);
        if (!fs.existsSync(trackDir)) fs.mkdirSync(trackDir, { recursive: true });
    } else {
        trackId = uuidv4();
        trackDir = path.join(DOWNLOADS_DIR, trackId);
        if (!fs.existsSync(trackDir)) fs.mkdirSync(trackDir, { recursive: true });
    }

    let provider = 'youtube';
    if (url.includes('spotify.com')) provider = 'spotify';
    else if (url.includes('soundcloud.com')) provider = 'soundcloud';
    else if (url.includes('youtube.com') || url.includes('youtu.be')) provider = 'youtube';
    else {
        // UNRECOVERABLE
        logger.error({ message: 'Unsupported provider', url });
        await markFailed(prisma, existingTrackId || trackId, 'Unsupported provider URL');
        return { status: 'failed', error: 'Unsupported provider' };
    }

    let title = 'Processing...';
    let artist = 'Unknown Artist';
    let duration = 0;
    let providerId = url;
    let downloadUrl = url;

    try {
        if (provider === 'spotify') {
            const meta = await getSpotifyMetadata(url);
            title = meta.title;
            artist = meta.artist;
            duration = Math.round(meta.duration || 0);
            providerId = meta.providerId;

            const cacheKey = `spotify:${meta.providerId}`;
            const cachedYoutubeId = await cache.get('resolver', cacheKey);

            if (cachedYoutubeId) {
                logger.info({ message: 'Resolver Cache HIT', cachedYoutubeId });
                downloadUrl = `https://www.youtube.com/watch?v=${cachedYoutubeId}`;
            } else {
                const searchQuery = buildSearchQuery(meta.artist, meta.title);

                downloadUrl = await rateLimiter.run('RESOLVE', async () => {
                    return await resolveYouTubeUrl(searchQuery);
                });

                let videoId = null;
                try {
                    const u = new URL(downloadUrl);
                    if (u.hostname.includes('youtube.com')) videoId = u.searchParams.get('v');
                    else if (u.hostname.includes('youtu.be')) videoId = u.pathname.slice(1);
                } catch { }
                if (videoId) await cache.set('resolver', cacheKey, videoId);
            }
        } else if (provider === 'youtube') {
            const meta = await getYoutubeMetadata(url, logger);
            if (meta) {
                title = meta.title;
                artist = meta.artist;
                duration = meta.duration;
                providerId = meta.providerId || url;
                // cache metadata
                await cache.set('metadata', providerId, { title, artist, duration, providerId });
            }
        }

        let targetProviderString = `${provider}:${providerId}`;
        if (provider === 'spotify' && downloadUrl.includes('youtube')) {
            try {
                let ytId = downloadUrl.includes('v=') ? downloadUrl.split('v=')[1].split('&')[0] : null;
                if (ytId) targetProviderString = `youtube:${ytId}`;
            } catch { }
        }

        // Deduplication
        try {
            const existingTrack = await prisma.track.findFirst({
                where: {
                    provider: targetProviderString,
                    status: 'completed',
                },
                include: { files: true }
            });

            if (existingTrack && existingTrack.id !== trackId) {
                const hasFiles = existingTrack.files.length > 0 && existingTrack.files.every(f => {
                    const fullPath = path.join(DOWNLOADS_DIR, f.path);
                    return fs.existsSync(fullPath);
                });

                if (hasFiles) {
                    logger.info({ message: 'Deduplication success', existingTrackId: existingTrack.id });

                    if (existingTrackId) {
                        await prisma.sessionItem.updateMany({
                            where: { trackId: existingTrackId },
                            data: { trackId: existingTrack.id }
                        });
                        await prisma.track.delete({ where: { id: existingTrackId } });
                    } else if (sessionToken) {
                        await prisma.sessionItem.create({
                            data: {
                                sessionToken,
                                trackId: existingTrack.id,
                                source: 'requested',
                                groupId: groupId
                            }
                        });
                    }

                    const now = new Date();
                    const expiresAt = new Date(now.getTime() + 24 * 60 * 60 * 1000);
                    await prisma.track.update({
                        where: { id: existingTrack.id },
                        data: { expiresAt: expiresAt }
                    });

                    return { trackId: existingTrack.id, status: 'completed' };
                }
            }
        } catch (e) {
            logger.error({ message: 'Deduplication check failed', error: e.message });
        }

        // Processing
        if (existingTrackId) {
            track = await prisma.track.update({
                where: { id: existingTrackId },
                data: {
                    provider: targetProviderString,
                    title,
                    artist,
                    durationSeconds: duration || 0,
                    status: 'processing'
                }
            });
        } else {
            track = await prisma.track.create({
                data: {
                    id: trackId,
                    provider: targetProviderString,
                    title,
                    artist,
                    durationSeconds: duration || 0,
                    status: 'processing'
                }
            });

            if (sessionToken) {
                await prisma.sessionItem.create({
                    data: {
                        sessionToken,
                        trackId: track.id,
                        source: 'requested',
                        groupId: groupId
                    }
                });
            }
        }

        if (duration > 900) throw new Error('Track too long (max 15m)');
        const sourcePath = path.join(trackDir, 'source.webm');

        const trackCheck1 = await prisma.track.findUnique({ where: { id: track.id } });
        if (trackCheck1 && trackCheck1.status === 'cancelled') throw new Error('Job cancelled by user');

        await downloadYoutube(downloadUrl, sourcePath, logger);

        let actualSourcePath = sourcePath;
        if (!fs.existsSync(sourcePath)) {
            const files = fs.readdirSync(trackDir);
            const found = files.find(f => f.startsWith('source'));
            if (found) actualSourcePath = path.join(trackDir, found);
            else throw new Error('Download failed: Source file not found');
        }

        const filesCreated = [];
        const mp3Path = path.join(trackDir, 'mp3.mp3');
        const mp3Stats = await transcodeFile(actualSourcePath, mp3Path, 'mp3');
        filesCreated.push({
            format: 'mp3',
            path: `${track.id}/mp3.mp3`,
            sizeBytes: mp3Stats.size
        });

        const sourceFinal = path.join(trackDir, 'source.m4a');
        if (actualSourcePath !== sourceFinal) {
            fs.renameSync(actualSourcePath, sourceFinal);
        }

        const now = new Date();
        const expiresAt = new Date(now.getTime() + 24 * 60 * 60 * 1000);

        await prisma.track.update({
            where: { id: track.id },
            data: {
                title,
                artist,
                durationSeconds: duration,
                status: 'completed',
                completedAt: now,
                expiresAt: expiresAt,
                files: {
                    create: filesCreated.map(f => ({
                        format: f.format,
                        path: f.path,
                        sizeBytes: f.sizeBytes
                    }))
                }
            }
        });

        await circuitBreaker.record(true);
        return { trackId: track.id, status: 'completed' };

    } catch (err) {
        logger.error({ message: 'Processing failed', error: err.message });

        const errMsg = err.message;

        // --- ERROR CLASSIFICATION FOR RETRY ---

        // 1. Unrecoverable Validation Errors (DO NOT RETRY)
        const fatalErrors = [
            'Invalid base62 id', // Spotify Malformed ID
            'Invalid Spotify URL',
            'Track too long',
            'Unsupported provider',
            'Sign in to confirm your age', // Often hard block
            'Video unavailable'
        ];

        if (fatalErrors.some(f => errMsg.includes(f))) {
            logger.info({ message: 'Fatal Error detected. Stopping retries.' });
            await markFailed(prisma, track ? track.id : (existingTrackId || trackId), errMsg);
            // DO NOT THROW. Return failure status.
            return { status: 'failed', error: errMsg };
        }

        // 2. Recoverable Errors (Network, Rate Limit) -> Throw to Retry
        const isRateLimit = errMsg.includes('Status code: 429') || errMsg.includes('Sign in');
        const userMsg = isRateLimit ? 'Rate Limit Reached (YouTube/Spotify) - Retrying...' : errMsg;

        await markFailed(prisma, track ? track.id : (existingTrackId || trackId), userMsg);

        // Record failure in Circuit Breaker
        await circuitBreaker.record(false);

        throw err;
    }
}

async function markFailed(prisma, trackId, error) {
    try {
        await prisma.track.update({
            where: { id: trackId },
            data: { status: 'failed', error }
        });
    } catch (e) {
        console.error('Failed to update track status', e);
    }
}

module.exports = { processJob };
