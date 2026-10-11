const { request, app, prisma, reset, sign } = require('./helpers');
let campaign;
beforeEach(async () => {
  await reset();
  const cat = await prisma.category.create({ data: { name: 'Health', slug: 'health' } });
  campaign = await prisma.campaign.create({ data: { title: 'Clinic', slug: 'clinic', summary: 'Fund a clinic', story: 'A long enough story here', goal: 10000000, status: 'ACTIVE', categoryId: cat.id } });
});
afterAll(() => prisma.$disconnect());

const body = (o = {}) => ({ amount: 50000, method: 'MPESA', phone: '0712345678', name: 'Jane Doe', email: 'Jane@Example.com', consent: true, campaignSlug: 'clinic', ...o });
const post = (o) => request(app).post('/api/v1/donations').send(body(o));
const hook = (payload, sig) => request(app).post('/api/v1/webhooks/payment').set('x-karma-signature', sig || sign(payload)).send(payload);

test('creates a PENDING donation and normalises donor email', async () => {
  const res = await post();
  expect(res.status).toBe(201);
  expect(res.body.data.status).toBe('PENDING');
  expect(res.body.data.reference).toMatch(/^KRM-/);
  expect(await prisma.donor.findUnique({ where: { email: 'jane@example.com' } })).toBeTruthy();
});
test('enforces minimum donation (KES 50)', async () => {
  const res = await post({ amount: 4999 });
  expect(res.status).toBe(422);
  expect(res.body.error.code).toBe('BELOW_MINIMUM');
});
test('requires consent and phone for M-Pesa', async () => {
  expect((await post({ consent: false })).status).toBe(422);
  expect((await post({ phone: undefined })).status).toBe(422);
});
test('unknown or draft campaign is refused', async () => {
  expect((await post({ campaignSlug: 'nope' })).status).toBe(404);
});
test('general fund donation (no campaign) is allowed', async () => {
  expect((await post({ campaignSlug: undefined })).status).toBe(201);
});
test('webhook with bad signature is rejected and donation stays pending', async () => {
  const { reference } = (await post()).body.data;
  const res = await hook({ reference, status: 'success' }, 'deadbeef');
  expect(res.status).toBe(401);
  expect((await request(app).get(`/api/v1/donations/${reference}`)).body.data.status).toBe('PENDING');
});
test('verified webhook completes donation and raises campaign total exactly once', async () => {
  const { reference } = (await post()).body.data;
  const ev = { reference, status: 'success', providerRef: 'mpesa_123', amount: 50000 };
  expect((await hook(ev)).status).toBe(200);
  expect((await hook(ev)).status).toBe(200); // replay
  const c = await prisma.campaign.findUnique({ where: { id: campaign.id } });
  expect(c.raised).toBe(50000);
  expect((await request(app).get(`/api/v1/donations/${reference}`)).body.data.status).toBe('COMPLETED');
});
test('webhook amount mismatch is rejected', async () => {
  const { reference } = (await post()).body.data;
  const res = await hook({ reference, status: 'success', amount: 1 });
  expect(res.status).toBe(422);
  expect((await prisma.campaign.findUnique({ where: { id: campaign.id } })).raised).toBe(0);
});
test('failed webhook marks donation FAILED', async () => {
  const { reference } = (await post()).body.data;
  await hook({ reference, status: 'failed' });
  expect((await request(app).get(`/api/v1/donations/${reference}`)).body.data.status).toBe('FAILED');
});
test('admin donation list requires login', async () => {
  expect((await request(app).get('/api/v1/donations')).status).toBe(401);
});
