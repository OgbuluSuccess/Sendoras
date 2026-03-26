// Queue disabled temporarily to allow server start without Redis
// const { Queue, Worker } = require('bullmq');
const EmailService = require('../email/EmailService');

// Mock Queue for resilience
const emailQueue = {
    add: async () => {
        throw new Error("Redis not available (Queue disabled)");
    }
};

console.log("Redis Queue disabled to allow server startup without Redis.");

/*
const connection = {
    host: process.env.REDIS_HOST || 'localhost',
    port: process.env.REDIS_PORT || 6379,
    // Add retry strategy to prevent crash?
    maxRetriesPerRequest: null, 
    enableOfflineQueue: false
};

const emailQueue = new Queue('email-queue', { connection });

const worker = new Worker('email-queue', async (job) => {
    console.log(`Processing email job ${job.id}`);
    const { to, subject, html } = job.data;
    // Fix circular dependency/import issue if any. 
    // The previous code imported from ../email/EmailService. 
    // Ensure that path is correct.
    const service = require('../email/EmailService');
    await service.sendEmail({ to, subject, html });
}, { connection });

worker.on('completed', (job) => {
    console.log(`Job ${job.id} completed!`);
});

worker.on('failed', (job, err) => {
    console.error(`Job ${job.id} failed with ${err.message}`);
});
*/

module.exports = emailQueue;
