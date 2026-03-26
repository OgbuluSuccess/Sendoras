/**
 * emailService.js — Multi-provider email sending abstraction
 *
 * Controlled by the EMAIL_PROVIDER environment variable:
 *
 *   EMAIL_PROVIDER=ses          → AWS SES only
 *   EMAIL_PROVIDER=resend       → Resend only
 *   EMAIL_PROVIDER=ses,resend   → SES primary, Resend as fallback
 *   EMAIL_PROVIDER=resend,ses   → Resend primary, SES as fallback
 *
 * If EMAIL_PROVIDER is not set, defaults to 'ses' for backwards compatibility.
 */

const sesProvider = require('./providers/ses');
const resendProvider = require('./providers/resend');

const PROVIDERS = { ses: sesProvider, resend: resendProvider };

/**
 * Parse EMAIL_PROVIDER env var into an ordered list of provider modules.
 * e.g. "ses,resend" → [sesProvider, resendProvider]
 */
function getProviderChain() {
    const raw = (process.env.EMAIL_PROVIDER || 'ses').toLowerCase();
    return raw.split(',')
        .map(name => name.trim())
        .filter(name => PROVIDERS[name])
        .map(name => PROVIDERS[name]);
}

/**
 * sendEmail — send an email through the configured provider(s).
 *
 * If multiple providers are listed (e.g. "ses,resend"), it tries the
 * first provider and automatically falls back to the next if it fails.
 *
 * @param {{ to, subject, html, from, replyTo }} options
 * @returns {{ messageId, provider }} — which provider succeeded
 */
const sendEmail = async ({ to, subject, html, from, replyTo }) => {
    const chain = getProviderChain();

    if (chain.length === 0) {
        throw new Error('No valid email provider configured. Check EMAIL_PROVIDER in .env');
    }

    let lastError = null;

    for (const provider of chain) {
        try {
            const result = await provider.send({ to, subject, html, from, replyTo });
            if (chain.length > 1 && provider !== chain[0]) {
                // Fallback was used — log so admin is aware
                console.warn(`[emailService] Primary provider failed, used fallback: ${provider.name}`);
            } else {
                console.log(`[emailService] Email to ${to} sent via ${provider.name} (id: ${result.messageId})`);
            }
            return result;
        } catch (err) {
            console.error(`[emailService] Provider "${provider.name}" failed:`, err.message);
            lastError = err;
            // Continue to next provider in the chain
        }
    }

    // All providers failed
    throw new Error(`All email providers failed. Last error: ${lastError?.message}`);
};

/**
 * getActiveProviders — returns the list of configured provider names.
 * Useful for admin status checks.
 */
const getActiveProviders = () => {
    const raw = (process.env.EMAIL_PROVIDER || 'ses').toLowerCase();
    return raw.split(',').map(n => n.trim()).filter(n => PROVIDERS[n]);
};

module.exports = { sendEmail, getActiveProviders };
