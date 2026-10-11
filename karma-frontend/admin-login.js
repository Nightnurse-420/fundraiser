const form = document.getElementById('adminLoginForm');

form.addEventListener('submit', async (event) => {
  event.preventDefault();
  const payload = {
    email: document.getElementById('admin-email').value,
    password: document.getElementById('admin-password').value,
  };
  try {
    const response = await window.Karma.apiFetch('/auth/login', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    sessionStorage.setItem('karma-user', JSON.stringify(response.user || {}));
    if (response.csrfToken) sessionStorage.setItem('karma-csrf', response.csrfToken);
    window.location.href = '/admin-index.html';
  } catch (error) {
    window.alert(error.message || 'Unable to log in.');
  }
});
