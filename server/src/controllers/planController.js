const Plan = require('../models/Plan');

// @desc    Get all plans (admin view - includes inactive)
// @route   GET /api/admin/plans
// @access  Private/Admin
exports.getPlans = async (req, res) => {
    try {
        const plans = await Plan.find().sort({ sortOrder: 1 });
        res.json(plans);
    } catch (err) {
        res.status(500).json({ msg: err.message });
    }
};

// @desc    Create new plan
// @route   POST /api/admin/plans
// @access  Private/Admin
exports.createPlan = async (req, res) => {
    try {
        const { slug } = req.body;
        const exists = await Plan.findOne({ slug: slug.toLowerCase().trim() });
        if (exists) return res.status(400).json({ msg: `A plan with slug "${slug}" already exists.` });

        const plan = await Plan.create(req.body);
        res.status(201).json(plan);
    } catch (err) {
        res.status(500).json({ msg: err.message });
    }
};

// @desc    Update a plan
// @route   PUT /api/admin/plans/:id
// @access  Private/Admin
exports.updatePlan = async (req, res) => {
    try {
        const plan = await Plan.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
        if (!plan) return res.status(404).json({ msg: 'Plan not found.' });
        res.json(plan);
    } catch (err) {
        res.status(500).json({ msg: err.message });
    }
};

// @desc    Delete a plan
// @route   DELETE /api/admin/plans/:id
// @access  Private/Admin
exports.deletePlan = async (req, res) => {
    try {
        const plan = await Plan.findById(req.params.id);
        if (!plan) return res.status(404).json({ msg: 'Plan not found.' });
        if (['free', 'pro', 'enterprise'].includes(plan.slug)) {
            return res.status(400).json({ msg: 'Default plans cannot be deleted. You can deactivate them instead.' });
        }
        await plan.deleteOne();
        res.json({ msg: 'Plan deleted.' });
    } catch (err) {
        res.status(500).json({ msg: err.message });
    }
};

// @desc    Get active plans (public-ish — for the billing page)
// @route   GET /api/plans
// @access  Private (logged-in users)
exports.getActivePlans = async (req, res) => {
    try {
        const plans = await Plan.find({ isActive: true }).sort({ sortOrder: 1 })
            .select('slug name description priceMonthlyUSD priceYearlyUSD priceMonthlyNGN features isPopular color support apiAccess analyticsAccess monthlyEmails maxContactsPerList');
        res.json(plans);
    } catch (err) {
        res.status(500).json({ msg: err.message });
    }
};
