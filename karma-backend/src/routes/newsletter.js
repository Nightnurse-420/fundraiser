const router = require('express').Router();
const { z } = require('zod');
const prisma = require('../db');
const validate = require('../middleware/validate');
const { publicFormLimiter } = require('../middleware/limiters');

router.post('/', publicFormLimiter, validate(z.object({ email: z.string().email().toLowerCase() })), async (req, res) => {
  await prisma.newsletterSubscriber.upsert({ where: { email: req.body.email }, update: {}, create: { email: req.body.email } });
  res.status(201).json({ ok: true });
});
module.exports = router;
