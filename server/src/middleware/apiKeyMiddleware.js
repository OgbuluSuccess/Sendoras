const ApiKey = require('../models/ApiKey');
const User = require('../models/User');

/**
 * Middleware: authenticate requests using an API key.
 * Supports two formats (same as Mailgun):
 *   Authorization: Bearer sk_live_xxxxx
 *   Authorization: Basic base64("api:sk_live_xxxxx")
 *
 * Sets req.user and req.apiKey on the request object.
 */
const apiKeyAuth = async (req, res, next) => {
    try {
        const authHeader = req.headers['authorization'] || '';
        let rawKey = null;

        if (authHeader.startsWith('Bearer ')) {
            rawKey = authHeader.slice(7).trim();
        } else if (authHeader.startsWith('Basic ')) {
            // Basic auth: base64("api:sk_live_xxx")
            const decoded = Buffer.from(authHeader.slice(6), 'base64').toString('utf8');
            const parts = decoded.split(':');
            // parts[0] is "api" (ignored), parts[1] is the key
            if (parts.length >= 2) rawKey = parts.slice(1).join(':').trim();
        }

        if (!rawKey) {
            return res.status(401).json({
                success: false,
                error: 'Missing API key. Provide it as: Authorization: Bearer sk_live_xxx'
            });
        }

        const apiKey = await ApiKey.findOne({ key: rawKey, status: 'active' }).populate('user');

        if (!apiKey) {
            return res.status(401).json({
                success: false,
                error: 'Invalid or revoked API key.'
            });
        }

        // Stamp last used
        apiKey.lastUsed = new Date();
        await apiKey.save();

        req.user = apiKey.user;
        req.apiKey = apiKey;
        next();
    } catch (err) {
        console.error('API key auth error:', err.message);
        res.status(500).json({ success: false, error: 'Authentication error' });
    }
};

module.exports = { apiKeyAuth };
