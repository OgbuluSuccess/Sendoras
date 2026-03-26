const mongoose = require('mongoose');
const User = require('../models/User');
const Campaign = require('../models/Campaign');
const Transaction = require('../models/Transaction');

// @desc    Get System Stats
// @route   GET /api/admin/stats
// @access  Private/Admin
exports.getSystemStats = async (req, res) => {
    try {
        const userCount = await User.countDocuments();
        const campaignCount = await Campaign.countDocuments();
        const transactionCount = await Transaction.countDocuments();

        // Calculate total revenue (naive approach)
        const transactions = await Transaction.find({ status: 'success' });
        const revenue = transactions.reduce((acc, curr) => acc + (curr.currency === 'USD' ? curr.amount / 100 : 0), 0);

        const { getActiveProviders } = require('../services/emailService');
        const activeProviders = getActiveProviders();

        const integrations = {
            activeProviders,                       // ← what AdminDashboard reads
            emailProviders: activeProviders,        // legacy alias
            awsSes: !!(process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY && process.env.AWS_REGION),
            resend: !!(process.env.RESEND_API_KEY && !process.env.RESEND_API_KEY.includes('your_resend')),
            stripe: !!process.env.STRIPE_SECRET_KEY,
            paystack: !!process.env.PAYSTACK_SECRET_KEY,
            mongodb: mongoose.connection.readyState === 1,
            redis: !!process.env.REDIS_URL,    // present = configured; true connection tested at startup
        };

        res.json({
            users: userCount,
            campaigns: campaignCount,
            transactions: transactionCount,
            revenue: revenue,
            integrations: integrations,
            serverTime: new Date()
        });

    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};

// @desc    Get All Users
// @route   GET /api/admin/users
// @access  Private/Admin
exports.getAllUsers = async (req, res) => {
    try {
        const users = await User.find().select('-password').sort({ createdAt: -1 });
        res.json(users);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};

// @desc    Update User Status/Role
// @route   PUT /api/admin/users/:id
// @access  Private/Admin
exports.updateUser = async (req, res) => {
    try {
        const { role, tier } = req.body;
        const user = await User.findByIdAndUpdate(
            req.params.id,
            { role, tier },
            { new: true }
        ).select('-password');

        res.json(user);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};

// @desc    Get All Transactions
// @route   GET /api/admin/transactions
// @access  Private/Admin
exports.getAllTransactions = async (req, res) => {
    try {
        const transactions = await Transaction.find()
            .populate('user', 'name email')
            .sort({ createdAt: -1 });
        res.json(transactions);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};
// @desc    Delete a user
// @route   DELETE /api/admin/users/:id
// @access  Private/Admin
exports.deleteUser = async (req, res) => {
    try {
        const user = await User.findById(req.params.id);
        if (!user) return res.status(404).json({ msg: 'User not found' });
        await user.deleteOne();
        res.json({ msg: 'User deleted successfully' });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};

// @desc    Get all campaigns (admin view)
// @route   GET /api/admin/campaigns
// @access  Private/Admin
exports.getAllCampaigns = async (req, res) => {
    try {
        const campaigns = await Campaign.find()
            .populate('user', 'name email')
            .sort({ createdAt: -1 });
        res.json(campaigns);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};

// @desc    Get single campaign detail (admin view) with per-email monitoring
// @route   GET /api/admin/campaigns/:id
// @access  Private/Admin
exports.getCampaignDetail = async (req, res) => {
    try {
        const campaign = await Campaign.findById(req.params.id)
            .populate('user', 'name email');

        if (!campaign) return res.status(404).json({ msg: 'Campaign not found' });

        const Contact = require('../models/Contact');
        const deliveryLogs = campaign.deliveryLogs || [];

        // Build a map of logs for quick lookup
        const logMap = {};
        deliveryLogs.forEach(e => { logMap[e.email] = e; });

        let recipientStatuses = [];

        if (campaign.recipients && campaign.recipients.length > 0) {
            // CSV-upload campaigns: recipients are embedded in the document
            recipientStatuses = campaign.recipients.map(r => {
                const email = typeof r === 'string' ? r : r.email;
                const logEntry = logMap[email];
                return {
                    email,
                    firstName: r.firstName || '',
                    lastName: r.lastName || '',
                    status: logEntry ? logEntry.status : 'scheduled',
                    error: logEntry && logEntry.status === 'failed' ? logEntry.message : null,
                    messageId: logEntry?.messageId || null,
                    provider: logEntry?.provider || null,
                    timestamp: logEntry ? logEntry.timestamp : null,
                };
            });
        } else if (campaign.listId) {
            // List-based campaign — fetch the real contact list from the DB
            const listContacts = await Contact.find({ list: campaign.listId._id || campaign.listId })
                .select('email firstName lastName')
                .lean();

            // Build a status map from delivery logs
            recipientStatuses = listContacts.map(contact => {
                const logEntry = logMap[contact.email];
                return {
                    email: contact.email,
                    firstName: contact.firstName || '',
                    lastName: contact.lastName || '',
                    status: logEntry ? logEntry.status : 'queued',
                    error: logEntry && logEntry.status === 'failed' ? logEntry.message : null,
                    messageId: logEntry?.messageId || null,
                    provider: logEntry?.provider || null,
                    timestamp: logEntry ? logEntry.timestamp : null,
                };
            });
        } else {
            // API-only campaigns (no list, no embedded recipients) — use deliveryLogs directly
            recipientStatuses = deliveryLogs.map(log => ({
                email: log.email,
                firstName: '',
                lastName: '',
                status: log.status,
                error: log.status === 'failed' ? log.message : null,
                messageId: log.messageId || null,
                provider: log.provider || null,
                timestamp: log.timestamp,
            }));
        }

        // Surface the most common/first failure reason as a top-level field
        const failedLogs = deliveryLogs.filter(log => log.status === 'failed');
        const failureReason = failedLogs.length > 0 ? failedLogs[0].message : null;

        res.json({
            _id: campaign._id,
            name: campaign.name,
            subject: campaign.subject,
            sender: campaign.sender,
            status: campaign.status,
            user: campaign.user,
            createdAt: campaign.createdAt,
            recipientCount: campaign.recipientCount,
            sentCount: campaign.sentCount,
            failedCount: campaign.failedCount,
            source: campaign.source,
            failureReason,          // ← NEW: top-level error message for banner
            deliveryLogs: campaign.deliveryLogs,
            recipients: recipientStatuses,
        });
    } catch (err) {
        console.error(err.message);
        if (err.kind === 'ObjectId') return res.status(404).json({ msg: 'Campaign not found' });
        res.status(500).send('Server Error');
    }
};

