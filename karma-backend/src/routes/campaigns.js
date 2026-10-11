const router = require('express').Router();
const { z } = require('zod');
const prisma = require('../db');
const validate = require('../middleware/validate');
const { AppError } = require('../middleware/error');
const { requireAdmin, optionalAdmin } = require('../middleware/auth');
const audit = require('../services/audit');
const { uniqueSlug } = require('../utils');

const listQ = z.object({
  q: z.string().trim().max(100).optional(),
  category: z.string().optional(),
  status: z.enum(['DRAFT', 'ACTIVE', 'COMPLETED', 'CLOSED']).optional(),
  sort: z.enum(['newest', 'most_funded', 'ending_soon']).default('newest'),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(12),
});
const base = z.object({
  title: z.string().trim().min(3).max(150),
  summary: z.string().trim().min(10).max(300),
  story: z.string().trim().min(20),
  goal: z.number().int().positive(), // minor units
  currency: z.enum(['KES', 'USD']).default('KES'),
  images: z.array(z.string().max(500)).default([]),
  status: z.enum(['DRAFT', 'ACTIVE', 'COMPLETED', 'CLOSED']).default('DRAFT'),
  beneficiary: z.string().max(200).optional(),
  location: z.string().max(150).optional(),
  peopleHelped: z.number().int().min(0).default(0),
  startsAt: z.coerce.date().optional(),
  endsAt: z.coerce.date().optional(),
  categoryId: z.string().min(1),
});
const withCat = { category: { select: { id: true, name: true, slug: true } } };

router.get('/', optionalAdmin, validate(listQ, 'query'), async (req, res) => {
  const { q, category, status, sort, page, limit } = req.query;
  const isAdmin = req.user && req.user.role === 'ADMIN';
  const where = {};
  if (isAdmin) { if (status) where.status = status; } else where.status = { in: ['ACTIVE', 'COMPLETED'] };
  if (q) where.OR = ['title', 'summary', 'location'].map((f) => ({ [f]: { contains: q, mode: 'insensitive' } }));
  if (category) where.category = { slug: category };
  const orderBy = { newest: { createdAt: 'desc' }, most_funded: { raised: 'desc' }, ending_soon: { endsAt: { sort: 'asc', nulls: 'last' } } }[sort];
  const [total, data] = await Promise.all([
    prisma.campaign.count({ where }),
    prisma.campaign.findMany({ where, orderBy, skip: (page - 1) * limit, take: limit, include: withCat }),
  ]);
  res.json({ data, meta: { page, limit, total, pages: Math.ceil(total / limit) } });
});

router.get('/:slug', optionalAdmin, async (req, res) => {
  const c = await prisma.campaign.findUnique({ where: { slug: req.params.slug }, include: withCat });
  const isAdmin = req.user && req.user.role === 'ADMIN';
  if (!c || (!isAdmin && !['ACTIVE', 'COMPLETED'].includes(c.status))) throw new AppError(404, 'NOT_FOUND', 'Campaign not found');
  const [donors, donationCount] = await Promise.all([
    prisma.donation.findMany({ where: { campaignId: c.id, status: 'COMPLETED' }, orderBy: { completedAt: 'desc' }, take: 10, select: { amount: true, currency: true, message: true, completedAt: true, anonymous: true, donor: { select: { name: true } } } }),
    prisma.donation.count({ where: { campaignId: c.id, status: 'COMPLETED' } }),
  ]);
  const recentDonors = donors.map((d) => ({ name: d.anonymous ? 'Anonymous' : d.donor.name, amount: d.amount, currency: d.currency, message: d.message, completedAt: d.completedAt }));
  res.json({ data: { ...c, donationCount, recentDonors } });
});

router.post('/', requireAdmin, validate(base), async (req, res) => {
  const c = await prisma.campaign.create({ data: { ...req.body, slug: await uniqueSlug(prisma.campaign, req.body.title) }, include: withCat });
  await audit(req, 'campaign.create', 'Campaign', c.id);
  res.status(201).json({ data: c });
});
router.patch('/:id', requireAdmin, validate(base.partial()), async (req, res) => {
  const c = await prisma.campaign.update({ where: { id: req.params.id }, data: req.body, include: withCat });
  await audit(req, 'campaign.update', 'Campaign', c.id, { fields: Object.keys(req.body) });
  res.json({ data: c });
});
router.delete('/:id', requireAdmin, async (req, res) => {
  if (await prisma.donation.count({ where: { campaignId: req.params.id } })) throw new AppError(409, 'HAS_DONATIONS', 'Campaign has donations; set status to CLOSED instead');
  await prisma.campaign.delete({ where: { id: req.params.id } });
  await audit(req, 'campaign.delete', 'Campaign', req.params.id);
  res.json({ ok: true });
});
module.exports = router;
