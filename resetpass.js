const form = document.querySelector('#reset-password-form');
const message = document.querySelector('#message');

form.addEventListener('submit', async (event) => {
  event.preventDefault();
  const password = document.querySelector('#password').value;
  const confirmation = document.querySelector('#password-confirmation').value;
  const token = new URLSearchParams(location.search).get('token');
  if (!token) { message.textContent = 'This password-reset link is invalid.'; return; }
  if (password !== confirmation) { message.textContent = 'Passwords do not match.'; return; }
  const button = form.querySelector('button');
  button.disabled = true;
  try {
    const response = await fetch('/api/auth/password-reset/confirm', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ token, password }) });
    const result = await readApiResponse(response);
    message.textContent = result.message;
    if (response.ok) { form.reset(); setTimeout(() => window.location.assign('login.html'), 1800); }
  } catch { message.textContent = 'Unable to reset your password right now.'; }
  finally { button.disabled = false; }
});
