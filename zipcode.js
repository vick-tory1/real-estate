import { routeSelectedState } from './state-map.js';

const form = document.querySelector('#stateForm');
if (form) {
  form.addEventListener('submit', (event) => {
    event.preventDefault();
    const destination = routeSelectedState(document.querySelector('#state').value.trim());
    if (destination) window.location.assign(destination);
    else window.alert('No properties were found for this state. Please try again.');
  });
}
