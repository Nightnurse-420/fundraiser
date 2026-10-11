const router = require('express').Router();
const paymentService = require('../services/paymentService');
const { completeDonation, failDonation } = require('../services/donationService');

// Only verified provider events can complete a donation. Safe to receive duplicates.
router.post('/payment', async (req, res) => {
  const ev = paymentService.verifyWebhook(req);
  if (ev.status === 'success') await completeDonation(ev.reference, ev);
  else if (ev.status === 'failed') await failDonation(ev.reference);
  res.json({ received: true });
});
module.exports = router;
