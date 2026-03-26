const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const UserSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true,
        unique: true
    },
    password: {
        type: String,
        required: true
    },
    role: {
        type: String,
        enum: ['admin', 'b2b', 'b2c'],
        default: 'b2c'
    },
    tier: {
        type: String,
        default: 'free'
    },
    // Email quota tracking
    emailsSentThisMonth: {
        type: Number,
        default: 0
    },
    emailsResetDate: {
        type: Date,
        default: () => {
            const d = new Date();
            d.setMonth(d.getMonth() + 1, 1);
            d.setHours(0, 0, 0, 0);
            return d; // 1st of next month
        }
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

// Encrypt password before save
UserSchema.pre('save', async function (next) {
    if (!this.isModified('password')) {
        next();
    }
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
});

// Match user entered password to hashed password in database
UserSchema.methods.matchPassword = async function (enteredPassword) {
    return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model('User', UserSchema);
