const AWS = require("aws-sdk");

class SESProvider {
  constructor() {
    this.ses = new AWS.SES({
      region: process.env.AWS_REGION,
      accessKeyId: process.env.AWS_ACCESS_KEY_ID,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    });
  }

  async send(emailData) {
    const params = {
      Source: process.env.EMAIL_FROM || "hello@sendhiiv.com", // Replace with verified sender
      Destination: {
        ToAddresses: [emailData.to],
      },
      Message: {
        Subject: {
          Data: emailData.subject,
        },
        Body: {
          Html: {
            Data: emailData.html,
          },
        },
      },
    };

    try {
      const result = await this.ses.sendEmail(params).promise();
      return {
        provider: "ses",
        messageId: result.MessageId,
        status: "sent",
      };
    } catch (error) {
      console.error("SES Send Error:", error);
      throw error;
    }
  }
}

module.exports = SESProvider;
