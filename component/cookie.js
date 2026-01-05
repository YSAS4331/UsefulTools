(() => {
  const state = localStorage.getItem('USEFUL_cookie');
  if (state !== null) return;

  const c = e => document.createElement(e);

  const parent = c('div');

  parent.innerHTML = `
    <span class="material-symbols-outlined">cookie</span>
  `;
})();
