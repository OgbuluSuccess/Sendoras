const Plan = require("../models/Plan");
const MessageLog = require("../models/MessageLog");

// Helper: log a blocked attempt to MessageLog
async function logBlocked(req, errorMsg) {
  try {
    const userId = req.user?._id || req.user?.id;
    if (!userId) {
      console.warn("[logBlocked] no userId on req.user:", req.user);
      return;
    }

    const rawTo = req.body?.to || req.body?.recipient || req.body?.email;
    const subject = req.body?.subject || "(no subject)";

    console.log(
      "[logBlocked] body keys:",
      Object.keys(req.body || {}),
      "| rawTo:",
      rawTo,
    );

    const toList = rawTo
      ? Array.isArray(rawTo)
        ? rawTo
        : String(rawTo)
            .split(/[,;]/)
            .map((e) => e.trim())
            .filter(Boolean)
      : ["unknown"];

    await Promise.all(
      toList.map((addr) =>
        MessageLog.create({
          user: userId,
          to: addr,
          subject,
          status: "failed",
          source: "api",
          error: errorMsg,
        }),
      ),
    );
    console.log("[logBlocked] logged", toList.length, "failed entries");
  } catch (e) {
    console.error("logBlocked error:", e.message);
  }
}

// Simple in-memory cache so we don't hit DB on every request
let planCache = {};
let cacheTime = 0;
const CACHE_TTL = 60 * 1000; // 1 minute

async function getPlanFromDB(slug) {
  const now = Date.now();
  if (!planCache[slug] || now - cacheTime > CACHE_TTL) {
    const plans = await Plan.find({ isActive: true });
    planCache = {};
    plans.forEach((p) => {
      planCache[p.slug] = p;
    });
    cacheTime = now;
  }
  return planCache[slug] || null;
}

// Returns all plans that have a given feature enabled, sorted by price
async function getUpgradePlans(feature) {
  const all = await Plan.find({ isActive: true, [feature]: true })
    .sort({ priceMonthlyUSD: 1 })
    .select("name slug priceMonthlyUSD")
    .lean();
  return all;
}

/**
 * Middleware: requireApiAccess
 * Blocks API access for users whose plan doesn't have apiAccess=true.
 */
exports.requireApiAccess = async (req, res, next) => {
  try {
    const tier = req.user?.tier || "free";
    const plan = await getPlanFromDB(tier);

    if (!plan || !plan.apiAccess) {
      const currentPlanName = plan?.name || `"${tier}" plan`;
      const upgradePlans = await getUpgradePlans("apiAccess");
      const upgradeList = upgradePlans.length
        ? upgradePlans
            .map((p) =>
              p.priceMonthlyUSD > 0
                ? `${p.name} ($${p.priceMonthlyUSD}/mo)`
                : p.name,
            )
            .join(", ")
        : "a higher tier plan";

      const errMsg = `API access is not included in your current plan (${currentPlanName}). To send emails via the API, please upgrade to one of the following plans: ${upgradeList}.`;
      await logBlocked(req, errMsg);
      return res.status(403).json({
        msg: errMsg,
        code: "UPGRADE_REQUIRED",
        currentPlan: tier,
        currentPlanName,
        feature: "apiAccess",
        upgradePlans,
      });
    }
    next();
  } catch (err) {
    console.error("tierMiddleware error:", err);
    next(); // fail open — don't block on middleware errors
  }
};

/**
 * Middleware: checkEmailQuota
 * Blocks email sending if user has exceeded their plan's monthly email quota.
 */
exports.checkEmailQuota = async (req, res, next) => {
  try {
    const tier = req.user?.tier || "free";
    const plan = await getPlanFromDB(tier);
    const used = req.user?.emailsSentThisMonth || 0;
    const limit = plan?.monthlyEmails ?? 0;

    if (plan && used >= limit) {
      const remaining = 0;
      const upgradePlans = await Plan.find({
        isActive: true,
        monthlyEmails: { $gt: limit },
      })
        .sort({ monthlyEmails: 1 })
        .select("name slug monthlyEmails priceMonthlyUSD")
        .lean();

      const upgradeList = upgradePlans.length
        ? upgradePlans
            .map((p) =>
              p.priceMonthlyUSD > 0
                ? `${p.name} (${p.monthlyEmails.toLocaleString()} emails/mo — $${p.priceMonthlyUSD}/mo)`
                : `${p.name} (${p.monthlyEmails.toLocaleString()} emails/mo)`,
            )
            .join("; ")
        : "a higher tier plan";

      const errMsg = `You have used all ${limit.toLocaleString()} emails included in your ${plan.name} plan this month (${used.toLocaleString()} sent, ${remaining} remaining). To continue sending, upgrade to one of these plans: ${upgradeList}.`;
      await logBlocked(req, errMsg);
      return res.status(429).json({
        msg: errMsg,
        code: "QUOTA_EXCEEDED",
        currentPlan: tier,
        currentPlanName: plan.name,
        limit,
        used,
        remaining,
        upgradePlans,
      });
    }
    next();
  } catch (err) {
    console.error("checkEmailQuota error:", err);
    next();
  }
};

/**
 * Middleware: requireAnalyticsAccess
 * Blocks advanced analytics endpoints for users whose plan doesn't have analyticsAccess=true.
 */
exports.requireAnalyticsAccess = async (req, res, next) => {
  try {
    const tier = req.user?.tier || "free";
    const plan = await getPlanFromDB(tier);

    if (!plan || !plan.analyticsAccess) {
      const currentPlanName = plan?.name || `"${tier}" plan`;
      const upgradePlans = await getUpgradePlans("analyticsAccess");
      const upgradeList = upgradePlans.length
        ? upgradePlans
            .map((p) =>
              p.priceMonthlyUSD > 0
                ? `${p.name} ($${p.priceMonthlyUSD}/mo)`
                : p.name,
            )
            .join(", ")
        : "a higher tier plan";

      return res.status(403).json({
        msg: `Advanced analytics is not included in your current plan (${currentPlanName}). To access this feature, upgrade to one of the following plans: ${upgradeList}.`,
        code: "UPGRADE_REQUIRED",
        currentPlan: tier,
        currentPlanName,
        feature: "analyticsAccess",
        upgradePlans,
      });
    }
    next();
  } catch (err) {
    console.error("tierMiddleware error:", err);
    next();
  }
};

/**
 * Middleware: checkContactsLimit
 * Blocks contact imports that would push a list over the plan's maxContactsPerList.
 * Expects req.params.id to be the list ID and req.body.contacts to be the array being imported.
 */
exports.checkContactsLimit = async (req, res, next) => {
  try {
    const tier = req.user?.tier || "free";
    const plan = await getPlanFromDB(tier);
    if (!plan) return next();

    const Contact = require("../models/Contact");
    const existing = await Contact.countDocuments({ list: req.params.id });
    const incoming = Array.isArray(req.body.contacts)
      ? req.body.contacts.length
      : 0;

    if (existing + incoming > plan.maxContactsPerList) {
      return res.status(403).json({
        msg: `This import would exceed your plan limit of ${plan.maxContactsPerList.toLocaleString()} contacts per list. Currently at ${existing.toLocaleString()}.`,
        code: "CONTACTS_LIMIT_EXCEEDED",
        limit: plan.maxContactsPerList,
        current: existing,
      });
    }
    next();
  } catch (err) {
    console.error("checkContactsLimit error:", err);
    next();
  }
};

/**
 * Middleware: checkSenderIdentityLimit
 * Blocks new domain additions when the user has reached their plan's maxSenderIdentities.
 */
exports.checkSenderIdentityLimit = async (req, res, next) => {
  try {
    const tier = req.user?.tier || "free";
    const plan = await getPlanFromDB(tier);
    if (!plan) return next();

    const Domain = require("../models/Domain");
    const count = await Domain.countDocuments({ user: req.user.id });

    if (count >= plan.maxSenderIdentities) {
      return res.status(403).json({
        msg: `You've reached your plan limit of ${plan.maxSenderIdentities} sender ${plan.maxSenderIdentities === 1 ? "identity" : "identities"}. Please upgrade to add more.`,
        code: "SENDER_IDENTITY_LIMIT_EXCEEDED",
        limit: plan.maxSenderIdentities,
        current: count,
      });
    }
    next();
  } catch (err) {
    console.error("checkSenderIdentityLimit error:", err);
    next();
  }
};

/**
 * Utility: getPlanLimits
 * Returns the plan object for a given tier slug. Useful in controllers.
 */
exports.getPlanLimits = getPlanFromDB;
