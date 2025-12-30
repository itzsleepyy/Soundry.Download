const fs = require('fs');
const path = require('path');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();
const DOWNLOADS_DIR = process.env.DOWNLOADS_DIR || '/data/downloads';

// Cron interval: 10 minutes
const INTERVAL_MS = 10 * 60 * 1000;

async function runCleanup() {
    console.log('[Cleanup] Starting cleanup task...');
    try {
        const now = new Date();

        // 1. Find expired tracks
        const expiredTracks = await prisma.track.findMany({
            where: {
                expiresAt: { lt: now }
            },
            include: {
                files: true
            }
        });

        console.log(`[Cleanup] Found ${expiredTracks.length} expired tracks.`);

        for (const track of expiredTracks) {
            // Delete files from disk
            for (const file of track.files) {
                const absPath = path.join(DOWNLOADS_DIR, file.path);
                try {
                    if (fs.existsSync(absPath)) {
                        fs.unlinkSync(absPath);
                        console.log(`[Cleanup] Deleted file: ${absPath}`);
                    }
                } catch (err) {
                    console.error(`[Cleanup] Failed to delete file ${absPath}:`, err.message);
                }
            }

            // Also try to delete the track directory if it's empty/exists
            // Assuming structure is /data/downloads/<trackId>/...
            const trackDir = path.join(DOWNLOADS_DIR, track.id);
            try {
                if (fs.existsSync(trackDir)) {
                    fs.rmdirSync(trackDir, { recursive: true });
                    console.log(`[Cleanup] Deleted directory: ${trackDir}`);
                }
            } catch (err) {
                console.error(`[Cleanup] Failed to delete directory ${trackDir}:`, err.message);
            }
        }

        // 2. Delete from DB
        // Prisma cascade delete will remove Files and SessionItems via relation
        if (expiredTracks.length > 0) {
            const deleteResult = await prisma.track.deleteMany({
                where: {
                    id: { in: expiredTracks.map(t => t.id) }
                }
            });
            console.log(`[Cleanup] Deleted ${deleteResult.count} tracks from database.`);
        }

        // 3. Optional: Global cap enforcement (FIFO)
        // If > 500 active tracks, delete oldest
        const CAP = 500;
        const totalCount = await prisma.track.count();
        if (totalCount > CAP) {
            const toRemoveCount = totalCount - CAP;
            console.log(`[Cleanup] Global cap exceeded by ${toRemoveCount}. Removing oldest...`);

            const oldestTracks = await prisma.track.findMany({
                orderBy: { createdAt: 'asc' },
                take: toRemoveCount,
                include: { files: true }
            });

            // Re-use logic to delete files for these... 
            // For MVP simplicity, just calling deleteMany does NOT delete files from disk automatically unless we handle it.
            // So we must loop.
            for (const track of oldestTracks) {
                const trackDir = path.join(DOWNLOADS_DIR, track.id);
                try {
                    if (fs.existsSync(trackDir)) {
                        fs.rmdirSync(trackDir, { recursive: true });
                    }
                } catch (err) { }
            }

            await prisma.track.deleteMany({
                where: { id: { in: oldestTracks.map(t => t.id) } }
            });
            console.log(`[Cleanup] Removed ${toRemoveCount} oldest tracks.`);
        }

    } catch (error) {
        console.error('[Cleanup] Error during cleanup:', error);
    }
}

function startCleanupCron() {
    // Run immediately on startup
    runCleanup();
    // Then every interval
    setInterval(runCleanup, INTERVAL_MS);
}

module.exports = { startCleanupCron };
