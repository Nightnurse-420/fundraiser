const searchInput = document.getElementById('searchInput');
const categoryFilter = document.getElementById('categoryFilter');
const sortSelect = document.getElementById('sortSelect');
const campaignGrid = document.getElementById('campaignGrid');
const campaignEmpty = document.getElementById('campaignEmpty');
const campaignError = document.getElementById('campaignError');
const pagination = document.getElementById('pagination');

const state = {
  page: 1,
  category: '',
  sort: 'newest',
  q: '',
};

function renderCampaignCard(campaign) {
  const card = document.createElement('article');
  card.className = 'card campaign-card';
  const image = campaign.images && campaign.images[0] ? campaign.images[0] : 'https://images.unsplash.com/photo-1469571486292-0ba58a3f068b?auto=format&fit=crop&w=900&q=80';
  const img = document.createElement('img');
  img.className = 'campaign-image';
  img.src = image;
  img.alt = campaign.title;
  img.loading = 'lazy';
  card.appendChild(img);

  const badge = document.createElement('div');
  badge.className = 'badge';
  badge.textContent = campaign.category ? campaign.category.name : 'Community';
  card.appendChild(badge);

  const title = document.createElement('h3');
  title.style.margin = '1rem 0 0.5rem';
  title.textContent = campaign.title;
  card.appendChild(title);

  const summary = document.createElement('p');
  summary.className = 'muted';
  summary.textContent = campaign.summary;
  card.appendChild(summary);

  const location = document.createElement('p');
  location.className = 'muted';
  location.textContent = `📍 ${campaign.location || 'Kenya'}`;
  card.appendChild(location);

  const progress = document.createElement('div');
  progress.className = 'progress-wrap';
  const stats = document.createElement('div');
  stats.style.display = 'flex';
  stats.style.justifyContent = 'space-between';
  const raised = document.createElement('span');
  raised.textContent = window.Karma.formatMoney(campaign.raised || 0, campaign.currency || 'KES');
  const percent = document.createElement('span');
  const pct = window.Karma.calcPercent(campaign.raised || 0, campaign.goal || 1);
  percent.textContent = `${pct}%`;
  stats.appendChild(raised); stats.appendChild(percent);
  progress.appendChild(stats);

  const bar = document.createElement('div');
  bar.style.height = '12px';
  bar.style.borderRadius = '999px';
  bar.style.background = 'rgba(109,76,65,0.12)';
  bar.style.position = 'relative';
  bar.style.overflow = 'hidden';
  const fill = document.createElement('div');
  fill.style.position = 'absolute';
  fill.style.inset = '0 auto 0 0';
  fill.style.width = `${pct}%`;
  fill.style.background = 'linear-gradient(135deg,#c96d4a,#d7a153)';
  fill.style.borderRadius = '999px';
  bar.appendChild(fill); progress.appendChild(bar);
  card.appendChild(progress);

  const meta = document.createElement('div');
  meta.style.marginTop = '1rem';
  meta.style.display = 'flex';
  meta.style.justifyContent = 'space-between';
  meta.style.alignItems = 'center';
  const goal = document.createElement('span');
  goal.className = 'muted';
  goal.textContent = `Goal ${window.Karma.formatMoney(campaign.goal || 0, campaign.currency || 'KES')}`;
  const link = document.createElement('a');
  link.className = 'btn btn-secondary';
  link.href = `/campaign.html?slug=${encodeURIComponent(campaign.slug)}`;
  link.textContent = 'Read story';
  meta.appendChild(goal); meta.appendChild(link);
  card.appendChild(meta);
  return card;
}

async function loadCategories() {
  try {
    const cats = await window.Karma.apiFetch('/categories');
    categoryFilter.innerHTML = '<option value="">All sectors</option>';
    cats.forEach((category) => {
      const option = document.createElement('option');
      option.value = category.slug;
      option.textContent = category.name;
      categoryFilter.appendChild(option);
    });
    if (new URLSearchParams(window.location.search).get('category')) {
      categoryFilter.value = new URLSearchParams(window.location.search).get('category');
    }
  } catch (error) {
    categoryFilter.innerHTML = '<option value="">All sectors</option>';
  }
}

async function loadCampaigns() {
  campaignGrid.innerHTML = '';
  campaignGrid.append(...window.Karma.createCardSkeletons(6));
  campaignError.classList.add('hidden');
  campaignEmpty.classList.add('hidden');

  const params = new URLSearchParams({
    page: String(state.page),
    limit: '12',
    sort: state.sort,
    q: state.q,
  });
  if (state.category) params.set('category', state.category);
  try {
    const response = await window.Karma.apiFetch(`/campaigns?${params.toString()}`);
    campaignGrid.innerHTML = '';
    if (!response.data || !response.data.length) {
      campaignEmpty.classList.remove('hidden');
      return;
    }
    response.data.forEach((campaign) => campaignGrid.appendChild(renderCampaignCard(campaign)));

    const totalPages = response.meta && response.meta.pages ? response.meta.pages : 1;
    pagination.innerHTML = '';
    for (let i = 1; i <= totalPages; i += 1) {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'btn btn-secondary';
      btn.textContent = String(i);
      if (i === state.page) btn.style.background = 'rgba(201,109,74,0.12)';
      btn.addEventListener('click', () => {
        state.page = i;
        loadCampaigns();
      });
      pagination.appendChild(btn);
    }
  } catch (error) {
    campaignGrid.innerHTML = '';
    campaignError.classList.remove('hidden');
  }
}

searchInput.addEventListener('input', () => {
  state.q = searchInput.value.trim();
  state.page = 1;
  loadCampaigns();
});
categoryFilter.addEventListener('change', () => {
  state.category = categoryFilter.value;
  state.page = 1;
  loadCampaigns();
});
sortSelect.addEventListener('change', () => {
  state.sort = sortSelect.value;
  state.page = 1;
  loadCampaigns();
});

loadCategories();
loadCampaigns();
