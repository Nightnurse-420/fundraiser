require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const { slugify } = require('../src/utils');
const prisma = new PrismaClient();

const CATEGORIES = ['Education', 'Health', 'Emergency Relief', 'Water & Sanitation', 'Food & Hunger', 'Housing', 'Environment', 'Community Projects', 'Orphans & Vulnerable', 'Other'];
// [title, category, goal (KES), location, peopleHelped, summary]
const CAMPAIGNS = [
  ['School Fees for 200 Girls', 'Education', 4000000, 'Kisumu', 200, 'Keep 200 bright girls in school with fees, uniforms, and books.'],
  ['Mobile Clinic for Turkana', 'Health', 9000000, 'Turkana', 3000, 'A mobile clinic bringing maternal care and vaccines to remote villages.'],
  ['Flood Relief in Budalangi', 'Emergency Relief', 6000000, 'Busia', 1200, 'Emergency food, shelter, and clean water for flood-affected families.'],
  ['Clean Water for Kitui Villages', 'Water & Sanitation', 7500000, 'Kitui', 5000, 'Drill and maintain boreholes so families stop walking hours for water.'],
  ['Feed 500 Families in Mathare', 'Food & Hunger', 3000000, 'Nairobi', 2500, 'Monthly food parcels for families facing hunger in Mathare.'],
  ['Homes for Displaced Families', 'Housing', 12000000, 'Narok', 400, 'Build safe, permanent homes for families who lost everything.'],
  ['Plant 50,000 Trees in Mau', 'Environment', 2500000, 'Nakuru', 800, 'Restore the Mau forest and protect the water towers we all depend on.'],
  ['Rebuild the Orphanage Kitchen', 'Orphans & Vulnerable', 1800000, 'Mombasa', 60, 'A safe, clean kitchen to feed 60 children every day.'],
];

async function main() {
  const email = (process.env.ADMIN_EMAIL || 'admin@karma.co.ke').toLowerCase();
  const password = process.env.ADMIN_PASSWORD;
  if (!password || password.length < 10) throw new Error('Set ADMIN_PASSWORD (min 10 chars) in .env before seeding');
  await prisma.user.upsert({ where: { email }, update: {}, create: { email, name: 'Karma Admin', passwordHash: await bcrypt.hash(password, 12) } });

  const cats = {};
  for (const name of CATEGORIES) cats[name] = await prisma.category.upsert({ where: { slug: slugify(name) }, update: {}, create: { name, slug: slugify(name) } });

  const camps = [];
  for (const [title, cat, goalKes, location, peopleHelped, summary] of CAMPAIGNS) {
    camps.push(await prisma.campaign.upsert({
      where: { slug: slugify(title) }, update: {},
      create: { title, slug: slugify(title), summary, story: `${summary}\n\nEvery shilling given through Karma goes directly to this cause. Join us and stand with the people who need it most.`, goal: goalKes * 100, status: 'ACTIVE', location, peopleHelped, images: ['/assets/placeholder.webp'], categoryId: cats[cat].id, startsAt: new Date(), endsAt: new Date(Date.now() + (30 + Math.floor(Math.random() * 90)) * 864e5) },
    }));
  }

  if ((await prisma.donation.count()) === 0) {
    const names = ['Amina Hassan', 'Brian Otieno', 'Cynthia Wanjiru', 'David Kiptoo', 'Esther Achieng', 'Faith Mutua', 'George Kamau', 'Halima Ali', 'Ian Mwangi', 'Joy Naliaka', 'Kevin Odhiambo', 'Lucy Njeri'];
    const donors = [];
    for (let i = 0; i < names.length; i++) {
      donors.push(await prisma.donor.upsert({ where: { email: `donor${i + 1}@example.com` }, update: {}, create: { email: `donor${i + 1}@example.com`, name: names[i], phone: `07${10000000 + i * 1111}`.slice(0, 10), consentAt: new Date() } }));
    }
    const amounts = [100, 250, 500, 1000, 2500, 5000];
    for (let i = 0; i < 30; i++) {
      const camp = i % 9 === 8 ? null : camps[i % camps.length]; // some go to the general fund
      const when = new Date(Date.now() - Math.floor(Math.random() * 60) * 864e5);
      await prisma.donation.create({ data: { reference: `KRM-SEED-${String(i + 1).padStart(3, '0')}`, amount: amounts[i % amounts.length] * 100, method: i % 3 ? 'MPESA' : 'CARD', status: 'COMPLETED', anonymous: i % 5 === 0, message: i % 4 === 0 ? 'Keep up the great work!' : null, campaignId: camp && camp.id, donorId: donors[i % donors.length].id, createdAt: when, completedAt: when } });
    }
    const sums = await prisma.donation.groupBy({ by: ['campaignId'], where: { status: 'COMPLETED', campaignId: { not: null } }, _sum: { amount: true } });
    for (const s of sums) await prisma.campaign.update({ where: { id: s.campaignId }, data: { raised: s._sum.amount } });
  }
  console.log('Seeded Karma: admin, categories, campaigns, donations.');
}
main().catch((e) => { console.error(e); process.exit(1); }).finally(() => prisma.$disconnect());
