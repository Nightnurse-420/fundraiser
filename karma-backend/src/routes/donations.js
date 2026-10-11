const router = require('express').Router();
const { z } = require('zod');
const prisma = require('../db');
const config = require('../config');
const validate = require('../middleware/validate');
const { AppError } = require('../middleware/error');
const { requireAdmin } = require('../middleware/auth');
const { donationLimiter } = require('../middleware/limiters');
const paymentService = require('../services/paymentService');
const { newReference } = require('../utils');

const createSchema = z.object({
  amount: z.number().int().positive(), // minor units: KES 500 = 50000
  currency: z.enum(['KES', 'USD']).default('KES'),
  campaignSlug: z.string().optional(), // omit = general Karma fund
  frequency: z.enum(['ONE_TIME', 'MONTHLY']).default('ONE_TIME'),
  method: z.enum(['MPESA', 'CARD']),
  name: z.string().trim().min(2).max(100),
  email: z.string().email().toLowerCase(),
  phone: z.string().regex(/^(\+?254|0)[17]\d{8}$/, 'Invalid Kenyan phone number').optional(),
  anonymous: z.boolean().default(false),
  message: z.string().trim().max(500).optional(),
  consent: z.literal(true, { errorMap: () => ({ message: 'Consent is required' }) }),
}).refine((d) => d.method !== 'MPESA' || d.phone, { message: 'Phone is required for M-Pesa', path: ['phone'] })
  .refine((d) => d.method !== 'MPESA' || d.currency === 'KES', { message: 'M-Pesa supports KES only', path: ['currency'] });

const listQ = z.object({
  status: z.enum(['PENDING', 'COMPLETED', 'FAILED']).optional(),
  campaign: z.string().optional(),
  q: z.string().trim().max(100).optional(),
  from: z.coerce.date().optional(),
  to: z.coerce.date().optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(25),
});

router.post('/', donationLimiter, validate(createSchema), async (req, res) => {
  const b = req.body;
  if (b.amount < config.minDonation[b.currency]) {
    throw new AppError(422, 'BELOW_MINIMUM', `Minimum donation is ${config.minDonation[b.currency] / 100} ${b.currency}`);
  }
  let campaign = null;
  if (b.campaignSlug) {
    campaign = await prisma.campaign.findUnique({ where: { slug: b.campaignSlug } });
    if (!campaign || campaign.status !== 'ACTIVE') throw new AppError(404, 'CAMPAIGN_UNAVAILABLE', 'Campaign is not accepting donations');
    if (campaign.currency !== b.currency) throw new AppError(422, 'CURRENCY_MISMATCH', `This campaign accepts ${campaign.currency}`);
  }
  const donor = await prisma.donor.upsert({
    where: { email: b.email },
    update: { name: b.name, ...(b.phone ? { phone: b.phone } : {}) },
    create: { email: b.email, name: b.name, phone: b.phone, consentAt: new Date() },
  });
  const donation = await prisma.donation.create({
    data: { reference: newReference(), amount: b.amount, currency: b.currency, frequency: b.frequency, method: b.method, anonymous: b.anonymous, message: b.message, donorId: donor.id, campaignId: campaign ? campaign.id : null },
  });
  let checkout;
  try {
    checkout = await paymentService.initiate({ donation, donor, campaign });
  } catch (e) {
    await prisma.donation.update({ where: { id: donation.id }, data: { status: 'FAILED' } });
    throw e instanceof AppError ? e : new AppError(502, 'PAYMENT_INIT_FAILED', 'Could not start payment, please try again');
  }
  res.status(201).json({ data: { reference: donation.reference, status: donation.status, amount: donation.amount, currency: donation.currency, checkout } });
});

router.get('/', requireAdmin, validate(listQ, 'query'), async (req, res) => {
  const { status, campaign, q, from, to, page, limit } = req.query;
  const where = {};
  if (status) where.status = status;
  if (campaign) where.campaign = { slug: campaign };
  if (from || to) where.createdAt = { ...(from && { gte: from }), ...(to && { lte: to }) };
  if (q) where.OR = [{ reference: { contains: q, mode: 'insensitive' } }, { donor: { email: { contains: q, mode: 'insensitive' } } }, { donor: { name: { contains: q, mode: 'insensitive' } } }];
  const [total, data] = await Promise.all([
    prisma.donation.count({ where }),
    prisma.donation.findMany({ where, orderBy: { createdAt: 'desc' }, skip: (page - 1) * limit, take: limit, include: { donor: { select: { id: true, name: true, email: true, phone: true } }, campaign: { select: { title: true, slug: true } } } }),
  ]);
  res.json({ data, meta: { page, limit, total, pages: Math.ceil(total / limit) } });
});

// Public status check (used by the frontend to poll after M-Pesa STK push). Returns no donor details.
router.get('/:reference', async (req, res) => {
  const d = await prisma.donation.findUnique({ where: { reference: req.params.reference }, include: { campaign: { select: { title: true, slug: true } } } });
  if (!d) throw new AppError(404, 'NOT_FOUND', 'Donation not found');
  res.json({ data: { reference: d.reference, status: d.status, amount: d.amount, currency: d.currency, frequency: d.frequency, campaign: d.campaign, createdAt: d.createdAt, completedAt: d.completedAt } });
});
module.exports = router;
