const { AppError } = require('./error');
module.exports = (schema, src = 'body') => (req, _res, next) => {
  const r = schema.safeParse(req[src]);
  if (!r.success) return next(new AppError(422, 'VALIDATION_ERROR', 'Invalid input', r.error.flatten().fieldErrors));
  req[src] = r.data;
  next();
};
