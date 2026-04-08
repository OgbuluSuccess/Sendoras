const mongoose = require('mongoose');

const messageLogSchema = new mongoose.Schema(
    {
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        to: {
            type: String,
            required: true,
        },
        subject: {
            type: String,
            required: true,
        },
        status: {
            type: String,
            enum: ['delivered', 'queued', 'failed'],
            default: 'queued',
        },
        source: {
            type: String,
            enum: ['app', 'api'],
            required: true,
        },
        error: {
            type: String,
        },
        messageId: {
            type: String,
        },
    },
    { timestamps: true }
);

module.exports = mongoose.model('MessageLog', messageLogSchema);
