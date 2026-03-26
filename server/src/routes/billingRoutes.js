const express = require('express');
const router = express.Router();
const { createStripeSession, initializePaystack, verifyPaystack } = require('../controllers/billingController');
const { protect } = require('../middleware/authMiddleware');

router.post('/stripe/create-session', protect, createStripeSession);
router.post('/paystack/initialize', protect, initializePaystack);
router.get('/paystack/verify/:reference', protect, verifyPaystack);

module.exports = router;
