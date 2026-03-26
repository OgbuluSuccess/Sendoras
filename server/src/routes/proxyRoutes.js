const express = require('express');
const router = express.Router();
const { proxyDriveFile } = require('../controllers/proxyController');

// Public route — no auth needed (Drive file is already gated by Google's sharing)
router.get('/drive', proxyDriveFile);

module.exports = router;
