const AppSettings = require("../models/AppSettings");

// Allowed fields the admin can update (whitelist)
const EDITABLE_FIELDS = [
  "defaultSenderName",
  "defaultSenderEmail",
  "appBaseUrl",
  "docsUrl",
  "stripeProductPrefix",
  "apiName",
  "maintenanceMode",
  "allowSignups",
  "emailProvider",
];

// @desc    Get all settings (admin)
// @route   GET /api/admin/settings
// @access  Private/Admin
exports.getSettings = async (req, res) => {
  try {
    const settings = await AppSettings.getSettings();
    res.json(settings);
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
};

// @desc    Update settings (admin)
// @route   PUT /api/admin/settings
// @access  Private/Admin
exports.updateSettings = async (req, res) => {
  try {
    const update = {};
    EDITABLE_FIELDS.forEach((field) => {
      if (req.body[field] !== undefined) update[field] = req.body[field];
    });

    const settings = await AppSettings.findOneAndUpdate(
      { key: "global" },
      { $set: update },
      { new: true, upsert: true, runValidators: true },
    );

    // Bust the in-process cache so controllers pick up the new values immediately
    cachedSettings = null;

    // Propagate provider change to emailService runtime without restart
    if (update.emailProvider) {
      const { setEmailProvider } = require("../services/emailService");
      setEmailProvider(update.emailProvider);
    }

    res.json(settings);
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
};

// ── Internal helper used by other controllers ────────────────────────────────
// Lightweight 30-second in-process cache so we don't hit MongoDB on every email.
let cachedSettings = null;
let cacheExpiry = 0;
const CACHE_TTL = 30 * 1000;

exports.getAppSettings = async () => {
  if (cachedSettings && Date.now() < cacheExpiry) return cachedSettings;
  cachedSettings = await AppSettings.getSettings();
  cacheExpiry = Date.now() + CACHE_TTL;
  return cachedSettings;
};
