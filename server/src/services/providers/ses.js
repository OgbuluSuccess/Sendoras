/**
 * providers/ses.js — AWS SES email provider
 */
const AWS = require('aws-sdk');

AWS.config.update({
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    region: process.env.AWS_REGION || 'us-east-1',
});

const ses = new AWS.SES({ apiVersion: '2010-12-01' });

const send = async ({ to, subject, html, from, replyTo }) => {
    const params = {
        Destination: { ToAddresses: Array.isArray(to) ? to : [to] },
        Message: {
            Body: { Html: { Charset: 'UTF-8', Data: html } },
            Subject: { Charset: 'UTF-8', Data: subject },
        },
        Source: from || process.env.SES_FROM_EMAIL,
        ...(replyTo ? { ReplyToAddresses: [replyTo] } : {}),
    };

    const result = await ses.sendEmail(params).promise();
    return { messageId: result.MessageId, provider: 'ses' };
};

module.exports = { send, name: 'ses' };
