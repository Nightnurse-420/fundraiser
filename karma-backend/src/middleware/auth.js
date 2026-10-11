const jwt = require('jsonwebtoken');
const config = require('../config');
const { AppError } = require('./error');
function readUser(req) {
  const t = req.cookies && req.cookies.karma_token;
  if (!t) return null;
  try { return jwt.verify(t, config.jwtSecret); } catch { return null; }
}
const optionalAdmin = (req, _res, next) => { req.user = readUser(req); next(); };
// Cookie auth + double-submit CSRF token (x-csrf-token header must equal karma_csrf cookie) on unsafe methods.
const requireAdmin = (req, _res, next) => {
  const u = readUser(req);
  if (!u || u.role !== 'ADMIN') return next(new AppError(401, 'UNAUTHORIZED', 'Login required'));
  if (!['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
    const c = req.cookies.karma_csrf, h = req.get('x-csrf-token');
    if (!c || !h || c !== h) return next(new AppError(403, 'CSRF', 'Invalid CSRF token'));
  }
  req.user = u;
  next();
};
module.exports = { optionalAdmin, requireAdmin };
