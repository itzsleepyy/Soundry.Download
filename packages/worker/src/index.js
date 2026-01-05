const { Worker } = require('bullmq');
const Redis = require('ioredis');
const { PrismaClient } = require('@prisma/client');
const { processJob } = require('./processor');

const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';
const prisma = new PrismaClient();

const redisConnection = new Redis(REDIS_URL, {
    maxRetriesPerRequest: null,
});

// Publisher for dispatch events
const redisPublisher = new Redis(REDIS_URL);

console.log('Starting Soundry Worker...');

const concurrency = parseInt(process.env.WORKER_CONCURRENCY) || 2;
console.log(`Worker concurrency: ${concurrency} concurrent jobs`);

const worker = new Worker('downloads', async (job) => {
    console.log(`Processing job ${job.id} for ${job.data.url}`);
    return await processJob(job, prisma);
}, {
    connection: redisConnection,
    concurrency // Use config variable
});

async function triggerDispatch() {
    try {
        await redisPublisher.publish('soundry:dispatch', 'job-finished');
    } catch (e) {
        console.error('Failed to publish dispatch event:', e);
    }
}

worker.on('completed', async (job) => {
    console.log(`Job ${job.id} completed!`);
    await triggerDispatch();
});

worker.on('failed', async (job, err) => {
    console.error(`Job ${job.id} failed: ${err.message}`);
    await triggerDispatch();
});

process.on('SIGTERM', async () => {
    await worker.close();
    await prisma.$disconnect();
    redisPublisher.disconnect();
});
