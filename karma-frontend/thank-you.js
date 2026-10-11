const ref = new URLSearchParams(window.location.search).get('reference');
const copy = document.getElementById('thankYouCopy');
const status = document.getElementById('thankYouStatus');

async function pollStatus() {
  if (!ref) {
    copy.textContent = 'No donation reference was provided.';
    return;
  }
  try {
    const donation = await window.Karma.apiFetch(`/donations/${ref}`);
    if (donation && donation.status === 'PENDING') {
      status.textContent = 'Status: Pending payment confirmation';
    } else if (donation && donation.status === 'COMPLETED') {
      status.textContent = `Status: Completed • ${window.Karma.formatMoney(donation.amount || 0, donation.currency || 'KES')}`;
      copy.textContent = 'Your donation is confirmed and the campaign has been funded.';
    } else if (donation && donation.status === 'FAILED') {
      status.textContent = 'Status: Payment failed';
      copy.textContent = 'Your donation could not be completed. Please try again.';
    }
  } catch (error) {
    status.textContent = 'We are confirming your donation. Please refresh in a moment.';
  }
}

pollStatus();
setInterval(pollStatus, 4000);
