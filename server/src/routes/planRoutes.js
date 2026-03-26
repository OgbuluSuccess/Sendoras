const express = require('express');
const router = express.Router();
const { getActivePlans } = require('../controllers/planController');
const { protect } = require('../middleware/authMiddleware');

// Active plans for billing page (logged-in users only)
router.get('/', protect, getActivePlans);

module.exports = router;
