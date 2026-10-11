module.exports = require('pino')({ level: process.env.NODE_ENV === 'test' ? 'silent' : 'info' });
