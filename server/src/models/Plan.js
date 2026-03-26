const mongoose = require('mongoose');

const planSchema = new mongoose.Schema({
    // Internal slug used in user.tier field — e.g. 'free', 'pro', 'business', 'enterprise'
    slug: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true,
    },
    name: { type: String, required: true },           // Display name, e.g. "Pro Plan"
    description: { type: String, default: '' },

    // Pricing
    priceMonthlyUSD: { type: Number, default: 0 },    // in dollars
    priceYearlyUSD: { type: Number, default: 0 },
    priceMonthlyNGN: { type: Number, default: 0 },    // in naira

    // Stripe / Paystack product IDs (used in checkout)
    stripePriceId: { type: String, default: '' },
    paystackPlanCode: { type: String, default: '' },

    // Limits
    monthlyEmails: { type: Number, default: 1000 },
    maxContactsPerList: { type: Number, default: 500 },
    maxSenderIdentities: { type: Number, default: 1 },
    apiAccess: { type: Boolean, default: false },
    analyticsAccess: { type: Boolean, default: false },
    support: { type: String, default: 'community' }, // community | priority | dedicated

    // UI
    isPopular: { type: Boolean, default: false },     // shows "Most Popular" badge
    isActive: { type: Boolean, default: true },       // hidden from billing page if false
    sortOrder: { type: Number, default: 0 },          // display order
    color: { type: String, default: '#f97316' },      // accent color on billing card
    features: [String],                               // bullet point features for the billing card

}, { timestamps: true });

module.exports = mongoose.model('Plan', planSchema);
