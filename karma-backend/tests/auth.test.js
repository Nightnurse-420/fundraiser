const { request, app, prisma, reset, adminAgent } = require('./helpers');
beforeEach(reset);
afterAll(() => prisma.$disconnect());

test('login sets cookies and returns csrf token', async () => {
  const { agent, csrf } = await adminAgent();
  expect(csrf).toBeTruthy();
  const me = await agent.get('/api/v1/auth/me');
  expect(me.status).toBe(200);
  expect(me.body.user.email).toBe('admin@karma.test');
});
test('wrong password is rejected', async () => {
  await adminAgent();
  const res = await request(app).post('/api/v1/auth/login').send({ email: 'admin@karma.test', password: 'nope' });
  expect(res.status).toBe(401);
  expect(res.body.error.code).toBe('INVALID_CREDENTIALS');
});
test('/me requires login', async () => {
  expect((await request(app).get('/api/v1/auth/me')).status).toBe(401);
});
test('admin writes without CSRF header are blocked', async () => {
  const { agent } = await adminAgent();
  const res = await agent.post('/api/v1/categories').send({ name: 'Test' });
  expect(res.status).toBe(403);
});
test('logout clears session', async () => {
  const { agent } = await adminAgent();
  await agent.post('/api/v1/auth/logout');
  expect((await agent.get('/api/v1/auth/me')).status).toBe(401);
});
