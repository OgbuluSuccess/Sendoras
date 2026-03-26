/**
 * providers/resend.js — Resend email provider
 * Docs: https://resend.com/docs
 */
const { Resend } = require('resend');

let client = null;
const getClient = () => {
    if (!client) client = new Resend(process.env.RESEND_API_KEY);
    return client;
};

const send = async ({ to, subject, html, from, replyTo }) => {
    const resend = getClient();

    const { data, error } = await resend.emails.send({
        from: from || process.env.RESEND_FROM_EMAIL || 'Sendoras <onboarding@resend.dev>',
        to: Array.isArray(to) ? to : [to],
        subject,
        html,
        ...(replyTo ? { reply_to: replyTo } : {}),
    });

    if (error) {
        throw new Error(error.message || 'Resend send failed');
    }

    return { messageId: data.id, provider: 'resend' };
};

module.exports = { send, name: 'resend' };
