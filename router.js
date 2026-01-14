/* shortcut utils */
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const create = e => document.createElement(e);

/* normalize url */
const normalize = url =>
  url.replace(/\/index\.html?$/, '/');

/* state */
let activeStyles = [];
let activeScripts = [];

/* link interceptor */
document.addEventListener('click', e => {
  const a = e.target.closest('a');
  if (!a || !a.href) return;

  const url = new URL(a.href);
  if (url.origin !== location.origin || a.target === '_blank') return;

  const to = normalize(url.href);
  const from = normalize(location.href);
  if (to === from) return;

  e.preventDefault();
  navigate(url.pathname);
});

/* router core */
async function navigate(path, push = true) {
  if (!path) return;

  const main = $('main');
  main.classList.add('load');

  try {
    const res = await fetch(path);
    if (!res.ok) throw new Error(res.status);

    const baseUrl = res.url;
    const html = await res.text();
    const doc = new DOMParser().parseFromString(html, 'text/html');

    cleanup();
    swapMain(doc);
    syncTitle(doc);
    loadStyles(doc, baseUrl);
    await loadScripts(doc, baseUrl);

    if (push) history.pushState(null, '', path);
    window.scrollTo(0, 0);

    $('main').classList.remove('load');
  } catch (err) {
    console.error('Nav failed:', err);
    if (push) location.href = path;
  }
}

/* swap content — ★バグ修正済み */
function swapMain(doc) {
  const cur = $('main');        // 現在の main
  const next = $('main', doc);  // 新しい main

  if (cur && next) cur.replaceWith(next);
}

/* sync title */
function syncTitle(doc) {
  document.title = doc.title;
}

/* inject styles */
function loadStyles(doc, base) {
  const links = $$('link[data-page]', doc);

  links.forEach(l => {
    const link = create('link');
    link.rel = 'stylesheet';
    link.href = new URL(l.getAttribute('href'), base).href;
    link.dataset.page = '';

    document.head.appendChild(link);
    activeStyles.push(link);
  });
}

/* inject scripts */
async function loadScripts(doc, base) {
  const scripts = $$('script[data-page][src]', doc);

  for (const s of scripts) {
    const src = new URL(s.getAttribute('src'), base).href;
    try {
      const mod = await import(src);
      activeScripts.push(mod);
    } catch (err) {
      console.error('Script error:', src, err);
    }
  }
}

/* remove assets */
function cleanup() {
  activeStyles.forEach(l => l.remove());
  activeStyles = [];
  activeScripts = [];
}

/* back/forward */
window.addEventListener('popstate', () => {
  navigate(location.pathname, false);
});

/* init */
window.addEventListener('DOMContentLoaded', () => {
  loadStyles(document, location.href);
  loadScripts(document, location.href);
});
