const router = require('express').Router();
const { z } = require('zod');
const prisma = require('../db');
const validate = require('../middleware/validate');
const { publicFormLimiter } = require('../middleware/limiters');
const emailService = require('../services/emailService');
const logger = require('../logger');

const schema = z.object({ name: z.string().trim().min(2).max(100), email: z.string().email().toLowerCase(), subject: z.string().trim().max(150).optional(), message: z.string().trim().min(10).max(3000) });
router.post('/', publicFormLimiter, validate(schema), async (req, res) => {
  const m = await prisma.contactMessage.create({ data: req.body });
  emailService.sendContactAutoReply(m).catch((e) => logger.error(e));
  res.status(201).json({ ok: true });
});
module.exports = router;
