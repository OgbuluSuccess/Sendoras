/**
 * providers/ses.js — AWS SES email provider
 *
 * Uses sendRawEmail so we can inject List-Unsubscribe headers required by
 * Yahoo and Gmail for bulk / campaign mail.
 */
const AWS = require("aws-sdk");

AWS.config.update({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION || "us-east-1",
});

const ses = new AWS.SES({ apiVersion: "2010-12-01" });

/**
 * Extract the domain from an email address like "Name <user@domain.com>" or "user@domain.com"
 */
const extractDomain = (address) => {
  const match = address.match(/@([\w.-]+)/);
  return match ? match[1] : null;
};

const send = async ({ to, subject, html, from, replyTo, unsubscribeUrl }) => {
  const toAddresses = Array.isArray(to) ? to : [to];
  const fromAddress = from || process.env.SES_FROM_EMAIL;

  // Return-Path controls the "mailed-by" label in Gmail/Yahoo.
  // Use an explicit env override, or derive from the sender's domain.
  // SES requires the Return-Path domain to be verified in your account.
  const senderDomain = extractDomain(fromAddress);
  const returnPath =
    process.env.SES_RETURN_PATH ||
    (senderDomain ? `bounces@${senderDomain}` : null);

  // Build headers as a clean array — no trimming tricks that drop the blank line
  const headers = [
    `From: ${fromAddress}`,
    `To: ${toAddresses.join(", ")}`,
    `Subject: ${subject}`,
    `MIME-Version: 1.0`,
    `Content-Type: text/html; charset=UTF-8`,
  ];

  if (returnPath) headers.push(`Return-Path: <${returnPath}>`);

  if (replyTo) headers.push(`Reply-To: ${replyTo}`);
  if (unsubscribeUrl) {
    // Required by Yahoo & Gmail bulk sender policy (Feb 2024)
    headers.push(`List-Unsubscribe: <${unsubscribeUrl}>`);
    headers.push(`List-Unsubscribe-Post: List-Unsubscribe=One-Click`);
  }

  // RFC 2822: headers and body MUST be separated by a single blank line (\r\n\r\n)
  const rawMessage = [...headers, "", html].join("\r\n");

  const params = {
    RawMessage: { Data: Buffer.from(rawMessage) },
    Source: fromAddress,
    Destinations: toAddresses,
  };

  const result = await ses.sendRawEmail(params).promise();
  return { messageId: result.MessageId, provider: "ses" };
};

module.exports = { send, name: "ses" };
