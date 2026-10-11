const express = require('express');
require('express-async-errors');
const helmet = require('helmet');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const pinoHttp = require('pino-http');
const config = require('./config');
const logger = require('./logger');
const { notFound, errorHandler } = require('./middleware/error');

const app = express();
app.set('trust proxy', 1);
app.use(helmet());
app.use(cors({ origin: config.corsOrigins, credentials: true }));
app.use(pinoHttp({ logger, autoLogging: config.env !== 'test' }));
app.use(express.json({ limit: '100kb', verify: (req, _res, buf) => { req.rawBody = buf; } })); // rawBody for webhook signatures
app.use(cookieParser());

const v1 = express.Router();
v1.use('/auth', require('./routes/auth'));
v1.use('/categories', require('./routes/categories'));
v1.use('/campaigns', require('./routes/campaigns'));
v1.use('/donations', require('./routes/donations'));
v1.use('/stats', require('./routes/stats'));
v1.use('/contact', require('./routes/contact'));
v1.use('/newsletter', require('./routes/newsletter'));
v1.use('/admin', require('./routes/admin'));
v1.use('/webhooks', require('./routes/webhooks'));
app.use('/api/v1', v1);
app.get('/health', (_req, res) => res.json({ ok: true, service: `${config.brand} API` }));

app.use(notFound);
app.use(errorHandler);
module.exports = app;
