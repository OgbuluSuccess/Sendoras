const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const {
    addDomain,
    getDomains,
    checkVerification,
    deleteDomain,
    regenerateRecords
} = require('../controllers/domainController');

router.use(protect); // All domain routes require auth

router.route('/')
    .get(getDomains)
    .post(addDomain);

router.post('/:id/check', checkVerification);
router.post('/:id/regenerate', regenerateRecords);
router.delete('/:id', deleteDomain);

module.exports = router;

