/* shortcut utils */
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const create = e => document.createElement(e);
const event = options => window.dispatchEvent(new CustomEvent('spa:router', { detail: options }));

/* normalize url */
const normalize = url =>
  url.replace(/index(\.html)?$/, '');

/* state */
let activeStyles = [];
let activeScripts = [];

/* wait for transition */
const waitTransition = el =>
  new Promise(resolve => {
    let done = false;

    const finish = () => {
      if (!done) {
        done = true;
        resolve();
      }
    };

    el.addEventListener('transitionend', finish, { once: true });

    // ★ 300ms 経っても来なかったら強制 resolve
    setTimeout(finish, 300);
  });


/* fetch html */
async function fetchPage(path) {
  const res = await fetch(path);
  if (!res.ok) throw new Error(res.status);

  const html = await res.text();
  const doc = new DOMParser().parseFromString(html, 'text/html');
  return { doc, baseUrl: res.url };
}

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
  
  event({type: 'before'});
  
  const main = $('main');
  document.body.classList.add('load');

  // ★ transition と fetch を同時に開始
  const pTransition = waitTransition(main);
  const pFetch = fetchPage(path);

  try {
    // ★ 両方が揃うまで絶対に書き換えない
    const [{ doc, baseUrl }] = await Promise.all([pFetch, pTransition]);

    cleanup();
    swapMain(doc);
    syncTitle(doc);
    loadStyles(doc, baseUrl);
    await loadScripts(doc, baseUrl);

    if (push) history.pushState(null, '', path);
    window.scrollTo(0, 0);

    document.body.classList.remove('load');

    event({type: 'after'});
  } catch (err) {
    console.error('Nav failed:', JSON.stringify(err));
    if (push) location.href = path;
  }
}

/* swap content */
function swapMain(doc) {
  const cur = $('main');
  const next = $('main', doc);
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
    activeScripts.push(await import(s.src));
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
  activeStyles = $$('link[data-page]');
  loadStyles(document, location.href);
  loadScripts(document, location.href);
});
