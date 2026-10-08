const token = sessionStorage.getItem('estate_auth_token');
const requestedRole = document.body.dataset.requiredRole;

function signOut() {
  sessionStorage.removeItem('estate_auth_token');
  sessionStorage.removeItem('estate_auth_user');
  window.location.assign('login.html');
}

async function loadDashboard() {
  if (!token) return signOut();
  try {
    const response = await fetch('/api/auth/me', { headers: { Authorization: `Bearer ${token}` } });
    const result = await readApiResponse(response);
    if (!response.ok || result.user.role !== requestedRole) return signOut();
    document.querySelectorAll('[data-user-name]').forEach((element) => { element.textContent = result.user.fullName; });
    if (requestedRole === 'ADMIN') {
      const overview = await fetch('/api/admin/overview', { headers: { Authorization: `Bearer ${token}` } });
      const data = await readApiResponse(overview);
      if (!overview.ok) throw new Error(data.message);
      document.querySelector('[data-total-users]').textContent = data.users;
      document.querySelector('[data-total-agents]').textContent = data.agents;
      document.querySelector('[data-total-contacts]').textContent = data.contacts;
    } else if (requestedRole === 'AGENT') {
      const overview = await fetch('/api/agent/overview', { headers: { Authorization: `Bearer ${token}` } });
      const data = await readApiResponse(overview);
      if (!overview.ok) throw new Error(data.message);
      document.querySelector('[data-total-properties]').textContent = data.properties.length;
    }
  } catch (error) { signOut(); }
}

document.querySelector('[data-sign-out]')?.addEventListener('click', signOut);

document.querySelector('[data-agent-form]')?.addEventListener('submit', async (event) => {
  event.preventDefault();
  const form = event.currentTarget;
  const message = document.querySelector('[data-agent-message]');
  const button = form.querySelector('button');
  button.disabled = true;
  try {
    const response = await fetch('/api/admin/agents', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify(Object.fromEntries(new FormData(form)))
    });
    const result = await readApiResponse(response);
    message.textContent = result.message;
    message.className = response.ok ? 'form-message success' : 'form-message error';
    if (response.ok) { form.reset(); loadDashboard(); }
  } catch { message.textContent = 'Unable to create the agent account right now.'; message.className = 'form-message error'; }
  finally { button.disabled = false; }
});
loadDashboard();
