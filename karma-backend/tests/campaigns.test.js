const { request, app, prisma, reset, adminAgent } = require('./helpers');
let cat;
beforeEach(async () => { await reset(); cat = await prisma.category.create({ data: { name: 'Health', slug: 'health' } }); });
afterAll(() => prisma.$disconnect());

const payload = (o = {}) => ({ title: 'Build a Clinic', summary: 'A clinic for the village', story: 'Long story about the clinic project', goal: 5000000, status: 'ACTIVE', categoryId: cat.id, ...o });

test('admin creates a campaign with generated slug', async () => {
  const { agent, csrf } = await adminAgent();
  const res = await agent.post('/api/v1/campaigns').set('x-csrf-token', csrf).send(payload());
  expect(res.status).toBe(201);
  expect(res.body.data.slug).toBe('build-a-clinic');
  expect(res.body.data.raised).toBe(0);
});
test('validation errors return 422 with details', async () => {
  const { agent, csrf } = await adminAgent();
  const res = await agent.post('/api/v1/campaigns').set('x-csrf-token', csrf).send({ title: 'x' });
  expect(res.status).toBe(422);
  expect(res.body.error.code).toBe('VALIDATION_ERROR');
});
test('public list hides drafts; supports search and category filter', async () => {
  const { agent, csrf } = await adminAgent();
  await agent.post('/api/v1/campaigns').set('x-csrf-token', csrf).send(payload());
  await agent.post('/api/v1/campaigns').set('x-csrf-token', csrf).send(payload({ title: 'Secret Draft', status: 'DRAFT' }));
  const list = await request(app).get('/api/v1/campaigns');
  expect(list.body.meta.total).toBe(1);
  expect((await request(app).get('/api/v1/campaigns?q=clinic')).body.meta.total).toBe(1);
  expect((await request(app).get('/api/v1/campaigns?q=zzz')).body.meta.total).toBe(0);
  expect((await request(app).get('/api/v1/campaigns?category=health')).body.meta.total).toBe(1);
  expect((await agent.get('/api/v1/campaigns')).body.meta.total).toBe(2);
});
test('campaign detail includes recent donors; drafts 404 publicly', async () => {
  const { agent, csrf } = await adminAgent();
  await agent.post('/api/v1/campaigns').set('x-csrf-token', csrf).send(payload({ title: 'Draft One', status: 'DRAFT' }));
  expect((await request(app).get('/api/v1/campaigns/draft-one')).status).toBe(404);
  await agent.post('/api/v1/campaigns').set('x-csrf-token', csrf).send(payload());
  const res = await request(app).get('/api/v1/campaigns/build-a-clinic');
  expect(res.status).toBe(200);
  expect(res.body.data.recentDonors).toEqual([]);
});
test('campaign with donations cannot be deleted', async () => {
  const { agent, csrf } = await adminAgent();
  const c = (await agent.post('/api/v1/campaigns').set('x-csrf-token', csrf).send(payload())).body.data;
  const donor = await prisma.donor.create({ data: { email: 'a@b.co', name: 'A B', consentAt: new Date() } });
  await prisma.donation.create({ data: { reference: 'R1', amount: 10000, method: 'CARD', donorId: donor.id, campaignId: c.id } });
  expect((await agent.delete(`/api/v1/campaigns/${c.id}`).set('x-csrf-token', csrf)).status).toBe(409);
});
