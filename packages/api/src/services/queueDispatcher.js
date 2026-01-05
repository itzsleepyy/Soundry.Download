/**
 * Queue Dispatcher Service
 * 
 * Implements "Fairness" logic by acting as a middleware between the Database Queue and BullMQ.
 */
const Redis = require('ioredis');

class QueueDispatcher {
    constructor(prisma, queue) {
        this.prisma = prisma;
        this.queue = queue;
        this.isDispatching = false;

        // Configuration
        this.CAP_PER_GROUP = 1; // Max in-flight jobs per playlist/user

        // Redis for Circuit State
        const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';
        this.redis = new Redis(REDIS_URL);
    }

    /**
     * Main Dispatch Loop
     */
    async dispatch() {
        if (this.isDispatching) return; // Prevent re-entry
        this.isDispatching = true;

        try {
            console.log('[Dispatcher] Running fairness dispatch...');

            // 0. Check Circuit Breaker
            const isCircuitOpen = await this.redis.get('soundry:circuit:open');
            if (isCircuitOpen === 'true') {
                console.warn('[Dispatcher] ⚠️ Circuit is OPEN (Safe Mode). Skipping Playlist jobs.');
            }

            // 1. Fetch all Queued Tracks & In-Flight Tracks
            const [queuedItems, processingItems] = await Promise.all([
                this.prisma.sessionItem.findMany({
                    where: {
                        track: { status: 'queued' }
                    },
                    include: {
                        track: true,
                        group: true // To check paused status
                    },
                    orderBy: { createdAt: 'asc' } // FIFO within same group
                }),
                this.prisma.sessionItem.findMany({
                    where: {
                        track: { status: 'processing' }
                    },
                    include: { track: true }
                })
            ]);

            if (queuedItems.length === 0) {
                console.log('[Dispatcher] No queued items.');
                return;
            }

            // 2. Group items
            const groups = {}; // Key: GroupId/SessionToken, Value: { queued: [], processing: 0, paused: boolean }

            const getGroupKey = (item) => item.groupId || item.sessionToken;

            for (const item of processingItems) {
                const key = getGroupKey(item);
                if (!groups[key]) groups[key] = { queued: [], processing: 0, paused: false };
                groups[key].processing++;
            }

            for (const item of queuedItems) {
                // Skip Paused Groups
                if (item.group && item.group.paused) continue;

                // CIRCUIT BREAKER FILTER: Skip Playlists (items with groupId) if Circuit is Open
                if (isCircuitOpen === 'true' && item.groupId) {
                    continue;
                }

                const key = getGroupKey(item);
                if (!groups[key]) groups[key] = { queued: [], processing: 0, paused: false };
                groups[key].queued.push(item);
            }

            // 3. Select Candidates (Round Robin)
            const candidates = [];
            const groupKeys = Object.keys(groups);

            for (const key of groupKeys) {
                const group = groups[key];

                if (group.processing >= this.CAP_PER_GROUP) {
                    continue;
                }

                if (group.queued.length > 0) {
                    const nextItem = group.queued[0];
                    candidates.push(nextItem);
                }
            }

            console.log(`[Dispatcher] Selected ${candidates.length} candidates from ${groupKeys.length} groups.`);

            // 4. Dispatch Candidates
            for (const item of candidates) {
                try {
                    await this.prisma.track.update({
                        where: { id: item.trackId },
                        data: { status: 'processing' }
                    });

                    // Fix: properly split only on the first colon
                    const separatorIndex = item.track.provider.indexOf(':');
                    const providerType = item.track.provider.substring(0, separatorIndex);
                    const providerId = item.track.provider.substring(separatorIndex + 1);

                    let url = providerId;
                    if (providerType === 'youtube') {
                        // If it's just an ID, reconstruct. If it's a full URL, use it.
                        if (!providerId.includes('://')) url = `https://www.youtube.com/watch?v=${providerId}`;
                    } else if (providerType === 'spotify') {
                        // If it's just an ID, reconstruct. If it's a full URL, ensure we don't double-wrap.
                        if (!providerId.includes('://')) url = `https://open.spotify.com/track/${providerId}`;
                    }

                    await this.queue.add('download', {
                        url: url,
                        formats: ['mp3'],
                        sessionToken: item.sessionToken,
                        groupId: item.groupId,
                        trackId: item.trackId,
                        requestId: require('uuid').v4()
                    }, {
                        attempts: 5,
                        backoff: { type: 'exponential', delay: 2000 },
                        priority: item.groupId ? 5 : 1
                    });

                    console.log(`[Dispatcher] Dispatched Track ${item.trackId} (Group: ${getGroupKey(item)})`);
                } catch (e) {
                    console.error(`[Dispatcher] Failed to dispatch ${item.trackId}`, e);
                    await this.prisma.track.update({
                        where: { id: item.trackId },
                        data: { status: 'queued' }
                    });
                }
            }

        } catch (error) {
            console.error('[Dispatcher] Error:', error);
        } finally {
            this.isDispatching = false;
        }
    }
}

module.exports = QueueDispatcher;
