const mongoose = require('mongoose');

const CampaignSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    listId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'List'
    },
    name: {
        type: String,
        required: true
    },
    subject: {
        type: String,
        required: true
    },
    sender: {
        type: String,
        required: true
    },
    content: {
        type: String, // HTML content
        required: true
    },
    recipients: [{
        email: {
            type: String,
            required: true
        },
        firstName: String,
        lastName: String
    }],
    status: {
        type: String,
        enum: ['Draft', 'Scheduled', 'Sent', 'Failed'],
        default: 'Draft'
    },
    recipientCount: {
        type: Number,
        default: 0
    },
    sentCount: {
        type: Number,
        default: 0
    },
    failedCount: {
        type: Number,
        default: 0
    },
    deliveryLogs: [{
        email: String,
        status: { type: String, enum: ['sent', 'failed'] },
        messageId: String,
        provider: String,
        message: String,
        timestamp: { type: Date, default: Date.now }
    }],
    scheduledFor: {
        type: Date
    },
    source: {
        type: String,
        enum: ['api', 'ui'],
        default: 'ui'
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('Campaign', CampaignSchema);
