const logger = require('../logger');
// Interface only. Resend/SendGrid implementation is added in the integrations step.
module.exports = {
  async sendDonationReceipt(donation) { logger.info({ ref: donation.reference, to: donation.donor.email }, 'email:receipt (stub)'); },
  async sendAdminNotification(donation) { logger.info({ ref: donation.reference }, 'email:admin-alert (stub)'); },
  async sendContactAutoReply(msg) { logger.info({ to: msg.email }, 'email:contact-reply (stub)'); },
};
