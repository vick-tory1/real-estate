const forgotForm = document.getElementById('forgotPasswordForm');
const message = document.getElementById('message');

forgotForm.addEventListener('submit', async function (event) {
  event.preventDefault();

  const emailInput = document.getElementById('email').value.trim();
  const button = document.getElementById('submitBtn');
  button.disabled = true;
  try {
    const response = await fetch('/api/auth/password-reset/request', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: emailInput })
    });
    const data = await readApiResponse(response);
    message.textContent = data.message;
    message.className = response.ok ? 'success' : 'error';
    message.classList.remove('hidden');
  } catch (error) { message.textContent = 'Unable to request a password reset right now.'; message.className = 'error'; message.classList.remove('hidden'); }
  finally { button.disabled = false; }
});

