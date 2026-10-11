const router = require('express').Router();
const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { z } = require('zod');
const prisma = require('../db');
const config = require('../config');
const validate = require('../middleware/validate');
const { AppError } = require('../middleware/error');
const { loginLimiter } = require('../middleware/limiters');
const { requireAdmin } = require('../middleware/auth');

const cookie = (httpOnly) => ({ httpOnly, sameSite: 'strict', secure: config.prod, maxAge: 7 * 864e5, path: '/' });

router.post('/login', loginLimiter, validate(z.object({ email: z.string().email(), password: z.string().min(1) })), async (req, res) => {
  const user = await prisma.user.findUnique({ where: { email: req.body.email.toLowerCase() } });
  const ok = user && (await bcrypt.compare(req.body.password, user.passwordHash));
  if (!ok) throw new AppError(401, 'INVALID_CREDENTIALS', 'Invalid email or password');
  const token = jwt.sign({ sub: user.id, role: user.role }, config.jwtSecret, { expiresIn: '7d' });
  const csrfToken = crypto.randomBytes(24).toString('hex');
  res.cookie('karma_token', token, cookie(true));
  res.cookie('karma_csrf', csrfToken, cookie(false));
  res.json({ user: { id: user.id, email: user.email, name: user.name, role: user.role }, csrfToken });
});

router.post('/logout', (_req, res) => {
  res.clearCookie('karma_token', { path: '/' });
  res.clearCookie('karma_csrf', { path: '/' });
  res.json({ ok: true });
});

router.get('/me', requireAdmin, async (req, res) => {
  const user = await prisma.user.findUnique({ where: { id: req.user.sub }, select: { id: true, email: true, name: true, role: true } });
  if (!user) throw new AppError(401, 'UNAUTHORIZED', 'Login required');
  res.json({ user });
});
module.exports = router;
