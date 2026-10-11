async function initAdminDashboard() {
  try {
    const stats = await window.Karma.apiFetch('/stats/admin');
    document.getElementById('adminDonations').textContent = String(stats.donationsByStatus ? Object.values(stats.donationsByStatus).reduce((n, val) => n + Number(val || 0), 0) : 0);
    document.getElementById('adminMessages').textContent = String(stats.unreadMessages || 0);
    document.getElementById('adminSubscriptions').textContent = String(stats.activeSubscriptions || 0);
    document.getElementById('adminRaised').textContent = window.Karma.formatMoney(stats.last30Days && stats.last30Days.raisedKES ? stats.last30Days.raisedKES : 0, 'KES');
  } catch (error) {
    document.getElementById('adminRaised').textContent = 'KES 0';
  }
}

initAdminDashboard();
