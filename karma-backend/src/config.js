require('dotenv').config();
const e = process.env;
const prod = e.NODE_ENV === 'production';
if (prod && (!e.JWT_SECRET || !e.WEBHOOK_SECRET)) throw new Error('JWT_SECRET and WEBHOOK_SECRET are required in production');
module.exports = {
  env: e.NODE_ENV || 'development',
  prod,
  port: +e.PORT || 4000,
  brand: e.BRAND_NAME || 'Karma',
  jwtSecret: e.JWT_SECRET || 'dev-secret',
  webhookSecret: e.WEBHOOK_SECRET || 'dev-webhook-secret',
  corsOrigins: (e.CORS_ORIGINS || 'http://localhost:3000').split(','),
  paymentProvider: e.PAYMENT_PROVIDER || 'mock',
  adminNotifyEmail: e.ADMIN_NOTIFY_EMAIL || e.ADMIN_EMAIL,
  // minimum donation in minor units (cents)
  minDonation: {
    KES: Math.round(+(e.MIN_DONATION_KES || 50) * 100),
    USD: Math.round(+(e.MIN_DONATION_USD || 1) * 100),
  },
};
