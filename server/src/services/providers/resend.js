/**
 * providers/resend.js — Resend email provider
 * Docs: https://resend.com/docs
 */
const { Resend } = require("resend");

let client = null;
const getClient = () => {
  if (!client) client = new Resend(process.env.RESEND_API_KEY);
  return client;
};

const { getAppSettings } = require("../../controllers/settingsController");

const send = async ({ to, subject, html, from, replyTo, unsubscribeUrl }) => {
  const resend = getClient();

  // Yahoo and Gmail require List-Unsubscribe headers for bulk mail
  const headers = {};
  if (unsubscribeUrl) {
    headers["List-Unsubscribe"] = `<${unsubscribeUrl}>`;
    headers["List-Unsubscribe-Post"] = "List-Unsubscribe=One-Click";
  }

  const { data, error } = await resend.emails.send({
    from:
      from ||
      process.env.RESEND_FROM_EMAIL ||
      (await (async () => {
        const s = await getAppSettings();
        return `${s.defaultSenderName} <${s.defaultSenderEmail}>`;
      })()),
    to: Array.isArray(to) ? to : [to],
    subject,
    html,
    ...(replyTo ? { reply_to: replyTo } : {}),
    ...(Object.keys(headers).length > 0 ? { headers } : {}),
  });

  if (error) {
    throw new Error(error.message || "Resend send failed");
  }

  return { messageId: data.id, provider: "resend" };
};

module.exports = { send, name: "resend" };
