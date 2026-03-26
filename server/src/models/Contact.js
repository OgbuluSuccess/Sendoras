const mongoose = require('mongoose');

const ContactSchema = new mongoose.Schema({
    list: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'List',
        required: true
    },
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    email: {
        type: String,
        required: true
    },
    firstName: {
        type: String,
        default: ''
    },
    lastName: {
        type: String,
        default: ''
    },
    status: {
        type: String,
        enum: ['active', 'bounced', 'unsubscribed'],
        default: 'active'
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

// Create a compound index so we can't add identical emails to the same list
ContactSchema.index({ list: 1, email: 1 }, { unique: true });

module.exports = mongoose.model('Contact', ContactSchema);
