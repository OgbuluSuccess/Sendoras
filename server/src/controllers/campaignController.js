const Campaign = require('../models/Campaign');

// @desc    Get dashboard stats
// @route   GET /api/campaigns/stats
// @access  Private
exports.getDashboardStats = async (req, res) => {
    try {
        const campaigns = await Campaign.find({ user: req.user.id });

        const totalSent = campaigns.reduce((acc, curr) => acc + (curr.sentCount || 0), 0);
        // Placeholder logic for rates until we have tracking
        const openRate = 0;
        const clickRate = 0;
        const bounceRate = 0;

        // Recent activity: last 5 campaigns
        const recentCampaigns = campaigns
            .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
            .slice(0, 5);

        res.json({
            totalSent,
            openRate,
            clickRate,
            bounceRate,
            recentCampaigns
        });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};

// @desc    Get user campaigns (with queue progress)
// @route   GET /api/campaigns
// @access  Private
exports.getCampaigns = async (req, res) => {
    try {
        const campaigns = await Campaign.find({ user: req.user.id })
            .populate('listId', 'name contactCount')
            .sort({ createdAt: -1 });

        // If any campaigns are currently sending, fetch live queue metrics
        const { emailQueue } = require('../config/queue');

        const enhancedCampaigns = await Promise.all(campaigns.map(async (camp) => {
            const doc = camp.toObject();
            if (doc.status && doc.status.toLowerCase() === 'sent') {
                const failed = doc.failedCount || 0;
                const sent = doc.sentCount || 0;
                const total = doc.recipientCount || 0;
                const processed = sent + failed;

                const isFinished = total > 0 && processed >= total;
                doc.status = isFinished ? 'sent' : 'sending';

                doc.progress = {
                    total,
                    sent,
                    failed,
                    errorLogs: doc.deliveryLogs ? doc.deliveryLogs.filter(l => l.status === 'failed') : [],
                    percentage: total ? Math.round((processed / total) * 100) : (isFinished ? 100 : 0)
                };
            }
            return doc;
        }));

        res.json(enhancedCampaigns);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};

// @desc    Create new campaign
// @route   POST /api/campaigns
// @access  Private
exports.createCampaign = async (req, res) => {
    const { name, subject, sender, content, recipients, listId } = req.body;

    try {
        const newCampaign = await Campaign.create({
            user: req.user.id,
            listId: listId || undefined,
            name,
            subject,
            sender,
            content,
            recipients: recipients || []
        });

        const populated = await newCampaign.populate('listId', 'name contactCount');
        res.status(201).json(populated);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};

// @desc    Send campaign (Queue integration with Compliance)
// @route   POST /api/campaigns/:id/send
// @access  Private
exports.sendCampaign = async (req, res) => {
    const { emailQueue } = require('../config/queue');
    const { scanContent } = require('../services/complianceService');
    const { getPlanLimits } = require('../middleware/tierMiddleware');
    const User = require('../models/User');
    const Contact = require('../models/Contact');
    const Domain = require('../models/Domain');

    try {
        const campaign = await Campaign.findById(req.params.id);

        if (!campaign) return res.status(404).json({ msg: 'Campaign not found' });
        if (campaign.user.toString() !== req.user.id) return res.status(401).json({ msg: 'Not authorized' });
        // Allow resend if the campaign previously failed (has errorLogs or failedCount > 0)
        const isResend = req.path.includes('resend') || (campaign.failedCount > 0);
        if (campaign.status === 'Sent' && !isResend) return res.status(400).json({ msg: 'Campaign already sent' });

        // Reset failure stats before resend
        if (isResend) {
            campaign.sentCount = 0;
            campaign.failedCount = 0;
            campaign.errorLogs = [];
        }

        // 1. Content scan
        const contentCheck = scanContent(campaign.subject, campaign.content);
        if (!contentCheck.allowed) {
            campaign.status = 'Failed';
            await campaign.save();
            return res.status(400).json({ msg: contentCheck.message });
        }

        let recipients = [];
        if (campaign.listId) {
            const contacts = await Contact.find({ list: campaign.listId, status: 'active' });
            recipients = contacts.map(c => ({ email: c.email, firstName: c.firstName, lastName: c.lastName }));
        } else if (campaign.recipients && campaign.recipients.length > 0) {
            recipients = campaign.recipients;
        } else {
            recipients = ['test@example.com'];
        }

        if (recipients.length === 0) {
            return res.status(400).json({ msg: 'No recipients found for this campaign' });
        }

        // 2. Monthly quota enforcement (DB-driven)
        const user = await User.findById(req.user.id);

        // Auto-reset counter if a new month has started
        if (user.emailsResetDate && new Date() >= user.emailsResetDate) {
            user.emailsSentThisMonth = 0;
            const nextReset = new Date();
            nextReset.setMonth(nextReset.getMonth() + 1, 1);
            nextReset.setHours(0, 0, 0, 0);
            user.emailsResetDate = nextReset;
            await user.save();
        }

        const plan = await getPlanLimits(user.tier || 'free');
        const limit = plan ? plan.monthlyEmails : 1000;
        const used = user.emailsSentThisMonth || 0;

        if (used + recipients.length > limit) {
            const remaining = Math.max(0, limit - used);
            return res.status(429).json({
                msg: `Email quota exceeded. You have ${remaining.toLocaleString()} emails remaining this month (limit: ${limit.toLocaleString()}). Upgrade your plan for more.`,
                code: 'QUOTA_EXCEEDED',
                limit,
                used,
                remaining,
            });
        }

        // 3. Resolve FROM address — use verified custom domain if available, otherwise shared default
        const verifiedDomain = await Domain.findOne({ user: req.user.id, status: 'verified' });
        
        let senderName = campaign.senderName || 'Sendoras';
        let originalEmail = campaign.sender;
        
        if (campaign.sender && campaign.sender.includes('<')) {
            const parts = campaign.sender.split('<');
            senderName = parts[0].trim();
            originalEmail = parts[1].replace('>', '').trim();
        }

        let fromEmail = verifiedDomain ? `hello@${verifiedDomain.domain}` : `hello@sendoras.online`;
        if (verifiedDomain && originalEmail.endsWith(`@${verifiedDomain.domain}`)) {
            fromEmail = originalEmail;
        }

        const fromAddress = `${senderName} <${fromEmail}>`;

        let baseUrl = process.env.CLIENT_URL;
        if (!baseUrl || baseUrl.includes('localhost')) {
            baseUrl = 'https://app.sendoras.online'; // Provide a production fallback to avoid spam filters
        }

        // 4. Queue emails
        const jobs = recipients.map(recipient => {
            const email = typeof recipient === 'string' ? recipient : recipient.email;
            
            // Append compliance footer
            const personalizedHtml = campaign.content + `
                <br><br>
                <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #eaeaea; font-family: sans-serif; font-size: 12px; color: #888; text-align: center;">
                    You are receiving this email because you are subscribed to updates from ${senderName}.<br>
                    If you no longer wish to receive these emails, you can <a href="${baseUrl}/unsubscribe?email=${encodeURIComponent(email)}" style="color: #666; text-decoration: underline;">unsubscribe here</a>.
                </div>
            `;

            return {
                name: 'send-email',
                data: {
                    campaignId: campaign._id,
                    to: email,
                    subject: campaign.subject,
                    html: personalizedHtml,
                    from: fromAddress,
                    replyTo: originalEmail,
                    personalization: {
                        firstName: recipient.firstName || '',
                        lastName: recipient.lastName || ''
                    }
                }
            };
        });

        await emailQueue.addBulk(jobs);

        // 4. Update campaign status
        campaign.status = 'Sent';
        campaign.recipientCount = recipients.length;
        campaign.sentCount = 0; // incremented by worker
        await campaign.save();

        // 5. Increment user's monthly email counter
        await User.findByIdAndUpdate(req.user.id, {
            $inc: { emailsSentThisMonth: recipients.length }
        });

        res.json({
            msg: 'Campaign queued for sending',
            campaign,
            quotaUsed: used + recipients.length,
            quotaLimit: limit,
        });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};


// @desc    Get a single campaign by ID
// @route   GET /api/campaigns/:id
// @access  Private
exports.getCampaign = async (req, res) => {
    try {
        const campaign = await Campaign.findById(req.params.id).populate('listId', 'name contactCount');
        if (!campaign) return res.status(404).json({ msg: 'Campaign not found' });
        if (campaign.user.toString() !== req.user.id) return res.status(401).json({ msg: 'Not authorized' });
        
        const Contact = require('../models/Contact');
        const deliveryLogs = campaign.deliveryLogs || [];

        // Build a map of logs for quick lookup
        const logMap = {};
        deliveryLogs.forEach(e => { logMap[e.email] = e; });

        let recipientStatuses = [];

        if (campaign.recipients && campaign.recipients.length > 0) {
            // CSV-upload campaigns
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
            listId: campaign.listId,
            createdAt: campaign.createdAt,
            recipientCount: campaign.recipientCount,
            sentCount: campaign.sentCount,
            failedCount: campaign.failedCount,
            source: campaign.source,
            failureReason,
            deliveryLogs: campaign.deliveryLogs,
            recipients: recipientStatuses,
        });
    } catch (err) {
        console.error(err.message);
        if (err.kind === 'ObjectId') return res.status(404).json({ msg: 'Campaign not found' });
        res.status(500).send('Server Error');
    }
};

// @desc    Update campaign (edit)
// @route   PUT /api/campaigns/:id
// @access  Private
exports.updateCampaign = async (req, res) => {
    try {
        const campaign = await Campaign.findById(req.params.id);
        if (!campaign) return res.status(404).json({ msg: 'Campaign not found' });
        if (campaign.user.toString() !== req.user.id) return res.status(401).json({ msg: 'Not authorized' });

        const { name, subject, sender, content, recipients, listId } = req.body;
        if (name) campaign.name = name;
        if (subject) campaign.subject = subject;
        if (sender) campaign.sender = sender;
        if (content) campaign.content = content;
        if (recipients) campaign.recipients = recipients;
        if (listId !== undefined) campaign.listId = listId || undefined;

        await campaign.save();
        res.json(campaign);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};

// @desc    Duplicate a campaign
// @route   POST /api/campaigns/:id/duplicate
// @access  Private
exports.duplicateCampaign = async (req, res) => {
    try {
        const original = await Campaign.findById(req.params.id);
        if (!original) return res.status(404).json({ msg: 'Campaign not found' });
        if (original.user.toString() !== req.user.id) return res.status(401).json({ msg: 'Not authorized' });

        const copy = await Campaign.create({
            user: req.user.id,
            name: `${original.name} (Copy)`,
            subject: original.subject,
            sender: original.sender,
            content: original.content,
            recipients: original.recipients,
            listId: original.listId,
            status: 'Draft',
        });

        const populatedCopy = await copy.populate('listId', 'name contactCount');
        res.status(201).json(populatedCopy);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};

// @desc    Delete campaign
// @route   DELETE /api/campaigns/:id
// @access  Private
exports.deleteCampaign = async (req, res) => {
    try {
        const campaign = await Campaign.findById(req.params.id);
        if (!campaign) return res.status(404).json({ msg: 'Campaign not found' });
        if (campaign.user.toString() !== req.user.id) return res.status(401).json({ msg: 'Not authorized' });
        await campaign.deleteOne();
        res.json({ msg: 'Campaign deleted' });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};
