const EmailService = require('../services/email/EmailService');
const emailQueue = require('../services/queue/emailQueue');
const Domain = require('../models/Domain');

// @desc    Send an email
// @route   POST /api/send
// @access  Private (B2B only)
exports.sendEmail = async (req, res) => {
    let { to, subject, html, from, reply_to } = req.body;

    if (!to || !subject || !html) {
        return res.status(400).json({ message: 'Missing required fields: to, subject, html' });
    }

    try {
        let originalEmail = from || req.user.email;
        let senderName = 'API Sender';
        
        if (from && from.includes('<')) {
            const parts = from.split('<');
            senderName = parts[0].trim();
            originalEmail = parts[1].replace('>', '').trim();
        } else if (from) {
            originalEmail = from.trim();
        }

        const domainPart = originalEmail.split('@')[1];
        const verifiedDomain = await Domain.findOne({ user: req.user._id, domain: domainPart, status: 'verified' });

        if (!verifiedDomain) {
            from = `${senderName} <hello@sendoras.online>`;
            reply_to = reply_to || originalEmail;
        } else {
            from = `${senderName} <${originalEmail}>`;
        }

        let baseUrl = process.env.CLIENT_URL;
        if (!baseUrl || baseUrl.includes('localhost')) {
            baseUrl = 'https://app.sendoras.online'; 
        }

        // ── Append Unsubscribe Footer ────────────────────────────────────────
        let finalHtml = html;
        finalHtml += `
            <br><br>
            <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #eaeaea; font-family: sans-serif; font-size: 12px; color: #888; text-align: center;">
                You are receiving this email because you are subscribed to updates from ${senderName}.<br>
                If you no longer wish to receive these emails, you can <a href="${baseUrl}/unsubscribe?email={recipientEmail}" style="color: #666; text-decoration: underline;">unsubscribe here</a>.
            </div>
        `;

        // Add to queue
        await emailQueue.add('send-email', { to, subject, html: finalHtml, from, replyTo: reply_to });

        // Admin Tracking - create a Campaign document for this send
        const Campaign = require('../models/Campaign');
        await Campaign.create({
            user: req.user._id,
            name: `Queued API Send: ${subject}`,
            subject: subject,
            sender: from,
            content: html,
            status: 'Scheduled', // It's in the queue
            source: 'api',
            recipientCount: Array.isArray(to) ? to.length : 1,
            sentCount: 0,
            failedCount: 0,
            errorLogs: []
        });

        res.status(202).json({ message: 'Email queued for sending', status: 'queued' });
    } catch (error) {
        // Fallback to direct send
        console.warn("Queue error, attempting direct send:", error.message);
        try {
            const finalHtml = finalHtml || html; // Ensure finalHtml scope exists here
            const result = await EmailService.sendEmail({ to, subject, html: finalHtml, from, replyTo: reply_to });
            res.status(200).json({ message: 'Email sent successfully (fallback)', data: result });
        } catch (e) {
            console.error("Direct send failed:", e);
            res.status(500).json({ message: 'Failed to queue or send email', error: e.message });
        }
    }
};
