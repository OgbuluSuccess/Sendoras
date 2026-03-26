const Plan = require('../models/Plan');

// Simple in-memory cache so we don't hit DB on every request
let planCache = {};
let cacheTime = 0;
const CACHE_TTL = 60 * 1000; // 1 minute

async function getPlanFromDB(slug) {
    const now = Date.now();
    if (!planCache[slug] || now - cacheTime > CACHE_TTL) {
        const plans = await Plan.find({ isActive: true });
        planCache = {};
        plans.forEach(p => { planCache[p.slug] = p; });
        cacheTime = now;
    }
    return planCache[slug] || null;
}

/**
 * Middleware: requireApiAccess
 * Blocks API key creation for users whose plan doesn't have apiAccess=true.
 */
exports.requireApiAccess = async (req, res, next) => {
    try {
        const tier = req.user?.tier || 'free';
        const plan = await getPlanFromDB(tier);

        if (!plan || !plan.apiAccess) {
            return res.status(403).json({
                msg: 'API access is not available on your current plan. Please upgrade to Pro or higher.',
                code: 'UPGRADE_REQUIRED',
                requiredPlan: 'pro',
            });
        }
        next();
    } catch (err) {
        console.error('tierMiddleware error:', err);
        next(); // fail open — don't block on middleware errors
    }
};

/**
 * Middleware: checkEmailQuota
 * Blocks email sending if user has exceeded their plan's monthly email quota.
 * (Requires emailsSentThisMonth tracking on the User model)
 */
exports.checkEmailQuota = async (req, res, next) => {
    try {
        const tier = req.user?.tier || 'free';
        const plan = await getPlanFromDB(tier);
        const used = req.user?.emailsSentThisMonth || 0;

        if (plan && used >= plan.monthlyEmails) {
            return res.status(429).json({
                msg: `You've reached your monthly email limit of ${plan.monthlyEmails.toLocaleString()} emails. Please upgrade your plan.`,
                code: 'QUOTA_EXCEEDED',
                limit: plan.monthlyEmails,
                used,
            });
        }
        next();
    } catch (err) {
        console.error('checkEmailQuota error:', err);
        next();
    }
};

/**
 * Utility: getPlanLimits
 * Returns the plan object for a given tier slug. Useful in controllers.
 */
exports.getPlanLimits = getPlanFromDB;
