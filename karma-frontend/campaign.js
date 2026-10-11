const detail = document.getElementById('campaignDetail');
const slug = new URLSearchParams(window.location.search).get('slug');

async function renderCampaign() {
  if (!slug) {
    detail.innerHTML = '<div class="error-state">Campaign not found.</div>';
    return;
  }
  detail.innerHTML = '<div class="skeleton-card"></div>';
  try {
    const campaign = await window.Karma.apiFetch(`/campaigns/${slug}`);
    const percent = window.Karma.calcPercent(campaign.raised || 0, campaign.goal || 1);
    detail.innerHTML = '';

    const imageWrap = document.createElement('div');
    imageWrap.style.gridColumn = '1 / -1';
    const image = document.createElement('img');
    image.src = (campaign.images && campaign.images[0]) || 'https://images.unsplash.com/photo-1469571486292-0ba58a3f068b?auto=format&fit=crop&w=1200&q=80';
    image.alt = campaign.title;
    image.style.width = '100%';
    image.style.maxHeight = '440px';
    image.style.objectFit = 'cover';
    image.style.borderRadius = '24px';
    imageWrap.appendChild(image);
    detail.appendChild(imageWrap);

    const main = document.createElement('article');
    main.className = 'panel';
    main.innerHTML = '<p class="kicker">' + (campaign.category ? campaign.category.name : 'Community') + '</p>';
    const headline = document.createElement('h1');
    headline.style.fontFamily = 'Georgia, serif';
    headline.style.fontSize = 'clamp(2.2rem, 5vw, 4rem)';
    headline.textContent = campaign.title;
    main.appendChild(headline);

    const summary = document.createElement('p');
    summary.className = 'muted';
    summary.textContent = campaign.summary;
    main.appendChild(summary);

    const stats = document.createElement('div');
    stats.style.display = 'grid';
    stats.style.gridTemplateColumns = 'repeat(3, minmax(0,1fr))';
    stats.style.gap = '0.9rem';
    const raised = document.createElement('div');
    raised.className = 'card';
    raised.innerHTML = '<strong>Raised</strong><div>' + window.Karma.formatMoney(campaign.raised || 0, campaign.currency || 'KES') + '</div>';
    const goal = document.createElement('div');
    goal.className = 'card';
    goal.innerHTML = '<strong>Goal</strong><div>' + window.Karma.formatMoney(campaign.goal || 0, campaign.currency || 'KES') + '</div>';
    const people = document.createElement('div');
    people.className = 'card';
    people.innerHTML = '<strong>People helped</strong><div>' + (campaign.peopleHelped || 0) + '</div>';
    stats.appendChild(raised); stats.appendChild(goal); stats.appendChild(people);
    main.appendChild(stats);

    const story = document.createElement('div');
    story.style.marginTop = '1rem';
    story.innerHTML = '<h3>Story</h3><p>' + (campaign.story || '') + '</p>';
    main.appendChild(story);

    const cta = document.createElement('div');
    cta.style.marginTop = '1rem';
    const link = document.createElement('a');
    link.className = 'btn btn-primary';
    link.href = `/donate.html?campaign=${encodeURIComponent(campaign.slug)}`;
    link.textContent = 'Donate to this campaign';
    cta.appendChild(link);
    main.appendChild(cta);
    detail.appendChild(main);

    const aside = document.createElement('aside');
    aside.className = 'panel';
    const location = document.createElement('p');
    location.innerHTML = '<strong>Location</strong><br>' + (campaign.location || 'Kenya');
    aside.appendChild(location);
    const status = document.createElement('p');
    status.innerHTML = '<strong>Status</strong><br>' + (campaign.status || 'ACTIVE');
    aside.appendChild(status);
    const beneficiary = document.createElement('p');
    beneficiary.innerHTML = '<strong>Beneficiary</strong><br>' + (campaign.beneficiary || 'Community members');
    aside.appendChild(beneficiary);
    const donors = document.createElement('div');
    donors.innerHTML = '<h3>Recent donors</h3>';
    const donorList = campaign.recentDonors || [];
    if (!donorList.length) {
      const none = document.createElement('p');
      none.className = 'muted';
      none.textContent = 'No donations yet. Be the first to contribute.';
      donors.appendChild(none);
    } else {
      donorList.slice(0, 5).forEach((donor) => {
        const item = document.createElement('div');
        item.style.padding = '0.7rem 0';
        item.style.borderTop = '1px solid rgba(62,39,35,0.08)';
        const donorName = document.createElement('div');
        donorName.textContent = donor.name;
        const amount = document.createElement('div');
        amount.className = 'muted';
        amount.textContent = `${donor.name} • ${window.Karma.formatMoney(donor.amount || 0, donor.currency || 'KES')}`;
        item.appendChild(donorName); item.appendChild(amount);
        donors.appendChild(item);
      });
    }
    aside.appendChild(donors);
    detail.appendChild(aside);
  } catch (error) {
    detail.innerHTML = '<div class="error-state">Campaign details could not be loaded.</div>';
  }
}

renderCampaign();
