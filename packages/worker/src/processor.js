const fs = require('fs');
const path = require('path');
const { downloadYoutube, getYoutubeMetadata } = require('./providers/youtube');
const { getSpotifyMetadata } = require('./providers/spotify');
const { resolveYouTubeUrl, buildSearchQuery } = require('./services/youtubeResolver');
const { transcodeFile } = require('./transcoder');
const { v4: uuidv4 } = require('uuid');
const rateLimiter = require('./services/rateLimiter');

const DOWNLOADS_DIR = process.env.DOWNLOADS_DIR || '/data/downloads';

// Ensure downloads dir exists
if (!fs.existsSync(DOWNLOADS_DIR)) {
    fs.mkdirSync(DOWNLOADS_DIR, { recursive: true });
}

async function processJob(job, prisma) {
    const { url, formats, sessionToken, groupId, trackId: existingTrackId } = job.data;
    const jobId = job.id;

    // Structured logger for this job context
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

    // If trackId is provided (from API), use existing Track record
    let track;
    let trackId;
    let trackDir;

    if (existingTrackId) {
        // Track was created by API, find and check it
        track = await prisma.track.findUnique({ where: { id: existingTrackId } });

        if (!track) {
            throw new Error(`Track ${existingTrackId} not found`);
        }

        // Check if already cancelled before doing any work
        if (track.status === 'cancelled') {
            logger.info({ message: 'Track cancelled, skipping' });
            return { trackId: existingTrackId, status: 'cancelled' };
        }

        trackId = existingTrackId;
        trackDir = path.join(DOWNLOADS_DIR, trackId);
        if (!fs.existsSync(trackDir)) fs.mkdirSync(trackDir, { recursive: true });
    } else {
        // Legacy path: no trackId provided (shouldn't happen with new flow)
        trackId = uuidv4();
        trackDir = path.join(DOWNLOADS_DIR, trackId);
        if (!fs.existsSync(trackDir)) fs.mkdirSync(trackDir, { recursive: true });
    }

    let provider = 'youtube';
    if (url.includes('spotify.com')) provider = 'spotify';
    else if (url.includes('soundcloud.com')) provider = 'soundcloud';
    else if (url.includes('youtube.com') || url.includes('youtu.be')) provider = 'youtube';
    else throw new Error('Unsupported provider');

    let title = 'Processing...';
    let artist = 'Unknown Artist';
    let duration = 0;
    let providerId = url; // Fallback
    // For Spotify, we need to construct a search query later
    let downloadUrl = url;

    // 1. Fetch Metadata & Prepare Download
    try {
        if (provider === 'spotify') {
            logger.info({ message: `Fetching Spotify metadata for: ${url}` });
            const meta = await getSpotifyMetadata(url);
            title = meta.title;
            artist = meta.artist;
            duration = Math.round(meta.duration || 0);
            providerId = meta.providerId;

            // Resolve to direct YouTube URL using HTTP-based resolver
            const searchQuery = buildSearchQuery(meta.artist, meta.title);
            logger.info({ message: 'Resolving YouTube URL', searchQuery });

            try {
                // Apply rate limit to resolution
                downloadUrl = await rateLimiter.run('RESOLVE', async () => {
                    return await resolveYouTubeUrl(searchQuery);
                });
                logger.info({ message: 'Resolved URL', downloadUrl });
            } catch (resolverError) {
                logger.error({ message: 'Resolve failed', error: resolverError.message });
                throw new Error(`Could not find YouTube video for: ${meta.artist} - ${meta.title}`);
            }

        } else if (provider === 'youtube' || provider === 'soundcloud') {
            const meta = await getYoutubeMetadata(url, logger);
            if (meta) {
                title = meta.title;
                artist = meta.artist;
                duration = meta.duration;
                providerId = meta.providerId || url;
            }
        }
    } catch (e) {
        logger.error({ message: 'Metadata fetch failed', error: e.message });
        // For Spotify, metadata fetch is critical to get the search query.
        if (provider === 'spotify') throw e;
        if (provider === 'youtube') throw e; // Usually critical for YouTube too now
    }

    // 1.5 Deduplication Check
    try {
        const existingTrack = await prisma.track.findFirst({
            where: {
                provider: `${provider}:${providerId}`,
                status: 'completed',
            },
            include: { files: true }
        });

        if (existingTrack && existingTrack.id !== trackId) {
            // Verify files exist on disk
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

                // Extend expiration
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

    // 2. Update or Create Database Record
    if (existingTrackId) {
        track = await prisma.track.update({
            where: { id: existingTrackId },
            data: {
                provider: `${provider}:${providerId}`,
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
                provider: `${provider}:${providerId}`,
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

    // 3. Download & Transcode
    try {
        if (duration > 900) {
            throw new Error('Track too long (max 15m)');
        }

        const sourcePath = path.join(trackDir, 'source.webm');

        const trackCheck1 = await prisma.track.findUnique({ where: { id: track.id } });
        if (trackCheck1 && trackCheck1.status === 'cancelled') throw new Error('Job cancelled by user');

        // Pass logger to download
        await downloadYoutube(downloadUrl, sourcePath, logger);

        // Verification
        let actualSourcePath = sourcePath;
        if (!fs.existsSync(sourcePath)) {
            const files = fs.readdirSync(trackDir);
            const found = files.find(f => f.startsWith('source'));
            if (found) actualSourcePath = path.join(trackDir, found);
            else throw new Error('Download failed: Source file not found');
        }

        const filesCreated = [];
        const mp3Path = path.join(trackDir, 'mp3.mp3');
        logger.info({ message: 'Transcoding to mp3...' });
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

        return { trackId: track.id, status: 'completed' };

    } catch (err) {
        logger.error({ message: 'Processing failed', error: err.message });

        let errMsg = err.message;
        const isRateLimit = errMsg.includes('Status code: 429') || errMsg.includes('Sign in');
        if (isRateLimit) errMsg = 'Rate Limit Reached (YouTube/Spotify) - Retrying...';

        await prisma.track.update({
            where: { id: track.id },
            data: {
                status: 'failed',
                error: errMsg
            }
        });
        throw err;
    }
}

module.exports = { processJob };
