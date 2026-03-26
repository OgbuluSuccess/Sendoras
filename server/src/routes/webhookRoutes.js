const express = require('express');
const router = express.Router();
const { handlePaystackWebhook, handleStripeWebhook } = require('../controllers/webhookController');

router.post('/paystack', handlePaystackWebhook);
router.post('/stripe', express.raw({ type: 'application/json' }), handleStripeWebhook);

module.exports = router;
