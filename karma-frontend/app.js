const API_BASE = window.KARMA_API || 'http://localhost:4000/api/v1';
const state = {
  lang: localStorage.getItem('karma-lang') || 'en',
  locale: 'en-KE',
};

function setLang(lang) {
  state.lang = lang;
  localStorage.setItem('karma-lang', lang);
  document.documentElement.lang = lang;
  document.querySelectorAll('[data-i18n]').forEach((node) => {
    const key = node.dataset.i18n;
    if (window.lang && window.lang[lang] && window.lang[lang][key]) {
      node.textContent = window.lang[lang][key];
    }
  });
}

function formatMoney(amount, currency = 'KES') {
  const numeric = Number(amount || 0) / 100;
  return new Intl.NumberFormat('en-KE', {
    style: 'currency',
    currency,
    maximumFractionDigits: currency === 'KES' ? 0 : 2,
  }).format(numeric);
}

function formatCompactAmount(value, currency = 'KES') {
  const numeric = Number(value || 0) / 100;
  return new Intl.NumberFormat('en-KE', { style: 'currency', currency, maximumFractionDigits: 0 }).format(numeric);
}

function formatDate(dateString) {
  if (!dateString) return '—';
  const date = new Date(dateString);
  return Number.isNaN(date.getTime()) ? '—' : new Intl.DateTimeFormat('en-KE', { day: 'numeric', month: 'short', year: 'numeric' }).format(date);
}

function calcPercent(raised, goal) {
  if (!goal) return 0;
  return Math.min(100, Math.round((raised / goal) * 100));
}

function safeText(value) {
  return String(value ?? '').trim();
}

function createCardSkeletons(count = 3) {
  return Array.from({ length: count }, () => {
    const card = document.createElement('div');
    card.className = 'skeleton-card';
    return card;
  });
}

window.Karma = window.Karma || {};
window.Karma.createCardSkeletons = createCardSkeletons;

async function apiFetch(path, options = {}) {
  const url = path.startsWith('http') ? path : `${API_BASE}${path}`;
  const headers = { ...(options.headers || {}) };
  if (options.body && !headers['Content-Type'] && !(options.body instanceof FormData)) {
    headers['Content-Type'] = 'application/json';
  }
  if (!options.method || options.method === 'GET') {
    headers.Accept = 'application/json';
  }
  const csrf = sessionStorage.getItem('karma-csrf');
  const isAdminAction = options.method && options.method !== 'GET';
  if (isAdminAction && csrf) headers['x-csrf-token'] = csrf;
  const response = await fetch(url, {
    ...options,
    headers,
    credentials: 'include',
  });
  const contentType = response.headers.get('content-type') || '';
  let payload = null;
  if (contentType.includes('application/json')) {
    payload = await response.json();
  } else if (response.status !== 204) {
    payload = await response.text();
  }
  if (!response.ok) {
    const error = payload && payload.error ? payload.error : { code: 'REQUEST_FAILED', message: 'Something went wrong.' };
    if (response.status === 401 || response.status === 403) {
      sessionStorage.removeItem('karma-user');
      window.location.href = '/admin-login.html';
    }
    throw new Error(error.message || 'Request failed');
  }
  return payload && payload.data !== undefined ? payload.data : payload;
}

function setToast(message, type = 'info') {
  const existing = document.querySelector('.toast');
  if (existing) existing.remove();
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.setAttribute('role', 'status');
  toast.textContent = message;
  document.body.appendChild(toast);
  setTimeout(() => toast.remove(), 3000);
}

function addFooter() {
  document.body.insertAdjacentHTML('beforeend', `
    <footer class="site-footer">
      <div class="container footer-grid">
        <div>
          <div class="brand"><svg class="brand-mark" viewBox="0 0 64 64" aria-hidden="true"><path d="M32 8c9 0 16 7 16 16 0 11-8 19-16 24-8-5-16-13-16-24 0-9 7-16 16-16Zm0 9c-4 0-7 3-7 7 0 5 3 9 7 11 4-2 7-6 7-11 0-4-3-7-7-7Z" fill="currentColor"/><circle cx="32" cy="8" r="5" fill="#c96d4a"/></svg><span>Karma</span></div>
          <p class="muted" style="margin-top: 1rem; max-width: 26rem;">For the people. We turn small acts into lasting relief for families, schools, clinics and communities across Kenya.</p>
        </div>
        <div>
          <h3>Explore</h3>
          <div class="footer-links">
            <a href="/index.html">Home</a>
            <a href="/campaigns.html">Campaigns</a>
            <a href="/impact.html">Impact</a>
            <a href="/how-it-works.html">How it works</a>
          </div>
        </div>
        <div>
          <h3>Support</h3>
          <div class="footer-links">
            <a href="/donate.html">Give now</a>
            <a href="/get-help.html">Get help</a>
            <a href="/contact.html">Contact</a>
            <a href="/faq.html">FAQ</a>
          </div>
        </div>
        <div>
          <h3>Legal</h3>
          <div class="footer-links">
            <a href="/privacy.html">Privacy</a>
            <a href="/terms.html">Terms</a>
            <a href="/about.html">About</a>
            <a href="/admin-login.html">Admin</a>
          </div>
        </div>
      </div>
      <div class="container copyfoot">© 2025 Karma. Built for everyday generosity.</div>
    </footer>
  `);
}

function addHeader() {
  const navItems = `
    <div class="topbar"><div class="container topbar"><span>For the people</span><span>Kenya • community funding with dignity</span></div></div>
    <div class="container nav-inner">
      <a href="/index.html" class="brand" aria-label="Karma home">
        <svg class="brand-mark" viewBox="0 0 64 64" aria-hidden="true"><path d="M32 8c9 0 16 7 16 16 0 11-8 19-16 24-8-5-16-13-16-24 0-9 7-16 16-16Zm0 9c-4 0-7 3-7 7 0 5 3 9 7 11 4-2 7-6 7-11 0-4-3-7-7-7Z" fill="currentColor"/><circle cx="32" cy="8" r="5" fill="#c96d4a"/></svg>
        <span>Karma</span>
      </a>
      <nav class="site-nav" aria-label="Primary navigation">
        <a href="/index.html">Home</a>
        <a href="/campaigns.html">Campaigns</a>
        <a href="/impact.html">Impact</a>
        <a href="/how-it-works.html">How it works</a>
        <a href="/about.html">About</a>
        <a href="/contact.html">Contact</a>
      </nav>
      <div style="display:flex; align-items:center; gap:0.75rem;">
        <button class="lang-toggle" type="button" data-lang-toggle="en">EN</button>
        <button class="lang-toggle" type="button" data-lang-toggle="sw">SW</button>
        <a class="btn btn-primary" href="/donate.html">Give now</a>
      </div>
    </div>
  `;
  const container = document.createElement('header');
  container.className = 'site-header';
  container.innerHTML = navItems;
  document.body.prepend(container);
  document.querySelectorAll('[data-lang-toggle]').forEach((button) => {
    button.addEventListener('click', () => setLang(button.dataset.langToggle));
  });
}

window.lang = {
  en: {
    home: 'Home',
    campaigns: 'Campaigns',
    impact: 'Impact',
    forum: 'How it works',
    donate: 'Give now',
    about: 'About',
    contact: 'Contact',
  },
  sw: {
    home: 'Nyumbani',
    campaigns: 'Mikakati',
    impact: 'Matokeo',
    forum: 'Jinsi inavyofanya kazi',
    donate: 'Changia sasa',
    about: 'Kuhusu',
    contact: 'Wasiliana',
  }
};

function loadCampaignsPage() {}
function loadCampaignPage() {}
function loadDonationPage() {}
function loadThankYouPage() {}
function initAdminLogin() {}

document.addEventListener('DOMContentLoaded', () => {
  addHeader();
  addFooter();
  setLang(state.lang);
  if (document.querySelector('[data-page="home"]')) loadHomePage();
  if (document.querySelector('[data-page="campaigns"]')) loadCampaignsPage();
  if (document.querySelector('[data-page="campaign"]')) loadCampaignPage();
  if (document.querySelector('[data-page="donate"]')) loadDonationPage();
  if (document.querySelector('[data-page="thank-you"]')) loadThankYouPage();
  if (document.querySelector('[data-page="admin-login"]')) initAdminLogin();
  if (document.querySelector('[data-page="admin-dashboard"]')) initAdminDashboard();
});

async function loadHomePage() {
  const totalRaised = document.querySelector('[data-role="total-raised"]');
  const donorCount = document.querySelector('[data-role="donor-count"]');
  const campaignCount = document.querySelector('[data-role="campaign-count"]');
  const peopleHelped = document.querySelector('[data-role="people-helped"]');
  const categoryTiles = document.querySelector('#categoryTiles');
  const featured = document.querySelector('#featuredCampaigns');

  try {
    const publicStats = await apiFetch('/stats/public');
    totalRaised.textContent = formatCompactAmount(publicStats.totalRaised || 0, 'KES');
    donorCount.textContent = new Intl.NumberFormat('en-KE').format(publicStats.donors || 0);
    campaignCount.textContent = new Intl.NumberFormat('en-KE').format(publicStats.activeCampaigns || 0);
    peopleHelped.textContent = new Intl.NumberFormat('en-KE').format(publicStats.peopleHelped || 0);
  } catch (error) {
    totalRaised.textContent = 'KES 0';
  }

  try {
    const categories = await apiFetch('/categories');
    categoryTiles.innerHTML = '';
    categories.slice(0, 8).forEach((category) => {
      const tile = document.createElement('a');
      tile.href = `/campaigns.html?category=${encodeURIComponent(category.slug)}`;
      tile.className = 'category-tile';
      tile.innerHTML = `
        <div class="category-icon">${renderCategoryIcon(category.name)}</div>
        <h3 style="margin: 1rem 0 0.2rem;">${safeText(category.name)}</h3>
        <p class="muted">${safeText(category.description || 'People helping people.')}</p>
      `;
      categoryTiles.appendChild(tile);
    });
  } catch (error) {
    categoryTiles.innerHTML = '<div class="empty-state">Categories are unavailable right now.</div>';
  }

  try {
    const campaigns = await apiFetch('/campaigns?sort=most_funded&limit=3');
    if (!campaigns || !campaigns.length) {
      featured.innerHTML = '<div class="empty-state">There are no featured campaigns right now.</div>';
      return;
    }
    featured.innerHTML = '';
    campaigns.forEach((campaign) => {
      const card = document.createElement('article');
      card.className = 'card campaign-card';
      const image = campaign.images && campaign.images[0] ? campaign.images[0] : 'https://images.unsplash.com/...';
      card.innerHTML = `
        <img class="campaign-image" src="${image}" alt="${safeText(campaign.title)}" loading="lazy" />
        <div class="badge">${safeText(campaign.category ? campaign.category.name : 'Community')}</div>
        <h3 style="margin: 1rem 0 0.5rem;">${safeText(campaign.title)}</h3>
        <p class="muted">${safeText(campaign.summary)}</p>
        <div class="progress-wrap">
          <div style="display:flex; justify-content:space-between; font-size:0.85rem; margin-bottom:0.35rem;">
            <span>${formatMoney(campaign.raised || 0, campaign.currency)}</span>
            <span>${calcPercent(campaign.raised || 0, campaign.goal)}%</span>
          </div>
          <div class="tree-ring" style="--percent:${calcPercent(campaign.raised || 0, campaign.goal)}; width:100%; height:12px; border-radius:999px; background: rgba(109,76,65,0.12); overflow:hidden; position:relative;">
            <span style="position:absolute; inset:0; width:${calcPercent(campaign.raised || 0, campaign.goal)}%; background:linear-gradient(135deg,#c96d4a,#d7a153); border-radius:999px;"></span>
          </div>
        </div>
        <div style="margin-top:1rem; display:flex; justify-content:space-between; align-items:center;">
          <span class="muted">Goal: ${formatMoney(campaign.goal || 0, campaign.currency)}</span>
          <a class="btn btn-secondary" href="/campaign.html?slug=${encodeURIComponent(campaign.slug)}">Read story</a>
        </div>
      `;
      featured.appendChild(card);
    });
  } catch (error) {
    featured.innerHTML = '<div class="error-state">We could not load featured campaigns.</div>';
  }
}

function renderCategoryIcon(name = '') {
  const lower = name.toLowerCase();
  const map = {
    education: '<svg viewBox="0 0 24 24" fill="none"><path d="M12 3 2 8l10 5 10-5-10-5Zm-8 7 8 4 8-4M6 11v4c0 1.7 2.7 3 6 3s6-1.3 6-3v-4" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    health: '<svg viewBox="0 0 24 24" fill="none"><path d="M12 21s-7-4.4-7-10A4 4 0 0 1 12 8a4 4 0 0 1 7 3c0 5.6-7 10-7 10Zm-1-9v2h2v-2h-2Zm0 0V9h2v3h-2Z" stroke="currentColor" stroke-width="1.8"/></svg>',
    emergency: '<svg viewBox="0 0 24 24" fill="none"><path d="M12 2 5 12h5l-1 10 9-11h-5l2-9Z" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/></svg>',
    water: '<svg viewBox="0 0 24 24" fill="none"><path d="M12 2c2.8 3.7 6 6.4 6 10.2A6 6 0 0 1 6 12.2C6 8.4 9.2 5.7 12 2Zm-4 12h8" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>',
    food: '<svg viewBox="0 0 24 24" fill="none"><path d="M5 10h14M7 10V7.5A2.5 2.5 0 0 1 9.5 5h5A2.5 2.5 0 0 1 17 7.5V10M7 10v8h10v-8" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    housing: '<svg viewBox="0 0 24 24" fill="none"><path d="M4 11.5 12 5l8 6.5V18a2 2 0 0 1-2 2h-3v-6H9v6H6a2 2 0 0 1-2-2v-6.5Z" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/></svg>',
    environment: '<svg viewBox="0 0 24 24" fill="none"><path d="M12 3c2 4 6 5 6 9a6 6 0 0 1-12 0c0-4 4-5 6-9Zm0 4c-1.4 2.5-3 3.9-3 5.7A3 3 0 0 0 12 16a3 3 0 0 0 3-3.3C15 10.9 13.4 9.5 12 7Z" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    community: '<svg viewBox="0 0 24 24" fill="none"><path d="M8 11a3 3 0 1 1 0-6 3 3 0 0 1 0 6Zm8 0a3 3 0 1 1 0-6 3 3 0 0 1 0 6ZM3 18c0-2.7 2.5-4 5-4s5 1.3 5 4v1H3v-1Zm15 0c0-2.1 1.8-3.3 4-3.7v4.7h-4Z" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/></svg>',
    orphan: '<svg viewBox="0 0 24 24" fill="none"><path d="M12 3.5A4.5 4.5 0 0 1 16.5 8v1.5h-9V8A4.5 4.5 0 0 1 12 3.5ZM7.5 10.5h9v6.5a2 2 0 0 1-2 2h-5a2 2 0 0 1-2-2v-6.5Z" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/></svg>',
  };
  return map[lower] || map.community;
}

function getQueryParam(name) {
  const params = new URLSearchParams(window.location.search);
  return params.get(name);
}

function buildStatusLabel(status) {
  if (!status) return 'Open';
  return status.replace('_', ' ');
}

window.Karma = {
  API_BASE: API_BASE,
  apiFetch,
  formatMoney,
  formatDate,
  calcPercent,
  createCardSkeletons,
  setLang,
};
