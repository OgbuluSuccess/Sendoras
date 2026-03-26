const express = require('express');
const router = express.Router();
const { validateEmail, validateBulk } = require('../controllers/validationController');
const { protect } = require('../middleware/authMiddleware');

// Single email validation
router.post('/single', protect, validateEmail);

// Bulk email validation (up to 500)
router.post('/bulk', protect, validateBulk);

module.exports = router;
