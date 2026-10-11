const logger = require('../logger');
// Interface only. Africa's Talking implementation is added in the integrations step.
module.exports = {
  async sendDonationConfirmation(donation) { if (donation.donor.phone) logger.info({ ref: donation.reference }, 'sms:confirmation (stub)'); },
};
