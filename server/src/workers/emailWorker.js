const { Worker } = require('bullmq');
const { connection } = require('../config/queue');
const { sendEmail } = require('../services/emailService');
const Campaign = require('../models/Campaign');

const emailWorker = new Worker('email-queue', async (job) => {
    const { campaignId, to, subject, html, from, replyTo } = job.data;

    try {
        const result = await sendEmail({ to, subject, html, from, replyTo });

        // Update campaign stats (Naive approach for now, better to batch update)
        if (campaignId) {
            await Campaign.findByIdAndUpdate(campaignId, { 
                $inc: { sentCount: 1 },
                $push: {
                    deliveryLogs: {
                        email: to,
                        status: 'sent',
                        messageId: result.messageId || result.MessageId,
                        provider: result.provider,
                        message: 'Delivered successfully'
                    }
                }
            });
        }
    } catch (error) {
        console.error(`Job ${job.id} failed:`, error);
        throw error;
    }
}, { connection });

emailWorker.on('completed', (job) => {
    console.log(`Job ${job.id} completed!`);
});

emailWorker.on('failed', async (job, err) => {
    console.log(`Job ${job.id} failed with ${err.message}`);
    try {
        if (job?.data?.campaignId) {
            await Campaign.findByIdAndUpdate(job.data.campaignId, {
                $inc: { failedCount: 1 },
                $push: {
                    deliveryLogs: {
                        email: job.data.to || 'Unknown',
                        status: 'failed',
                        message: err.message || 'Unknown error occurred'
                    }
                }
            });
        }
    } catch (e) {
        console.error('Failed to update failure stats', e);
    }
});

console.log('Email Worker Started...');

module.exports = emailWorker;
