const router = require('express').Router();
const prisma = require('../db');
const { requireAdmin } = require('../middleware/auth');

router.get('/public', async (_req, res) => {
  const [byCur, donors, active, helped] = await Promise.all([
    prisma.donation.groupBy({ by: ['currency'], where: { status: 'COMPLETED' }, _sum: { amount: true }, _count: true }),
    prisma.donation.groupBy({ by: ['donorId'], where: { status: 'COMPLETED' } }),
    prisma.campaign.count({ where: { status: 'ACTIVE' } }),
    prisma.campaign.aggregate({ where: { status: { in: ['ACTIVE', 'COMPLETED'] } }, _sum: { peopleHelped: true } }),
  ]);
  const raised = Object.fromEntries(byCur.map((r) => [r.currency, r._sum.amount || 0]));
  res.json({ totalRaised: raised.KES || 0, raisedByCurrency: raised, donations: byCur.reduce((n, r) => n + r._count, 0), donors: donors.length, activeCampaigns: active, peopleHelped: helped._sum.peopleHelped || 0 });
});

router.get('/admin', requireAdmin, async (_req, res) => {
  const since = new Date(Date.now() - 30 * 864e5);
  const [byStatus, last30, recent, unread, subs] = await Promise.all([
    prisma.donation.groupBy({ by: ['status'], _count: true }),
    prisma.donation.aggregate({ where: { status: 'COMPLETED', currency: 'KES', completedAt: { gte: since } }, _sum: { amount: true }, _count: true }),
    prisma.donation.findMany({ take: 10, orderBy: { createdAt: 'desc' }, include: { donor: { select: { name: true, email: true } }, campaign: { select: { title: true } } } }),
    prisma.contactMessage.count({ where: { isRead: false } }),
    prisma.subscription.count({ where: { active: true } }),
  ]);
  res.json({ donationsByStatus: Object.fromEntries(byStatus.map((r) => [r.status, r._count])), last30Days: { raisedKES: last30._sum.amount || 0, donations: last30._count }, recentDonations: recent, unreadMessages: unread, activeSubscriptions: subs });
});
module.exports = router;
