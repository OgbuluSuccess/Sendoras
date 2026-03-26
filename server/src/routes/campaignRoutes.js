const express = require('express');
const router = express.Router();
const {
    getCampaigns, createCampaign, sendCampaign,
    getDashboardStats, getCampaign, updateCampaign,
    duplicateCampaign, deleteCampaign
} = require('../controllers/campaignController');
const { protect } = require('../middleware/authMiddleware');

router.get('/stats', protect, getDashboardStats);
router.get('/', protect, getCampaigns);
router.post('/', protect, createCampaign);
router.get('/:id', protect, getCampaign);
router.put('/:id', protect, updateCampaign);
router.post('/:id/send', protect, sendCampaign);
router.post('/:id/resend', protect, sendCampaign);  // resend = same as send, backend removes 'Sent' guard
router.post('/:id/duplicate', protect, duplicateCampaign);
router.delete('/:id', protect, deleteCampaign);

module.exports = router;
