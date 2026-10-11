const prisma = require('../db');
module.exports = (req, action, entity, entityId, meta) =>
  prisma.auditLog.create({ data: { userId: (req.user && req.user.sub) || null, action, entity, entityId: entityId || null, meta: meta || undefined } });
