const { Queue } = require('bullmq');

// Redis Connection Options
let connection;
if (process.env.REDIS_URL) {
    const url = new URL(process.env.REDIS_URL);
    connection = {
        host: url.hostname,
        port: url.port ? parseInt(url.port) : 6379,
        username: url.username || 'default',
        password: url.password,
        tls: url.hostname.includes('upstash') ? { rejectUnauthorized: false } : undefined,
        maxRetriesPerRequest: null,
    };
} else {
    connection = {
        host: process.env.REDIS_HOST || '127.0.0.1',
        port: process.env.REDIS_PORT ? parseInt(process.env.REDIS_PORT) : 6379,
        password: process.env.REDIS_PASSWORD,
        maxRetriesPerRequest: null,
    };
}

// Create Email Queue
const emailQueue = new Queue('email-queue', { connection });

module.exports = { emailQueue, connection };
