const fs = require('fs');
const path = require('path');
const { downloadYoutube, getYoutubeMetadata } = require('./providers/youtube');
const { getSpotifyMetadata } = require('./providers/spotify');
const { transcodeFile } = require('./transcoder');
const { v4: uuidv4 } = require('uuid');

const DOWNLOADS_DIR = process.env.DOWNLOADS_DIR || '/data/downloads';

// Ensure downloads dir exists
if (!fs.existsSync(DOWNLOADS_DIR)) {
    fs.mkdirSync(DOWNLOADS_DIR, { recursive: true });
}

async function processJob(job, prisma) {
    const { url, formats, sessionToken, groupId, trackId: existingTrackId } = job.data;

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
            console.log(`Track ${existingTrackId} was cancelled, skipping`);
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
            console.log(`Fetching Spotify metadata for: ${url}`);
            const meta = await getSpotifyMetadata(url);
            title = meta.title;
            artist = meta.artist;
            duration = Math.round(meta.duration || 0);
            providerId = meta.providerId;

            // Construct Search Query for Audio Download
            // "Artist - Title audio"
            downloadUrl = `ytsearch1:${meta.artist} - ${meta.title} audio`;
            console.log(`Resolved Spotify track to search query: ${downloadUrl}`);

        } else if (provider === 'youtube') {
            const meta = await getYoutubeMetadata(url);
            if (meta) {
                title = meta.title;
                artist = meta.artist;
                duration = meta.duration;
                providerId = meta.providerId || url;
            }
        }
    } catch (e) {
        console.warn('Metadata fetch failed, creating placeholder track or failing if critical', e);
        // For Spotify, metadata fetch is critical to get the search query.
        if (provider === 'spotify') throw e;
    }

    // 1.5 Deduplication Check
    try {
        const existingTrack = await prisma.track.findFirst({
            where: {
                provider: `${provider}:${providerId}`,
                status: 'completed',
                // Check if it has files. Note: Prisma might not guarantee file on disk, so we verify below.
            },
            include: { files: true }
        });

        if (existingTrack && existingTrack.id !== trackId) {
            // Verify files exist on disk
            const hasFiles = existingTrack.files.length > 0 && existingTrack.files.every(f => {
                const fullPath = path.join(DOWNLOADS_DIR, f.path);
                return fs.existsSync(fullPath);
            });

            // Also check not expired (though we filter logic below, strictly speaking we can revive expired if files exist)
            // But if cleanup ran, files might be gone.

            if (hasFiles) {
                console.log(`Found existing track for ${provider}:${providerId}, reusing ${existingTrack.id}`);

                if (existingTrackId) {
                    // Delete the placeholder track and update SessionItem to point to existing track
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
        console.warn('Deduplication check failed, proceeding with fresh download', e);
    }

    // 2. Update or Create Database Record
    if (existingTrackId) {
        // Update existing track with metadata and set to processing
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
        // Create new track (legacy path)
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

        // Create SessionItem for legacy path
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
        // We always use a consistent source name for intermediate file
        // downloadYoutube uses yt-dlp which handles container detection, but we force output path.
        // We'll use .webm as a generic container wrapper for downloadYoutube's output if possible,
        // or rely on yt-dlp to append extension if we don't force it?
        // simple-youtube-dl provider uses `output: outputPath`.
        const sourcePath = path.join(trackDir, 'source.webm');

        // Check for cancellation before download
        const trackCheck1 = await prisma.track.findUnique({ where: { id: track.id } });
        if (trackCheck1 && trackCheck1.status === 'cancelled') throw new Error('Job cancelled by user');

        console.log(`Downloading audio from: ${downloadUrl} to ${sourcePath}`);
        await downloadYoutube(downloadUrl, sourcePath);

        // Verification: Check if file exists. 
        // yt-dlp might append extension (e.g. source.webm.m4a) if we are not careful?
        // With `output: outputPath`, it usually respects it. But if it merges formats, it might be weird.
        // Let's check for any file starting with 'source' if exact match fails.
        let actualSourcePath = sourcePath;
        if (!fs.existsSync(sourcePath)) {
            const files = fs.readdirSync(trackDir);
            const found = files.find(f => f.startsWith('source'));
            if (found) actualSourcePath = path.join(trackDir, found);
            else throw new Error('Download failed: Source file not found');
        }

        const filesCreated = [];
        const supportedFormats = ['mp3', 'flac', 'wav'];
        const activeFormats = formats.filter(f => supportedFormats.includes(f));

        for (const format of activeFormats) {
            // Check for cancellation before each transcode
            const trackCheck2 = await prisma.track.findUnique({ where: { id: track.id } });
            if (trackCheck2 && trackCheck2.status === 'cancelled') throw new Error('Job cancelled by user');

            const relPath = `${track.id}/${format}.${format}`;
            const destPath = path.join(trackDir, `${format}.${format}`);
            console.log(`Transcoding to ${format}...`);
            const stats = await transcodeFile(actualSourcePath, destPath, format);
            filesCreated.push({ format, path: relPath, sizeBytes: stats.size });
        }

        // Cleanup source
        if (fs.existsSync(actualSourcePath)) {
            try { fs.unlinkSync(actualSourcePath); } catch (e) { }
        }

        // 4. Update Success
        const now = new Date();
        const expiresAt = new Date(now.getTime() + 24 * 60 * 60 * 1000);

        await prisma.track.update({
            where: { id: track.id },
            data: {
                title, // Update in case it changed or was placeholder
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
        console.error('Processing failed', err);
        let errMsg = err.message;
        if (errMsg.includes('Status code: 429')) errMsg = 'Rate Limit Reached (YouTube/Spotify)';

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
