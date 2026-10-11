const app = require('./app');
const config = require('./config');
const logger = require('./logger');
const prisma = require('./db');
const server = app.listen(config.port, () => logger.info(`${config.brand} API on :${config.port}`));
const stop = async () => { server.close(); await prisma.$disconnect(); process.exit(0); };
process.on('SIGTERM', stop);
process.on('SIGINT', stop);
