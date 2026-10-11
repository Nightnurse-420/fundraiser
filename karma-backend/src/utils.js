const crypto = require('crypto');
const slugify = (s) => s.toLowerCase().replace(/&/g, 'and').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 60);
async function uniqueSlug(model, title) {
  const base = slugify(title) || 'item';
  let slug = base;
  while (await model.findUnique({ where: { slug } })) slug = `${base}-${crypto.randomBytes(2).toString('hex')}`;
  return slug;
}
const newReference = () => `KRM-${Date.now().toString(36)}-${crypto.randomBytes(3).toString('hex')}`.toUpperCase();
const csvCell = (v) => {
  let s = v == null ? '' : String(v);
  if (/^[=+\-@]/.test(s)) s = "'" + s; // block CSV formula injection
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};
const toCsv = (rows, cols) => [cols.join(','), ...rows.map((r) => cols.map((c) => csvCell(r[c])).join(','))].join('\n');
module.exports = { slugify, uniqueSlug, newReference, toCsv };
