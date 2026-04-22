const mongoose = require("mongoose");

/**
 * Singleton settings document — always stored with key = 'global'.
 * Call AppSettings.getSettings() anywhere to get the current config.
 * Call AppSettings.findOneAndUpdate({ key: 'global' }, ...) to save.
 */
const appSettingsSchema = new mongoose.Schema(
  {
    key: { type: String, default: "global", unique: true },

    // ── Sender defaults ──────────────────────────────────────────────
    defaultSenderName: { type: String, default: "Sendhiiv" },
    defaultSenderEmail: { type: String, default: "hello@sendhiiv.com" },

    // ── URLs ─────────────────────────────────────────────────────────
    appBaseUrl: { type: String, default: "https://app.sendhiiv.com" },
    docsUrl: { type: String, default: "https://sendhiiv.com/docs" },

    // ── Stripe / billing ─────────────────────────────────────────────
    stripeProductPrefix: { type: String, default: "Sendhiiv" },

    // ── API identity ─────────────────────────────────────────────────
    apiName: { type: String, default: "Sendhiiv Email API" },

    // ── Platform toggles ─────────────────────────────────────────────
    maintenanceMode: { type: Boolean, default: false },
    allowSignups: { type: Boolean, default: true },

    // ── Email provider ────────────────────────────────────────────────
    // Valid values: 'resend' | 'ses' | 'ses,resend' | 'resend,ses'
    emailProvider: { type: String, default: "resend" },
  },
  { timestamps: true },
);

/**
 * Returns the singleton settings document, creating it with defaults if it
 * doesn't exist yet.
 */
appSettingsSchema.statics.getSettings = async function () {
  let doc = await this.findOne({ key: "global" });
  if (!doc) doc = await this.create({ key: "global" });
  return doc;
};

module.exports = mongoose.model("AppSettings", appSettingsSchema);
