const { request, app, prisma, reset, adminAgent } = require('./helpers');
beforeEach(reset);
afterAll(() => prisma.$disconnect());

test('public can list categories', async () => {
  await prisma.category.create({ data: { name: 'Education', slug: 'education' } });
  const res = await request(app).get('/api/v1/categories');
  expect(res.status).toBe(200);
  expect(res.body.data[0].name).toBe('Education');
});
test('anonymous cannot create', async () => {
  expect((await request(app).post('/api/v1/categories').send({ name: 'X Cat' })).status).toBe(401);
});
test('admin creates, updates, and deletes a category', async () => {
  const { agent, csrf } = await adminAgent();
  const c = await agent.post('/api/v1/categories').set('x-csrf-token', csrf).send({ name: 'Water & Sanitation' });
  expect(c.status).toBe(201);
  expect(c.body.data.slug).toBe('water-and-sanitation');
  const id = c.body.data.id;
  expect((await agent.patch(`/api/v1/categories/${id}`).set('x-csrf-token', csrf).send({ description: 'Clean water' })).status).toBe(200);
  expect((await agent.delete(`/api/v1/categories/${id}`).set('x-csrf-token', csrf)).status).toBe(200);
});
test('cannot delete a category that has campaigns', async () => {
  const { agent, csrf } = await adminAgent();
  const cat = await prisma.category.create({ data: { name: 'Health', slug: 'health' } });
  await prisma.campaign.create({ data: { title: 'Clinic', slug: 'clinic', summary: 'A clinic summary', story: 'A long enough story here', goal: 100000, categoryId: cat.id } });
  const res = await agent.delete(`/api/v1/categories/${cat.id}`).set('x-csrf-token', csrf);
  expect(res.status).toBe(409);
});
