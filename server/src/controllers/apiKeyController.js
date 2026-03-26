const ApiKey = require('../models/ApiKey');
const crypto = require('crypto');

// @desc    Get all API keys for user
// @route   GET /api/keys
// @access  Private
exports.getApiKeys = async (req, res) => {
    try {
        const keys = await ApiKey.find({ user: req.user.id }).sort({ createdAt: -1 });
        res.json(keys);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};

// @desc    Generate new API key
// @route   POST /api/keys
// @access  Private
exports.createApiKey = async (req, res) => {
    const { name } = req.body;

    try {
        // Generate a random key (sk_live_...)
        const randomString = crypto.randomBytes(24).toString('hex');
        const keyString = `sk_live_${randomString}`;

        const newKey = await ApiKey.create({
            user: req.user.id,
            name: name || 'New API Key',
            key: keyString
        });

        res.status(201).json(newKey);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};

// @desc    Revoke/Delete API key
// @route   DELETE /api/keys/:id
// @access  Private
exports.deleteApiKey = async (req, res) => {
    try {
        const key = await ApiKey.findById(req.params.id);

        if (!key) {
            return res.status(404).json({ msg: 'API Key not found' });
        }

        // Check user owns key
        if (key.user.toString() !== req.user.id) {
            return res.status(401).json({ msg: 'Not authorized' });
        }

        await key.deleteOne();

        res.json({ msg: 'API Key removed' });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};
