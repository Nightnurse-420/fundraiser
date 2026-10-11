const rateLimit = require('express-rate-limit');
const mk = (windowMs, limit) => rateLimit({
  windowMs, limit, standardHeaders: true, legacyHeaders: false,
  skip: () => process.env.NODE_ENV === 'test',
  handler: (_req, res) => res.status(429).json({ error: { code: 'RATE_LIMITED', message: 'Too many requests, try again later' } }),
});
module.exports = { loginLimiter: mk(15 * 60e3, 10), donationLimiter: mk(10 * 60e3, 20), publicFormLimiter: mk(10 * 60e3, 10) };
