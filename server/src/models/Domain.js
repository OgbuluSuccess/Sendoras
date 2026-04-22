const mongoose = require("mongoose");

const DomainSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  domain: {
    type: String,
    required: true,
    lowercase: true,
    trim: true,
  },

  // ── Overall status ────────────────────────────────────────────────────
  status: {
    type: String,
    enum: ["pending", "verified", "failed"],
    default: "pending",
  },

  // ── AWS SES verification ──────────────────────────────────────────────
  // TXT record value for domain ownership
  verificationToken: { type: String },
  // 3 CNAME tokens for DKIM signing (abc123 → abc123.dkim.amazonses.com)
  dkimTokens: { type: [String], default: [] },
  sesStatus: {
    type: String,
    enum: ["pending", "verified", "failed", "not_started"],
    default: "pending",
  },

  // ── Resend verification ───────────────────────────────────────────────
  resendDomainId: { type: String }, // Resend's internal domain ID
  resendRecords: { type: mongoose.Schema.Types.Mixed, default: null }, // array of DNS records from Resend
  resendStatus: {
    type: String,
    enum: ["not_added", "pending", "verified", "failed"],
    default: "not_added",
  },

  // ── SPF Record verification ───────────────────────────────────────────
  spfStatus: {
    type: String,
    enum: ["pending", "verified", "failed"],
    default: "pending",
  },

  // ── DMARC Policy verification ─────────────────────────────────────────
  dmarcStatus: {
    type: String,
    enum: ["pending", "verified", "failed"],
    default: "pending",
  },

  createdAt: { type: Date, default: Date.now },
});

// One domain per user
DomainSchema.index({ user: 1, domain: 1 }, { unique: true });

module.exports = mongoose.model("Domain", DomainSchema);
