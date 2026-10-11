const logger = require('../logger');
class AppError extends Error {
  constructor(status, code, message, details) { super(message); this.status = status; this.code = code; this.details = details; }
}
const notFound = (_req, res) => res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Route not found' } });
const prismaMap = { P2002: [409, 'CONFLICT', 'Already exists'], P2025: [404, 'NOT_FOUND', 'Not found'], P2003: [422, 'INVALID_REFERENCE', 'Related record does not exist'] };
function errorHandler(err, _req, res, _next) {
  if (err.type === 'entity.parse.failed') err = new AppError(400, 'BAD_JSON', 'Malformed JSON body');
  if (prismaMap[err.code]) { const [s, c, m] = prismaMap[err.code]; err = new AppError(s, c, m); }
  const status = err.status || 500;
  if (status >= 500) logger.error(err);
  res.status(status).json({ error: { code: err.code || 'INTERNAL', message: status >= 500 ? 'Something went wrong' : err.message, details: err.details } });
}
module.exports = { AppError, notFound, errorHandler };
