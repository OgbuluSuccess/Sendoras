/**
 * emailService.js — Multi-provider email sending abstraction
 *
 * The active provider is controlled dynamically via Admin → Global Settings
 * (stored in AppSettings.emailProvider in MongoDB).
 * Falls back to the EMAIL_PROVIDER env var, then defaults to 'resend'.
 *
 *   'ses'          → AWS SES only
 *   'resend'       → Resend only
 *   'ses,resend'   → SES primary, Resend as fallback
 *   'resend,ses'   → Resend primary, SES as fallback
 */

const AppSettings = require("../models/AppSettings");
const sesProvider = require("./providers/ses");
const resendProvider = require("./providers/resend");

const PROVIDERS = { ses: sesProvider, resend: resendProvider };

// Runtime override — updated via setEmailProvider() when admin saves settings
// without requiring a server restart.
let _runtimeProvider = null;

/**
 * Called by settingsController after a successful save so the change takes
 * effect immediately without a restart.
 */
const setEmailProvider = (value) => {
  _runtimeProvider = value || null;
};

/**
 * Resolve the ordered provider chain. Prefers (in order):
 *   1. Runtime value set by setEmailProvider() (last admin save)
 *   2. AppSettings.emailProvider from MongoDB
 *   3. EMAIL_PROVIDER env var
 *   4. Hardcoded default: 'resend'
 */
async function resolveChain() {
  let raw = _runtimeProvider;
  if (!raw) {
    try {
      const settings = await AppSettings.getSettings();
      raw = settings.emailProvider;
    } catch {
      // DB unavailable — fall through to env var
    }
  }
  raw = (raw || process.env.EMAIL_PROVIDER || "resend").toLowerCase();
  return raw
    .split(",")
    .map((name) => name.trim())
    .filter((name) => PROVIDERS[name])
    .map((name) => PROVIDERS[name]);
}

/**
 * sendEmail — send through the configured provider(s) with automatic fallback.
 */
const sendEmail = async ({
  to,
  subject,
  html,
  from,
  replyTo,
  unsubscribeUrl,
}) => {
  const chain = await resolveChain();

  if (chain.length === 0) {
    throw new Error(
      "No valid email provider configured. Check Admin Settings or EMAIL_PROVIDER in .env",
    );
  }

  let lastError = null;

  for (const provider of chain) {
    try {
      const result = await provider.send({
        to,
        subject,
        html,
        from,
        replyTo,
        unsubscribeUrl,
      });
      if (chain.length > 1 && provider !== chain[0]) {
        console.warn(
          `[emailService] Primary provider failed, used fallback: ${provider.name}`,
        );
      } else {
        console.log(
          `[emailService] Email to ${to} sent via ${provider.name} (id: ${result.messageId})`,
        );
      }
      return result;
    } catch (err) {
      console.error(
        `[emailService] Provider "${provider.name}" failed:`,
        err.message,
      );
      lastError = err;
    }
  }

  throw new Error(
    `All email providers failed. Last error: ${lastError?.message}`,
  );
};

/**
 * getActiveProviders — async, returns the current provider name list.
 * Used by the admin stats endpoint.
 */
const getActiveProviders = async () => {
  let raw = _runtimeProvider;
  if (!raw) {
    try {
      const settings = await AppSettings.getSettings();
      raw = settings.emailProvider;
    } catch {
      /* fall through */
    }
  }
  raw = (raw || process.env.EMAIL_PROVIDER || "resend").toLowerCase();
  return raw
    .split(",")
    .map((n) => n.trim())
    .filter((n) => PROVIDERS[n]);
};

module.exports = { sendEmail, getActiveProviders, setEmailProvider };
