const crypto = require('crypto');
const config = require('../config');
const { AppError } = require('../middleware/error');
/*
 Provider adapter interface (register more with paymentService.register(name, adapter)):
   initiate({ donation, donor, campaign }) -> { providerRef, ...instructionsForClient }
   verifyWebhook(req) -> { reference, status: 'success'|'failed', providerRef, amount?, raw }  // throw AppError(401) if invalid
 M-Pesa (Daraja) and card adapters plug in here in the integrations step.
*/
const sign = (raw) => crypto.createHmac('sha256', config.webhookSecret).update(raw).digest('hex');
const providers = {
  mock: {
    async initiate({ donation }) {
      return { providerRef: `mock_${donation.reference}`, message: 'Mock provider: POST a signed webhook to complete this donation' };
    },
    verifyWebhook(req) {
      const a = Buffer.from(req.get('x-karma-signature') || '');
      const b = Buffer.from(sign(req.rawBody || Buffer.alloc(0)));
      if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) throw new AppError(401, 'INVALID_SIGNATURE', 'Invalid webhook signature');
      const { reference, status, providerRef, amount } = req.body || {};
      return { reference, status, providerRef, amount, raw: req.body };
    },
  },
};
function get() {
  const p = providers[config.paymentProvider];
  if (!p) throw new AppError(500, 'PROVIDER_NOT_CONFIGURED', 'Payment provider not configured');
  if (config.prod && config.paymentProvider === 'mock') throw new AppError(500, 'PROVIDER_NOT_CONFIGURED', 'Mock provider disabled in production');
  return p;
}
module.exports = {
  register: (name, adapter) => { providers[name] = adapter; },
  initiate: (arg) => get().initiate(arg),
  verifyWebhook: (req) => get().verifyWebhook(req),
  sign,
};
