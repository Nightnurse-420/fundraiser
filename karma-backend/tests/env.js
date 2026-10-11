process.env.NODE_ENV = 'test';
process.env.WEBHOOK_SECRET = 'test-secret';
process.env.JWT_SECRET = 'test-jwt-secret';
process.env.PAYMENT_PROVIDER = 'mock';
if (process.env.TEST_DATABASE_URL) process.env.DATABASE_URL = process.env.TEST_DATABASE_URL;
