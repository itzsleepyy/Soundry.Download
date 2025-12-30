const { Worker } = require('bullmq');
const Redis = require('ioredis');
const { PrismaClient } = require('@prisma/client');
const { processJob } = require('./processor');

const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';
const prisma = new PrismaClient();

const redisConnection = new Redis(REDIS_URL, {
    maxRetriesPerRequest: null,
});

console.log('Starting Soundry Worker...');

const worker = new Worker('downloads', async (job) => {
    console.log(`Processing job ${job.id} for ${job.data.url}`);

    // Create initial Track record if not exists?
    // Actually our API didn't create the track, so we must create it here or API should have.
    // Plan said: API adds to queue. Worker processes.
    // So we need to create the Track record ASAP.
    // But if we fail immediately, we might not want spam. 
    // Let's create it as "processing" once we pick it up.

    return await processJob(job, prisma);

}, { connection: redisConnection, concurrency: 2 }); // Concurrency limit as per requirements

worker.on('completed', (job) => {
    console.log(`Job ${job.id} completed!`);
});

worker.on('failed', (job, err) => {
    console.error(`Job ${job.id} failed: ${err.message}`);
});

process.on('SIGTERM', async () => {
    await worker.close();
    await prisma.$disconnect();
});
