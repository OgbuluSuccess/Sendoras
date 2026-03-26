const User = require('../models/User');
const Campaign = require('../models/Campaign');

// Quota Limits (Emails per month)
const QUOTAS = {
    free: 1000,
    pro: 50000,
    enterprise: Infinity
};

// Spam Keywords (Naive list)
const SPAM_KEYWORDS = [
    'buy now', 'free money', 'risk-free', 'detective', 'casino',
    'lottery', 'viagra', 'winner', 'guaranteed', '100% free'
];

exports.checkQuota = async (userId, count) => {
    const user = await User.findById(userId);
    if (!user) throw new Error('User not found');

    const limit = QUOTAS[user.tier] || QUOTAS.free;

    // Calculate usage for current month
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const usage = await Campaign.aggregate([
        {
            $match: {
                user: user._id,
                createdAt: { $gte: startOfMonth },
                status: 'Sent'
            }
        },
        {
            $group: {
                _id: null,
                totalSent: { $sum: "$sentCount" }
            }
        }
    ]);

    const currentUsage = usage.length > 0 ? usage[0].totalSent : 0;

    if (currentUsage + count > limit) {
        return {
            allowed: false,
            message: `Quota exceeded. You have used ${currentUsage}/${limit === Infinity ? 'Unlimited' : limit} emails this month.`
        };
    }

    return { allowed: true };
};

exports.scanContent = (subject, html) => {
    const text = (subject + ' ' + html).toLowerCase();
    const foundKeywords = SPAM_KEYWORDS.filter(keyword => text.includes(keyword));

    if (foundKeywords.length > 0) {
        return {
            allowed: false,
            message: `Content flagged for spam terms: ${foundKeywords.join(', ')}`
        };
    }

    return { allowed: true };
};
