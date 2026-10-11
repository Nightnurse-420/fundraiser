const request = require('supertest');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const prisma = require('../src/db');
const app = require('../src/app');

async function reset() {
  if (!/test/.test(process.env.DATABASE_URL || '')) throw new Error('Refusing to wipe a database whose URL does not contain "test"');
  await prisma.$transaction([
    prisma.auditLog.deleteMany(), prisma.payment.deleteMany(), prisma.subscription.deleteMany(), prisma.donation.deleteMany(),
    prisma.donor.deleteMany(), prisma.campaign.deleteMany(), prisma.category.deleteMany(), prisma.contactMessage.deleteMany(),
    prisma.newsletterSubscriber.deleteMany(), prisma.user.deleteMany(),
  ]);
}
async function adminAgent() {
  await prisma.user.create({ data: { email: 'admin@karma.test', name: 'Admin', passwordHash: await bcrypt.hash('Passw0rd!', 4) } });
  const agent = request.agent(app);
  const res = await agent.post('/api/v1/auth/login').send({ email: 'admin@karma.test', password: 'Passw0rd!' });
  return { agent, csrf: res.body.csrfToken };
}
const sign = (payload) => crypto.createHmac('sha256', 'test-secret').update(JSON.stringify(payload)).digest('hex');
module.exports = { request, app, prisma, reset, adminAgent, sign };
