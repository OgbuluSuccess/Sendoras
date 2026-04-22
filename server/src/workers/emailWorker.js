const { Worker } = require('bullmq');
const { connection } = require('../config/queue');
const { sendEmail } = require('../services/emailService');
const Campaign = require('../models/Campaign');
const MessageLog = require('../models/MessageLog');

const emailWorker = new Worker('email-queue', async (job) => {
    const { campaignId, to, subject, html, from, replyTo, userId, source, messageLogId, unsubscribeUrl } = job.data;

    try {
        const result = await sendEmail({ to, subject, html, from, replyTo, unsubscribeUrl });

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

        if (messageLogId) {
            await MessageLog.findByIdAndUpdate(messageLogId, {
                status: 'delivered',
                messageId: result.messageId || result.MessageId
            });
        } else if (userId) {
            await MessageLog.create({
                user: userId,
                to,
                subject,
                status: 'delivered',
                source: source || 'app',
                messageId: result.messageId || result.MessageId
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
    const { campaignId, userId, to, subject, source, messageLogId } = job?.data || {};
    try {
        if (campaignId) {
            await Campaign.findByIdAndUpdate(campaignId, {
                $inc: { failedCount: 1 },
                $push: {
                    deliveryLogs: {
                        email: to || 'Unknown',
                        status: 'failed',
                        message: err.message || 'Unknown error occurred'
                    }
                }
            });
        }

        if (messageLogId) {
            await MessageLog.findByIdAndUpdate(messageLogId, {
                status: 'failed',
                error: err.message
            });
        } else if (userId) {
            await MessageLog.create({
                user: userId,
                to: to || 'Unknown',
                subject: subject || 'Campaign Email',
                status: 'failed',
                source: source || 'app',
                error: err.message
            });
        }
    } catch (e) {
        console.error('Failed to update failure stats', e);
    }
});

console.log('Email Worker Started...');

module.exports = emailWorker;
