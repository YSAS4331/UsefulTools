/* shortcut utility function */
const $ = (s,r=document) => r.querySelector(s);
const $$ = (s,r=document) => [...r.querySelectorAll(s)];
const create = e => document.createElement(e);
// normalize the URL
const normalize = url => url.replace(/\/(?:index(?:\.html)?)?(?=[?#]|$)/, '/');

/* Router MPA & SPA */
let activePageStyles = [];

// override default link behavior
document.addEventListener('click', e => {
  const a = e.target.closest('a');
  if (!a) return;

  const url = new URL(a.href);
  if (url.origin !== location.origin) return;

  const to = normalize(url.href);
  const fromPage = normalize(location.href);

  if (to === fromPage) return;

  e.preventDefault();
  navigate(url.pathname);
});

// main transition handler
async function navigate(path, push = true) {
  if (!path) return;

  const res = await fetch(path);
  const html = await res.text();

  const doc = new DOMParser().parseFromString(html, 'text/html');

  cleanupPageStyles();
  swapMain(doc);
  syncTitle(doc);
  runPageStyles(doc);
  await runPageScripts(doc);

  if (push) history.pushState(null, '', path);
}

// replace the <main> element
function swapMain(doc) {
  const next = $('main', doc);
  const cur = $('main');

  cur.replaceWith(next);
}

// sync document title
function syncTitle(doc) {
  document.title = doc.title;
}

// load page-style resources
function runPageStyles(doc) {
  const styles = $$('page-style[href]', doc);

  styles.forEach(ps => {
    const link = create('link');
    link.rel = 'stylesheet';
    link.href = ps.getAttribute('href');
    link.dataset.pageStyle = '';

    document.head.appendChild(link);
    activePageStyles.push(link);
  });
}

// clean up styles from the previous page
function cleanupPageStyles() {
  activePageStyles.forEach(l => l.remove());
  activePageStyles = [];
}

// load page-script resources
async function runPageScripts(doc) {
  const scripts = $$('page-script[src]', doc);
  for (const ps of scripts) {
    await import(ps.getAttribute('src'));
  }
}

// handle browser back/forward navigation
window.addEventListener('popstate', () => {
  navigate(location.pathname, false)
})
