const router = require('express').Router();
const { z } = require('zod');
const prisma = require('../db');
const validate = require('../middleware/validate');
const { AppError } = require('../middleware/error');
const { requireAdmin } = require('../middleware/auth');
const audit = require('../services/audit');
const { toCsv } = require('../utils');

router.use(requireAdmin);
const pageQ = z.object({ q: z.string().trim().max(100).optional(), page: z.coerce.number().int().min(1).default(1), limit: z.coerce.number().int().min(1).max(100).default(25) });

router.get('/donors', validate(pageQ, 'query'), async (req, res) => {
  const { q, page, limit } = req.query;
  const where = q ? { OR: [{ name: { contains: q, mode: 'insensitive' } }, { email: { contains: q, mode: 'insensitive' } }] } : {};
  const [total, rows] = await Promise.all([
    prisma.donor.count({ where }),
    prisma.donor.findMany({ where, orderBy: { createdAt: 'desc' }, skip: (page - 1) * limit, take: limit, include: { donations: { where: { status: 'COMPLETED' }, select: { amount: true, currency: true } } } }),
  ]);
  const data = rows.map(({ donations, ...d }) => {
    const given = {};
    donations.forEach((x) => { given[x.currency] = (given[x.currency] || 0) + x.amount; });
    return { ...d, donationCount: donations.length, totalGiven: given };
  });
  res.json({ data, meta: { page, limit, total, pages: Math.ceil(total / limit) } });
});

// Data-subject export (Kenya Data Protection Act)
router.get('/donors/:id/export', async (req, res) => {
  const donor = await prisma.donor.findUnique({ where: { id: req.params.id }, include: { donations: true, subscriptions: true } });
  if (!donor) throw new AppError(404, 'NOT_FOUND', 'Donor not found');
  await audit(req, 'donor.export', 'Donor', donor.id);
  res.json({ data: donor });
});

// Data-subject erasure: anonymise personal data, keep financial records.
router.delete('/donors/:id', async (req, res) => {
  const id = req.params.id;
  await prisma.$transaction([
    prisma.donor.update({ where: { id }, data: { name: 'Deleted donor', email: `deleted-${id}@karma.invalid`, phone: null, anonymizedAt: new Date() } }),
    prisma.donation.updateMany({ where: { donorId: id }, data: { message: null, anonymous: true } }),
    prisma.subscription.updateMany({ where: { donorId: id }, data: { active: false } }),
  ]);
  await audit(req, 'donor.erase', 'Donor', id);
  res.json({ ok: true });
});

router.get('/messages', validate(pageQ, 'query'), async (req, res) => {
  const { page, limit } = req.query;
  const [total, data] = await Promise.all([prisma.contactMessage.count(), prisma.contactMessage.findMany({ orderBy: { createdAt: 'desc' }, skip: (page - 1) * limit, take: limit })]);
  res.json({ data, meta: { page, limit, total, pages: Math.ceil(total / limit) } });
});
router.patch('/messages/:id/read', async (req, res) => {
  res.json({ data: await prisma.contactMessage.update({ where: { id: req.params.id }, data: { isRead: true } }) });
});

router.get('/donations.csv', validate(z.object({ status: z.enum(['PENDING', 'COMPLETED', 'FAILED']).optional() }), 'query'), async (req, res) => {
  const rows = await prisma.donation.findMany({ where: req.query.status ? { status: req.query.status } : {}, orderBy: { createdAt: 'desc' }, take: 10000, include: { donor: true, campaign: { select: { title: true } } } });
  const flat = rows.map((d) => ({ reference: d.reference, status: d.status, amount: (d.amount / 100).toFixed(2), currency: d.currency, method: d.method, frequency: d.frequency, campaign: d.campaign ? d.campaign.title : 'General fund', donor: d.donor.name, email: d.donor.email, phone: d.donor.phone, anonymous: d.anonymous, createdAt: d.createdAt.toISOString(), completedAt: d.completedAt ? d.completedAt.toISOString() : '' }));
  await audit(req, 'donations.export', 'Donation', null, { count: flat.length });
  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', 'attachment; filename="karma-donations.csv"');
  res.send(toCsv(flat, ['reference', 'status', 'amount', 'currency', 'method', 'frequency', 'campaign', 'donor', 'email', 'phone', 'anonymous', 'createdAt', 'completedAt']));
});
module.exports = router;
