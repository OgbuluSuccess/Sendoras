const SESProvider = require('./providers/SESProvider');
// const SendGridProvider = require('./providers/SendGridProvider'); // Future

class EmailService {
    constructor() {
        this.sesProvider = new SESProvider();
        // this.sendGridProvider = new SendGridProvider();
        this.defaultProvider = 'ses';
    }

    async sendEmail(emailData) {
        // Fallback logic can be implemented here
        try {
            console.log(`Sending email via ${this.defaultProvider}...`);
            return await this.sesProvider.send(emailData);
        } catch (error) {
            console.error(`Failed to send via ${this.defaultProvider}`, error);
            // Implement fallback to other providers here
            // return await this.sendGridProvider.send(emailData);
            throw new Error('Email sending failed all providers');
        }
    }
}

module.exports = new EmailService();
