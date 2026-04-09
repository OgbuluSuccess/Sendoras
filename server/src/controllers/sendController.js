const { sendEmail } = require('../services/emailService');
const User = require('../models/User');
const Domain = require('../models/Domain');
const { scanContent } = require('../services/complianceService');
const { getPlanLimits } = require('../middleware/tierMiddleware');
const MessageLog = require('../models/MessageLog');

/**
 * POST /api/v1/messages
 * Send a transactional email via API key.
 *
 * Auth  → apiKeyAuth middleware
 * Gate  → requireApiAccess (plan must have apiAccess=true)
 * Quota → checkEmailQuota (plan.monthlyEmails from DB)
 *
 * Body (JSON):
 *   from     - Sender address e.g. "Acme <hello@yourdomain.com>"
 *   to       - Recipient(s): string or array
 *   subject  - Email subject
 *   html     - HTML body
 *   text     - Plain text body (optional)
 *   reply_to - Reply-To header (optional)
 */
exports.sendMessage = async (req, res) => {
    try {
        let { from, to, subject, html, text, reply_to } = req.body;

        // ── Validation ──────────────────────────────────────────────────────
        if (!to) return res.status(400).json({ success: false, error: '"to" is required' });
        if (!subject) return res.status(400).json({ success: false, error: '"subject" is required' });
        if (!html && !text) return res.status(400).json({ success: false, error: '"html" or "text" body is required' });

        // Normalise "to" to an array
        const toAddresses = Array.isArray(to) ? to : to.split(/[,;]/).map(e => e.trim()).filter(Boolean);
        if (toAddresses.length === 0) return res.status(400).json({ success: false, error: 'No valid recipients in "to"' });

        // ── Exact Quota Check ────────────────────────────────────────────────
        const user = await User.findById(req.user._id);
        const plan = await getPlanLimits(user.tier || 'free');
        const limit = plan ? plan.monthlyEmails : 1000;
        const used = user.emailsSentThisMonth || 0;

        if (used + toAddresses.length > limit) {
            const remaining = Math.max(0, limit - used);
            return res.status(429).json({
                success: false,
                error: `Email quota exceeded. You have ${remaining.toLocaleString()} emails remaining this month (limit: ${limit.toLocaleString()}).`,
                code: 'QUOTA_EXCEEDED'
            });
        }

        // ── Resolve FROM address ─────────────────────────────────────────────
        let originalEmail = from || req.user.email;
        let senderName = user.name || 'Sendora User';
        
        if (from && from.includes('<')) {
            const parts = from.split('<');
            const parsedName = parts[0].trim();
            senderName = parsedName || senderName;
            originalEmail = parts[1].replace('>', '').trim();
        } else if (from) {
            originalEmail = from.trim();
        }

        const domainPart = originalEmail.split('@')[1];
        const verifiedDomain = await Domain.findOne({ user: req.user._id, domain: domainPart, status: 'verified' });

        if (!verifiedDomain) {
            // Unverified domain - use fallback to prevent provider rejection
            from = `${senderName} <hello@sendoras.online>`;
            // Protect their existing reply_to if specified, else use their unverified sender email
            reply_to = reply_to || originalEmail;
        } else {
            from = `${senderName} <${originalEmail}>`;
        }

        let baseUrl = process.env.CLIENT_URL;
        if (!baseUrl || baseUrl.includes('localhost')) {
            baseUrl = 'https://app.sendoras.online'; 
        }

        // ── Content compliance scan ──────────────────────────────────────────
        const contentCheck = scanContent(subject, html || text);
        if (!contentCheck.allowed) {
            return res.status(400).json({ success: false, error: contentCheck.message });
        }

        // ── Send emails ──────────────────────────────────────────────────────
        let htmlBody = html || `<pre style="font-family:sans-serif">${text}</pre>`;
        
        // ── Append Unsubscribe Footer ────────────────────────────────────────
        htmlBody += `
            <br><br>
            <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #eaeaea; font-family: sans-serif; font-size: 12px; color: #888; text-align: center;">
                You are receiving this email because you are subscribed to updates from ${senderName}.<br>
                If you no longer wish to receive these emails, you can <a href="${baseUrl}/unsubscribe?email={recipientEmail}" style="color: #666; text-decoration: underline;">unsubscribe here</a>.
            </div>
        `;

        const messageIds = [];
        const errors = [];
        const messageLogs = [];

        await Promise.all(toAddresses.map(async (recipient) => {
            try {
                // Replace the placeholder with the actual recipient email for this specific iteration
                const personalizedHtml = htmlBody.replace('{recipientEmail}', encodeURIComponent(recipient));
                
                const result = await sendEmail({ to: recipient, subject, html: personalizedHtml, from, replyTo: reply_to });
                const id = result.MessageId || result.messageId;
                messageIds.push({ to: recipient, id });
                
                messageLogs.push({
                    user: req.user._id,
                    to: recipient,
                    subject,
                    status: 'delivered',
                    source: 'api',
                    messageId: id
                });
            } catch (err) {
                errors.push({ to: recipient, error: err.message });
                messageLogs.push({
                    user: req.user._id,
                    to: recipient,
                    subject,
                    status: 'failed',
                    source: 'api',
                    error: err.message
                });
            }
        }));

        // ── Update quota counter & Global Logging ───────────────────────────
        const successCount = messageIds.length;
        if (messageLogs.length > 0) {
            await MessageLog.insertMany(messageLogs);
        }

        if (successCount > 0) {
            await User.findByIdAndUpdate(req.user._id, {
                $inc: { emailsSentThisMonth: successCount }
            });
        }

        // ── Response ─────────────────────────────────────────────────────────
        if (errors.length > 0 && successCount === 0) {
            return res.status(500).json({
                success: false,
                error: errors[0].error,
                details: errors
            });
        }

        return res.status(200).json({
            success: true,
            message: `${successCount} of ${toAddresses.length} email(s) queued`,
            id: messageIds[0]?.id || null,
            ids: messageIds,
            ...(errors.length > 0 ? { partial_errors: errors } : {})
        });

    } catch (err) {
        console.error('API send error:', err.message);
        res.status(500).json({ success: false, error: 'Internal server error' });
    }
};
