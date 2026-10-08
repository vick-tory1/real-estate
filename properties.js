const token = sessionStorage.getItem('estate_auth_token');
const parsePropertyResponse = typeof readApiResponse === 'function'
  ? readApiResponse
  : async (response) => {
    const text = await response.text();
    try { return text ? JSON.parse(text) : {}; }
    catch { return { message: 'The server returned an invalid response. Please try again.' }; }
  };

function requireAgent() {
  if (!token) window.location.assign('login.html');
}

async function request(url, options = {}) {
  const response = await fetch(url, { ...options, headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}`, ...options.headers } });
  const body = await parsePropertyResponse(response);
  if (!response.ok) throw new Error(body.message || 'Something went wrong.');
  return body;
}

const form = document.querySelector('[data-property-form]');
if (form) {
  requireAgent();
  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    const message = document.querySelector('[data-property-message]');
    const button = form.querySelector('button[type="submit"]');
    button.disabled = true;
    try {
      const result = await request('/api/properties', { method: 'POST', body: JSON.stringify(Object.fromEntries(new FormData(form))) });
      message.textContent = result.message;
      message.className = 'form-message success';
      form.reset();
    } catch (error) { message.textContent = error.message; message.className = 'form-message error'; }
    finally { button.disabled = false; }
  });
}

const list = document.querySelector('[data-property-list]');
if (list) {
  requireAgent();
  (async () => {
    try {
      const { properties } = await request('/api/properties/mine');
      list.replaceChildren();
      if (!properties.length) { list.textContent = 'You have not created any listings yet.'; return; }
      for (const property of properties) {
        const item = document.createElement('article');
        item.className = 'listing';
        const title = document.createElement('h2'); title.textContent = property.title;
        const details = document.createElement('p'); details.textContent = `${property.type} · ${property.action} · ₦${Number(property.price).toLocaleString()} · ${property.location}`;
        const select = document.createElement('select');
        ['ACTIVE', 'INACTIVE', 'SOLD', 'RENTED'].forEach((status) => { const option = new Option(status, status, false, status === property.status); select.add(option); });
        select.addEventListener('change', async () => { try { await request(`/api/properties/${property.id}/status`, { method: 'PATCH', body: JSON.stringify({ status: select.value }) }); } catch (error) { alert(error.message); select.value = property.status; } });
        item.append(title, details, select); list.append(item);
      }
    } catch (error) { list.textContent = error.message; }
  })();
}
