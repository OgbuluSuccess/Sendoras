// server/src/controllers/validationController.js
const dns = require('dns').promises;

// RFC 5322 compliant email regex
const EMAIL_REGEX = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*\.[a-zA-Z]{2,}$/;

// Disposable/throwaway email domains (most common ones)
const DISPOSABLE_DOMAINS = new Set([
    'mailinator.com', 'guerrillamail.com', 'tempmail.com', 'throwam.com',
    'yopmail.com', 'trashmail.com', 'maildrop.cc', 'sharklasers.com',
    'guerrillamailblock.com', 'grr.la', 'guerrillamail.info', 'spam4.me',
    '10minutemail.com', 'getairmail.com', 'dispostable.com', 'mailnull.com',
    'spamgourmet.com', 'fakeinbox.com', 'tempinbox.com', 'throwam.com',
    'mailexpire.com', 'filzmail.com', 'mailzilla.com', 'bobmail.info',
    'discard.email', 'spambog.com', 'spamfree24.org', 'trashmail.at',
    'trashmail.io', 'trashmail.me', 'trashmail.n'
]);

// Role-based email prefixes (not personal, usually not good for marketing)
const ROLE_PREFIXES = new Set([
    'admin', 'info', 'support', 'contact', 'sales', 'help', 'no-reply',
    'noreply', 'mail', 'webmaster', 'postmaster', 'abuse', 'hostmaster'
]);

// Well-known legitimate email domains — used for typo detection
const POPULAR_DOMAINS = [
    'gmail.com', 'yahoo.com', 'outlook.com', 'hotmail.com', 'icloud.com',
    'aol.com', 'protonmail.com', 'live.com', 'msn.com', 'me.com',
    'googlemail.com', 'yahoo.co.uk', 'yahoo.co.in', 'ymail.com'
];

/**
 * Levenshtein distance — measures how many edits apart two strings are.
 * Distance of 1-2 on a domain = likely a typo.
 */
function levenshtein(a, b) {
    const m = a.length, n = b.length;
    const dp = Array.from({ length: m + 1 }, (_, i) => Array.from({ length: n + 1 }, (_, j) => j === 0 ? i : 0));
    for (let j = 1; j <= n; j++) dp[0][j] = j;
    for (let i = 1; i <= m; i++) {
        for (let j = 1; j <= n; j++) {
            dp[i][j] = a[i - 1] === b[j - 1]
                ? dp[i - 1][j - 1]
                : 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
        }
    }
    return dp[m][n];
}

/**
 * Returns the closest popular domain if the given domain looks like a typo.
 * e.g. gmhail.com → gmail.com, yahooo.com → yahoo.com
 */
function detectTypo(domain) {
    // Skip if domain already matches exactly
    if (POPULAR_DOMAINS.includes(domain)) return null;
    for (const popular of POPULAR_DOMAINS) {
        const dist = levenshtein(domain, popular);
        // Distance of 1 or 2 = likely typo
        if (dist > 0 && dist <= 2) return popular;
    }
    return null;
}

/**
 * Validates a single email address:
 * 1. Regex format check
 * 2. Disposable domain check
 * 3. MX record DNS lookup (does domain accept email?)
 */
exports.validateEmail = async (req, res) => {
    const { email } = req.body;

    if (!email || typeof email !== 'string') {
        return res.status(400).json({ valid: false, status: 'invalid', reason: 'No email provided.' });
    }

    const trimmed = email.trim().toLowerCase();

    // 1. Regex format check
    if (!EMAIL_REGEX.test(trimmed)) {
        return res.json({ email: trimmed, status: 'invalid', reason: 'Invalid email format.' });
    }

    const [localPart, domain] = trimmed.split('@');

    // 2. Disposable domain check
    if (DISPOSABLE_DOMAINS.has(domain)) {
        return res.json({ email: trimmed, status: 'risky', reason: 'Disposable or temporary email domain.' });
    }

    // 3. Role-based prefix check
    if (ROLE_PREFIXES.has(localPart)) {
        return res.json({ email: trimmed, status: 'risky', reason: 'Role-based email (e.g. info@, support@) — may not reach a real person.' });
    }

    // 4. Typo detection — catch gmhail.com, yahooo.com, etc.
    const typoSuggestion = detectTypo(domain);
    if (typoSuggestion) {
        return res.json({ email: trimmed, status: 'risky', reason: `Possible typo detected — did you mean @${typoSuggestion}?` });
    }

    // 5. DNS MX record lookup
    try {
        const mxRecords = await dns.resolveMx(domain);
        if (!mxRecords || mxRecords.length === 0) {
            return res.json({ email: trimmed, status: 'invalid', reason: 'Domain has no mail servers (no MX records).' });
        }
        // Valid — has MX records
        return res.json({ email: trimmed, status: 'valid', reason: `Domain has ${mxRecords.length} mail server(s).` });
    } catch (err) {
        if (err.code === 'ENOTFOUND' || err.code === 'ENODATA') {
            return res.json({ email: trimmed, status: 'invalid', reason: 'Domain does not exist.' });
        }
        // DNS timeout or other error — mark as risky rather than killing the request
        return res.json({ email: trimmed, status: 'risky', reason: 'Could not verify domain (DNS timeout). Treat with caution.' });
    }
};

/**
 * Validates a batch of emails (up to 500)
 */
exports.validateBulk = async (req, res) => {
    const { emails } = req.body;

    if (!Array.isArray(emails) || emails.length === 0) {
        return res.status(400).json({ msg: 'No emails provided.' });
    }

    const limited = emails.slice(0, 500);

    // Validate all emails concurrently with a concurrency cap
    const results = await Promise.allSettled(
        limited.map(async (email) => {
            const trimmed = String(email).trim().toLowerCase();
            if (!EMAIL_REGEX.test(trimmed)) return { email: trimmed, status: 'invalid', reason: 'Invalid format' };

            const [localPart, domain] = trimmed.split('@');
            if (DISPOSABLE_DOMAINS.has(domain)) return { email: trimmed, status: 'risky', reason: 'Disposable domain' };
            if (ROLE_PREFIXES.has(localPart)) return { email: trimmed, status: 'risky', reason: 'Role-based prefix' };
            const typo = detectTypo(domain);
            if (typo) return { email: trimmed, status: 'risky', reason: `Possible typo — did you mean @${typo}?` };

            try {
                const mx = await dns.resolveMx(domain);
                return { email: trimmed, status: mx?.length > 0 ? 'valid' : 'invalid', reason: mx?.length > 0 ? 'Has MX records' : 'No MX records' };
            } catch {
                return { email: trimmed, status: 'risky', reason: 'DNS lookup failed' };
            }
        })
    );

    const output = results.map(r => r.status === 'fulfilled' ? r.value : { email: 'unknown', status: 'risky', reason: 'Error' });
    res.json(output);
};
