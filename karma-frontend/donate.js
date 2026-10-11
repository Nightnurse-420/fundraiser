const form = document.getElementById('donationForm');
const campaignSelect = document.getElementById('campaignSelect');
const campaignTitle = document.getElementById('campaignTitle');
const campaignSummary = document.getElementById('campaignSummary');
const params = new URLSearchParams(window.location.search);
const selectedCampaignSlug = params.get('campaign');

async function loadCampaignOptions() {
  try {
    const campaigns = await window.Karma.apiFetch('/campaigns?limit=20&sort=newest');
    campaigns.forEach((campaign) => {
      const option = document.createElement('option');
      option.value = campaign.slug;
      option.textContent = campaign.title;
      campaignSelect.appendChild(option);
    });
    if (selectedCampaignSlug) {
      campaignSelect.value = selectedCampaignSlug;
      const chosen = campaigns.find((c) => c.slug === selectedCampaignSlug);
      if (chosen) {
        campaignTitle.textContent = chosen.title;
        campaignSummary.textContent = chosen.summary;
      }
    }
  } catch (error) {
    // ignore for general donations
  }
}

campaignSelect.addEventListener('change', () => {
  const selected = campaignSelect.options[campaignSelect.selectedIndex];
  if (!selected || !selected.value) {
    campaignTitle.textContent = 'Karma general fund';
    campaignSummary.textContent = 'Your gift helps where the need is greatest.';
    return;
  }
  campaignTitle.textContent = selected.textContent;
  campaignSummary.textContent = 'Your support will directly fuel this campaign.';
});

form.addEventListener('submit', async (event) => {
  event.preventDefault();
  const formData = {
    amount: Number(document.getElementById('amount').value || 0),
    currency: document.getElementById('currency').value,
    method: document.getElementById('method').value,
    name: document.getElementById('name').value,
    email: document.getElementById('email').value,
    phone: document.getElementById('phone').value,
    message: document.getElementById('message').value,
    anonymous: document.getElementById('anonymous').checked,
    consent: document.getElementById('consent').checked,
    campaignSlug: campaignSelect.value || undefined,
    frequency: 'ONE_TIME',
  };

  try {
    const response = await window.Karma.apiFetch('/donations', {
      method: 'POST',
      body: JSON.stringify(formData),
    });
    const reference = response && response.reference ? response.reference : '';
    if (reference) {
      window.location.href = `/thank-you.html?reference=${encodeURIComponent(reference)}`;
    }
  } catch (error) {
    window.alert(error.message || 'Unable to process donation right now.');
  }
});

loadCampaignOptions();
