const prisma = require('../db');
const config = require('../config');
const logger = require('../logger');
const { AppError } = require('../middleware/error');
const emailService = require('./emailService');
const smsService = require('./smsService');

// Idempotent: only the first successful call flips PENDING/FAILED -> COMPLETED and increments the campaign total.
async function completeDonation(reference, { providerRef, amount, raw } = {}) {
  const result = await prisma.$transaction(async (tx) => {
    const d = await tx.donation.findUnique({ where: { reference } });
    if (!d) throw new AppError(404, 'NOT_FOUND', 'Donation not found');
    if (amount != null && amount !== d.amount) throw new AppError(422, 'AMOUNT_MISMATCH', 'Webhook amount does not match donation');
    const u = await tx.donation.updateMany({
      where: { id: d.id, status: { in: ['PENDING', 'FAILED'] } },
      data: { status: 'COMPLETED', completedAt: new Date() },
    });
    if (u.count === 0) return { done: false, donation: d };
    await tx.payment.upsert({
      where: { donationId: d.id },
      update: { providerRef, rawPayload: raw || undefined },
      create: { donationId: d.id, provider: config.paymentProvider, providerRef, rawPayload: raw || undefined },
    });
    if (d.campaignId) await tx.campaign.update({ where: { id: d.campaignId }, data: { raised: { increment: d.amount } } });
    if (d.frequency === 'MONTHLY') {
      await tx.subscription.create({ data: { donorId: d.donorId, campaignId: d.campaignId, amount: d.amount, currency: d.currency, provider: config.paymentProvider, providerRef } });
    }
    return { done: true, donation: d };
  });
  if (result.done) notify(result.donation.id);
  return result.done;
}

async function failDonation(reference) {
  await prisma.donation.updateMany({ where: { reference, status: 'PENDING' }, data: { status: 'FAILED' } });
}

async function notify(id) {
  try {
    const full = await prisma.donation.findUnique({ where: { id }, include: { donor: true, campaign: true } });
    await Promise.allSettled([emailService.sendDonationReceipt(full), emailService.sendAdminNotification(full), smsService.sendDonationConfirmation(full)]);
  } catch (e) { logger.error(e); }
}

module.exports = { completeDonation, failDonation };
