const router = require('express').Router();
const { z } = require('zod');
const prisma = require('../db');
const validate = require('../middleware/validate');
const { AppError } = require('../middleware/error');
const { requireAdmin } = require('../middleware/auth');
const audit = require('../services/audit');
const { uniqueSlug } = require('../utils');

const schema = z.object({ name: z.string().trim().min(2).max(60), description: z.string().max(300).optional() });

router.get('/', async (_req, res) => {
  const cats = await prisma.category.findMany({ orderBy: { name: 'asc' }, include: { _count: { select: { campaigns: { where: { status: { in: ['ACTIVE', 'COMPLETED'] } } } } } } });
  res.json({ data: cats.map(({ _count, ...c }) => ({ ...c, campaignCount: _count.campaigns })) });
});
router.post('/', requireAdmin, validate(schema), async (req, res) => {
  const c = await prisma.category.create({ data: { ...req.body, slug: await uniqueSlug(prisma.category, req.body.name) } });
  await audit(req, 'category.create', 'Category', c.id);
  res.status(201).json({ data: c });
});
router.patch('/:id', requireAdmin, validate(schema.partial()), async (req, res) => {
  const c = await prisma.category.update({ where: { id: req.params.id }, data: req.body });
  await audit(req, 'category.update', 'Category', c.id);
  res.json({ data: c });
});
router.delete('/:id', requireAdmin, async (req, res) => {
  if (await prisma.campaign.count({ where: { categoryId: req.params.id } })) throw new AppError(409, 'IN_USE', 'Category has campaigns; move or delete them first');
  await prisma.category.delete({ where: { id: req.params.id } });
  await audit(req, 'category.delete', 'Category', req.params.id);
  res.json({ ok: true });
});
module.exports = router;
