const { AppError } = require('../middleware/error');
// Interface only. Cloudinary implementation is added in the integrations step.
module.exports = {
  async uploadImage() { throw new AppError(501, 'NOT_IMPLEMENTED', 'Image upload not configured yet'); },
  async deleteImage() { /* no-op until configured */ },
};
