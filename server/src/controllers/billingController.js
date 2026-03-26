const Transaction = require('../models/Transaction');
const User = require('../models/User');
const axios = require('axios');

// Initialize Stripe gracefully so the server doesn't crash without keys
const stripe = process.env.STRIPE_SECRET_KEY
    ? require('stripe')(process.env.STRIPE_SECRET_KEY)
    : null;

// Plans Configuration (Move to DB or Config file in real app)
const PLANS = {
    pro: {
        id: 'pro',
        name: 'Pro Plan',
        price_usd: 2900, // $29.00 in cents
        price_ngn: 4500000, // ₦45,000.00 in kobo
    },
    enterprise: {
        id: 'enterprise',
        name: 'Enterprise Plan',
        price_usd: 9900,
        price_ngn: 15000000,
    }
};

// @desc    Initialize Stripe Checkout
// @route   POST /api/billing/stripe/create-session
// @access  Private
exports.createStripeSession = async (req, res) => {
    const { planId } = req.body;
    const plan = PLANS[planId];

    if (!plan) return res.status(400).json({ msg: 'Invalid plan' });
    if (!stripe) return res.status(503).json({ msg: 'Stripe is not configured on the server yet.' });

    try {
        const session = await stripe.checkout.sessions.create({
            payment_method_types: ['card'],
            line_items: [{
                price_data: {
                    currency: 'usd',
                    product_data: { name: `Sendoras ${plan.name}` },
                    unit_amount: plan.price_usd,
                },
                quantity: 1,
            }],
            mode: 'payment', // or 'subscription'
            success_url: `${process.env.CLIENT_URL}/dashboard/billing?success=true&session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: `${process.env.CLIENT_URL}/dashboard/billing?canceled=true`,
            metadata: {
                userId: req.user.id,
                planId: planId
            }
        });

        res.json({ id: session.id, url: session.url });
    } catch (err) {
        console.error(err);
        res.status(500).send('Stripe Error');
    }
};

// @desc    Initialize Paystack Transaction
// @route   POST /api/billing/paystack/initialize
// @access  Private
exports.initializePaystack = async (req, res) => {
    const { planId } = req.body;
    const plan = PLANS[planId];

    if (!plan) return res.status(400).json({ msg: 'Invalid plan' });
    if (!process.env.PAYSTACK_SECRET_KEY) return res.status(503).json({ msg: 'Paystack is not configured on the server yet.' });

    try {
        const response = await axios.post(
            'https://api.paystack.co/transaction/initialize',
            {
                email: req.user.email,
                amount: plan.price_ngn,
                callback_url: `${process.env.CLIENT_URL}/dashboard/billing`,
                metadata: {
                    userId: req.user.id,
                    planId: planId,
                    custom_fields: [{ display_name: "Plan", variable_name: "plan", value: planId }]
                }
            },
            {
                headers: {
                    Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
                    'Content-Type': 'application/json'
                }
            }
        );

        // Save pending transaction
        await Transaction.create({
            user: req.user.id,
            provider: 'paystack',
            reference: response.data.data.reference,
            amount: plan.price_ngn,
            currency: 'NGN',
            status: 'pending',
            plan: planId
        });

        res.json({ authorization_url: response.data.data.authorization_url, reference: response.data.data.reference });
    } catch (err) {
        console.error(err.response?.data || err.message);
        res.status(500).send('Paystack Error');
    }
};

// @desc    Verify Paystack Transaction (called by frontend or webhook)
// @route   GET /api/billing/paystack/verify/:reference
// @access  Private
exports.verifyPaystack = async (req, res) => {
    const { reference } = req.params;

    try {
        const response = await axios.get(
            `https://api.paystack.co/transaction/verify/${reference}`,
            {
                headers: { Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}` }
            }
        );

        const data = response.data.data;

        if (data.status === 'success') {
            const transaction = await Transaction.findOne({ reference });
            if (transaction && transaction.status !== 'success') {
                transaction.status = 'success';
                await transaction.save();

                // Upgrade User
                await User.findByIdAndUpdate(transaction.user, { tier: transaction.plan });
            }
            res.json({ status: 'success', message: 'Payment verified' });
        } else {
            res.status(400).json({ status: 'failed', message: 'Payment verification failed' });
        }
    } catch (err) {
        console.error(err);
        res.status(500).send('Verification Error');
    }
};
