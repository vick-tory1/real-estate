const contactForm = document.querySelector('#contact-form');

if (contactForm) {
  const submitButton = document.querySelector('#contact_us');
  const status = document.querySelector('#contact-status');
  const fields = ['name', 'email', 'subject', 'message'];

  const showError = (field, message) => {
    document.querySelector(`#${field}-error`).textContent = message;
  };

  contactForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    document.querySelectorAll('#contact-form .error').forEach((element) => { element.textContent = ''; });
    status.textContent = '';
    const values = Object.fromEntries(new FormData(contactForm));
    let valid = true;
    fields.forEach((field) => {
      if (!values[field]?.trim()) { showError(field, `${field[0].toUpperCase()}${field.slice(1)} is required.`); valid = false; }
    });
    if (values.email && !/^\S+@\S+\.\S+$/.test(values.email)) { showError('email', 'Enter a valid email address.'); valid = false; }
    if (!valid) return;

    submitButton.disabled = true;
    submitButton.textContent = 'Sending…';
    try {
      const response = await fetch('/api/contact-submissions', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(values) });
      const result = await readApiResponse(response);
      if (!response.ok) throw new Error(result.message || 'Unable to send your message.');
      contactForm.reset();
      status.textContent = result.message;
      status.style.color = 'green';
    } catch (error) {
      status.textContent = error.message;
      status.style.color = 'red';
    } finally {
      submitButton.disabled = false;
      submitButton.textContent = 'Send Message';
    }
  });
}
