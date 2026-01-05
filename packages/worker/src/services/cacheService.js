/**
 * Database-backed Cache Service
 * 
 * Used to store:
 * 1. Resolver Results (Spotify ID -> YouTube ID)
 * 2. Metadata Results (YouTube ID -> parsed metadata)
 */

const TTL_HOURS = 24;

class CacheService {
    constructor(prisma) {
        this.prisma = prisma;
    }

    /**
     * Get value from cache
     * @param {string} type 'resolver' | 'metadata'
     * @param {string} key Unique key
     * @returns {Promise<string|Object|null>}
     */
    async get(type, key) {
        const now = new Date();
        try {
            if (type === 'resolver') {
                const record = await this.prisma.resolverCache.findUnique({
                    where: { key }
                });

                if (record && record.expiresAt > now) {
                    return record.value;
                }

                // Cleanup expired if found
                if (record) {
                    await this.prisma.resolverCache.delete({ where: { id: record.id } }).catch(() => { });
                }

            } else if (type === 'metadata') {
                const record = await this.prisma.metadataCache.findUnique({
                    where: { key }
                });

                if (record && record.expiresAt > now) {
                    return JSON.parse(record.data);
                }

                if (record) {
                    await this.prisma.metadataCache.delete({ where: { id: record.id } }).catch(() => { });
                }
            }
        } catch (e) {
            console.warn(`[Cache] Get failed for ${type}:${key}`, e.message);
        }
        return null;
    }

    /**
     * Set value in cache
     * @param {string} type 'resolver' | 'metadata'
     * @param {string} key 
     * @param {string|Object} value 
     */
    async set(type, key, value) {
        const expiresAt = new Date();
        expiresAt.setHours(expiresAt.getHours() + TTL_HOURS);

        try {
            if (type === 'resolver') {
                // Upsert
                await this.prisma.resolverCache.upsert({
                    where: { key },
                    update: { value: String(value), expiresAt },
                    create: { key, value: String(value), expiresAt }
                });
            } else if (type === 'metadata') {
                await this.prisma.metadataCache.upsert({
                    where: { key },
                    update: { data: JSON.stringify(value), expiresAt },
                    create: { key, data: JSON.stringify(value), expiresAt }
                });
            }
        } catch (e) {
            console.warn(`[Cache] Set failed for ${type}:${key}`, e.message);
        }
    }
}

module.exports = CacheService;
