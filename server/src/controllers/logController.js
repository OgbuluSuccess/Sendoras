const MessageLog = require('../models/MessageLog');

// @desc    Get user's sending logs
// @route   GET /api/logs
// @access  Private
exports.getLogs = async (req, res) => {
    try {
        const page = parseInt(req.query.page, 10) || 1;
        const limit = parseInt(req.query.limit, 10) || 50;
        const startIndex = (page - 1) * limit;

        const total = await MessageLog.countDocuments({ user: req.user.id });
        const logs = await MessageLog.find({ user: req.user.id })
            .sort({ createdAt: -1 })
            .skip(startIndex)
            .limit(limit);

        res.json({
            success: true,
            count: logs.length,
            total,
            pagination: {
                page,
                limit,
                totalPages: Math.ceil(total / limit)
            },
            data: logs,
        });
    } catch (err) {
        console.error('getLogs error:', err.message);
        res.status(500).send('Server Error');
    }
};
