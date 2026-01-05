/**
 * Queue Dispatcher Service
 * 
 * Implements "Fairness" logic by acting as a middleware between the Database Queue and BullMQ.
 * 
 * Responsibilities:
 * 1. Read 'queued' tracks from DB.
 * 2. Group them by User (SessionToken) or Playlist (GroupId).
 * 3. Enforce Concurrency Caps: Max 1 active job per Group.
 * 4. Round-Robin Dispatch: Rotate through groups to prevent starvation.
 * 5. Respect "Paused" state on playlists.
 */
class QueueDispatcher {
    constructor(prisma, queue) {
        this.prisma = prisma;
        this.queue = queue;
        this.isDispatching = false;

        // Configuration
        this.CAP_PER_GROUP = 1; // Max in-flight jobs per playlist/user
    }

    /**
     * Main Dispatch Loop
     * Called whenever a job completes, or a new job is submitted.
     */
    async dispatch() {
        if (this.isDispatching) return; // Prevent re-entry
        this.isDispatching = true;

        try {
            console.log('[Dispatcher] Running fairness dispatch...');

            // 1. Fetch all Queued Tracks & In-Flight Tracks
            // We need to know who is 'processing' to enforce caps.
            // Joining SessionItem to get grouping info.

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

            // Helper to get group key
            const getGroupKey = (item) => item.groupId || item.sessionToken;

            // Initialize groups with processing counts
            for (const item of processingItems) {
                const key = getGroupKey(item);
                if (!groups[key]) groups[key] = { queued: [], processing: 0, paused: false };
                groups[key].processing++;
            }

            // Populate queued items
            for (const item of queuedItems) {
                // If part of a Paused Group, skip entirely (effectively hidden from queue)
                if (item.group && item.group.paused) {
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

                // Cap Check
                if (group.processing >= this.CAP_PER_GROUP) {
                    continue; // Skip this group, they are full
                }

                // Take next available (FIFO within group)
                if (group.queued.length > 0) {
                    const nextItem = group.queued[0];
                    candidates.push(nextItem);
                }
            }

            console.log(`[Dispatcher] Selected ${candidates.length} candidates from ${groupKeys.length} groups.`);

            // 4. Dispatch Candidates
            for (const item of candidates) {
                try {
                    // Update DB to 'processing' immediately to reserve slot
                    // (Using transaction if possible, but strict order isn't critical here, 
                    // just preventing double dispatch next run)
                    await this.prisma.track.update({
                        where: { id: item.trackId },
                        data: { status: 'processing' }
                    });

                    // Construct Job Data
                    // We need to reconstruct 'url' and metadata from DB or just pass minimal info?
                    // The Worker needs: url, formats, sessionToken, groupId, trackId

                    const [providerType, providerId] = item.track.provider.split(':');
                    let url = providerId;
                    if (providerType === 'youtube') url = `https://www.youtube.com/watch?v=${providerId}`;
                    else if (providerType === 'spotify') url = `https://open.spotify.com/track/${providerId}`;
                    // else assume direct url if no prefix match? Or just use providerId as URL if simple.

                    // Note: Schema stores "provider:id" but original job had "url".
                    // Ideally we should store original URL. For now, reconstruction works for YT/Spotify.

                    await this.queue.add('download', {
                        url: url,
                        formats: ['mp3'], // Defaulting, since we lost original format request in DB? 
                        // Wait, DB has 'files' table but that's for output. 
                        // The original request 'formats' is not in Track model.
                        // Assuming standard formats for now.
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
                    // Revert status so it can be retried?
                    await this.prisma.track.update({
                        where: { id: item.trackId },
                        data: { status: 'queued' } // Back to queue
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
