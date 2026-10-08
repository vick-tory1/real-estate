const page = document.querySelector('[data-legacy-page]');
if (page) {
  document.title = `${page.dataset.legacyPage} | Real Estate`;
  page.querySelector('[data-title]').textContent = page.dataset.legacyPage;
}
