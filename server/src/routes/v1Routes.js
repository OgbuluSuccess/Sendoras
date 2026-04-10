const express = require('express');
const router = express.Router();
const { apiKeyAuth } = require('../middleware/apiKeyMiddleware');
const { requireApiAccess, checkEmailQuota } = require('../middleware/tierMiddleware');
const { sendMessage } = require('../controllers/sendController');

// POST /api/v1/messages — Send a transactional email via API key
// Chain: 1) validate API key  2) check plan has apiAccess  3) check quota  4) send
router.post('/messages', apiKeyAuth, requireApiAccess, checkEmailQuota, sendMessage);

const Contact = require('../models/Contact');

// POST /api/v1/unsubscribe — Global unsubscribe endpoint
router.post('/unsubscribe', async (req, res) => {
    try {
        const { email, u } = req.body;
        if (!email || !u) return res.status(400).json({ success: false, msg: 'Missing parameters' });
        
        await Contact.updateMany({ user: u, email: email }, { $set: { status: 'unsubscribed' } });
        res.json({ success: true, msg: 'Successfully unsubscribed' });
    } catch (err) {
        console.error('Unsubscribe error:', err);
        res.status(500).json({ success: false, msg: 'Server error' });
    }
});

// GET /api/v1  — API info / health check (no auth needed)
router.get('/', (req, res) => {
    res.json({
        api: 'Sendoras Email API',
        version: 'v1',
        docs: 'https://sendoras.online/docs',
        endpoints: {
            send: 'POST /api/v1/messages',
        }
    });
});

module.exports = router;

