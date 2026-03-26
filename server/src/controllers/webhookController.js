// server/src/controllers/webhookController.js
const Transaction = require('../models/Transaction');
const User = require('../models/User');
const crypto = require('crypto');
const axios = require('axios');

const stripe = process.env.STRIPE_SECRET_KEY
    ? require('stripe')(process.env.STRIPE_SECRET_KEY)
    : null;

// Map Stripe price IDs or metadata plan IDs to tiers
const planToTier = {
    pro: 'pro',
    enterprise: 'enterprise'
};

// @desc    Handle Stripe Webhook
// @route   POST /api/webhooks/stripe
// @access  Public (verified by signature)
exports.handleStripeWebhook = async (req, res) => {
    if (!stripe) return res.status(503).json({ msg: 'Stripe not configured' });

    const sig = req.headers['stripe-signature'];
    let event;

    try {
        event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
    } catch (err) {
        console.error(`Stripe Webhook Error: ${err.message}`);
        return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    if (event.type === 'checkout.session.completed') {
        const session = event.data.object;
        const userId = session.metadata?.userId;
        const planId = session.metadata?.planId;

        if (userId && planId) {
            const tier = planToTier[planId];
            if (tier) {
                await User.findByIdAndUpdate(userId, { tier });
                console.log(`✓ Upgraded user ${userId} to tier: ${tier}`);

                // Record transaction
                await Transaction.create({
                    user: userId,
                    provider: 'stripe',
                    reference: session.id,
                    amount: session.amount_total,
                    currency: session.currency?.toUpperCase() || 'USD',
                    status: 'success',
                    plan: planId
                });
            }
        }
    }

    res.json({ received: true });
};

// @desc    Handle Paystack Webhook
// @route   POST /api/webhooks/paystack
// @access  Public
exports.handlePaystackWebhook = async (req, res) => {
    // Verify event origin
    const hash = crypto.createHmac('sha512', process.env.PAYSTACK_SECRET_KEY || '')
        .update(JSON.stringify(req.body))
        .digest('hex');

    if (hash !== req.headers['x-paystack-signature']) {
        return res.status(401).json({ msg: 'Invalid signature' });
    }

    const event = req.body;

    if (event.event === 'charge.success') {
        const reference = event.data.reference;
        const transaction = await Transaction.findOne({ reference });

        if (transaction && transaction.status !== 'success') {
            transaction.status = 'success';
            await transaction.save();

            const tier = planToTier[transaction.plan];
            if (tier) {
                await User.findByIdAndUpdate(transaction.user, { tier });
                console.log(`✓ Upgraded user ${transaction.user} to tier: ${tier} via Paystack`);
            }
        }
    }

    res.sendStatus(200);
};
