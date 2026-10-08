const authForm = document.querySelector('[data-auth-form]');
const status = document.querySelector('[data-auth-status]');

function showStatus(message, type = 'danger') {
  status.textContent = message;
  status.className = `alert alert-${type}`;
  status.hidden = false;
}

if (authForm) {
  authForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    const isRegistration = authForm.dataset.authForm === 'register';
    const data = Object.fromEntries(new FormData(authForm));
    const payload = isRegistration
      ? { fullName: data.fullName, email: data.email, password: data.password, accountType: data.accountType }
      : { email: data.email, password: data.password, accountType: data.accountType };
    const button = authForm.querySelector('button[type="submit"]');
    button.disabled = true;
    try {
      const response = await fetch(`/api/auth/${isRegistration ? 'register' : 'login'}`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload)
      });
      const result = await readApiResponse(response);
      if (!response.ok) throw new Error(result.message || 'Unable to continue.');
      if (isRegistration) {
        showStatus(`${result.message} You can now sign in as a ${result.user.role.toLowerCase()}.`, 'success');
        authForm.reset();
        return;
      }
      if (!result.token || !result.user) throw new Error(result.message || 'The server did not complete sign-in. Please try again.');
      sessionStorage.setItem('estate_auth_token', result.token);
      sessionStorage.setItem('estate_auth_user', JSON.stringify(result.user));
      const destination = result.user.role === 'ADMIN' ? 'admin_dashboard.html' : result.user.role === 'AGENT' ? 'agent_dashboard.html' : 'htmlsur.html';
      window.location.assign(destination);
    } catch (error) {
      showStatus(error.message);
    } finally { button.disabled = false; }
  });
}
