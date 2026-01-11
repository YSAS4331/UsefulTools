/* shortcut utility function */
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const create = e => document.createElement(e);
// normalize the URL
const normalize = url => url.replace(/\/index\.html?$/, '/').replace(/\/$/, '/');

/* Router MPA & SPA */
let activePageStyles = [];
let activePageScripts = [];

/* override default link behavior */
document.addEventListener('click', e => {
  const a = e.target.closest('a');
  if (!a) return;

  const url = new URL(a.href);
  if (url.origin !== location.origin) return;

  const to = normalize(url.href);
  const from = normalize(location.href);
  if (to === from) return;

  e.preventDefault();
  navigate(url.pathname);
});

/* main transition handler */
async function navigate(path, push = true) {
  if (!path) return;

  const res = await fetch(path);
  const html = await res.text();
  const doc = new DOMParser().parseFromString(html, 'text/html');

  cleanupPageAssets();
  swapMain(doc);
  syncTitle(doc);
  runPageStyles(doc);
  await runPageScripts(doc);

  if (push) history.pushState(null, '', path);
}

/* replace the <main> element */
function swapMain(doc) {
  const next = $('main', doc);
  const cur = $('main');
  cur.replaceWith(next);
}

/* sync document title */
function syncTitle(doc) {
  document.title = doc.title;
}

/* load page-style resources */
function runPageStyles(doc) {
  const links = $$('link[data-page]', doc);

  links.forEach(l => {
    const link = create('link');
    link.rel = 'stylesheet';
    link.href = l.href;
    link.dataset.page = '';

    document.head.appendChild(link);
    activePageStyles.push(link);
  });
}

/* load page-script resources */
async function runPageScripts(doc) {
  const scripts = $$('script[data-page][src]', doc);

  for (const s of scripts) {
    const mod = await import(s.src);
    activePageScripts.push(mod);
  }
}

/* clean up page-specific assets */
function cleanupPageAssets() {
  activePageStyles.forEach(l => l.remove());
  activePageStyles = [];

  // scripts are ES modules; cleanup is optional per module design
  activePageScripts = [];
}

/* handle browser back/forward navigation */
window.addEventListener('popstate', () => {
  navigate(location.pathname, false);
});

/* initial load: apply page assets */
window.addEventListener('DOMContentLoaded', () => {
  runPageStyles(document);
  runPageScripts(document);
});
