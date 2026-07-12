/* shortcut utils */
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const create = (e) => document.createElement(e);
const event = (detail) =>
  window.dispatchEvent(new CustomEvent("spa:router", { detail }));

/* ---- debug ---- */
const DEBUG = { on: false };
const log = (...args) => {
  if (DEBUG.on) console.log(...args);
};

/* ---- normalize ---- */
function normalize(input) {
  const u = new URL(input, location.href);
  u.hash = "";
  u.searchParams.sort();
  return u.pathname + u.search;
}

/* state */
let activeStyles = [];
let activeModules = [];
let navId = 0;
let navController; // ナビゲーション専用（prefetchとは分離）
let isNavigating = false;

const MAX_HTML_CACHE = 30;
const MAX_SCROLL_ENTRIES = 100;
const htmlCache = new Map(); // LRU: Map の挿入順を利用
const scrollMap = new Map();
const executedOnceScripts = new Set();

const TRANSITION_TIMEOUT = 600;
const FETCH_RETRY_COUNT = 1;
const FETCH_RETRY_DELAY = 400;

/* beforeEach ガード（true / パス文字列 / false を返す） */
let beforeEachHook = null;

const waitTransition = (el) =>
  new Promise((resolve) => {
    if (!el) return resolve();
    let done = false;
    const timeoutMs = Number(el.dataset.transitionTimeout) || TRANSITION_TIMEOUT;
    const finish = (e) => {
      // 子要素からバブリングしてきたtransitionendは無視する
      if (e && e.target !== el) return;
      if (!done) {
        done = true;
        el.removeEventListener("transitionend", finish);
        resolve();
      }
    };
    el.addEventListener("transitionend", finish);
    setTimeout(finish, timeoutMs);
  });

/* ---- baseUrl ---- */
function deriveBaseUrl(responseUrl) {
  const u = new URL(responseUrl);
  const last = u.pathname.split("/").pop();

  if (last.includes(".")) {
    u.pathname = u.pathname.substring(0, u.pathname.lastIndexOf("/") + 1);
  } else if (!u.pathname.endsWith("/")) {
    u.pathname += "/";
  }

  u.search = "";
  u.hash = "";

  return u.href;
}

function resolveBase(doc, responseUrl) {
  const baseEl = $("base[href]", doc);
  if (baseEl) {
    return new URL(baseEl.getAttribute("href"), responseUrl).href;
  }
  return deriveBaseUrl(responseUrl);
}

/* ---- LRUライクなキャッシュ操作 ---- */
function cacheSet(map, key, value, max) {
  if (map.has(key)) map.delete(key);
  map.set(key, value);
  if (map.size > max) {
    const oldestKey = map.keys().next().value;
    map.delete(oldestKey);
  }
}

function cacheGet(map, key) {
  if (!map.has(key)) return undefined;
  const value = map.get(key);
  // touch: 末尾に移動して最近使用扱いにする
  map.delete(key);
  map.set(key, value);
  return value;
}

/* ---- fetch html（リトライ付き） ---- */
async function fetchWithRetry(key, signal, attemptsLeft) {
  try {
    const res = await fetch(key, { signal });
    if (!res.ok) throw new Error(res.status);
    return res;
  } catch (err) {
    if (err.name === "AbortError") throw err;
    if (attemptsLeft <= 0) throw err;
    await new Promise((r) => setTimeout(r, FETCH_RETRY_DELAY));
    return fetchWithRetry(key, signal, attemptsLeft - 1);
  }
}

async function fetchPage(pathWithQuery, { signal, useCache = true } = {}) {
  const key = normalize(pathWithQuery);
  log("[fetchPage] key:", key);

  if (useCache) {
    const cached = cacheGet(htmlCache, key);
    if (cached) {
      log("[fetchPage] cache hit:", key);
      const doc = new DOMParser().parseFromString(cached.html, "text/html");
      return { doc, baseUrl: resolveBase(doc, cached.responseUrl), responseUrl: cached.responseUrl };
    }
  }

  const res = await fetchWithRetry(key, signal, FETCH_RETRY_COUNT);
  log("[fetchPage] response:", res.url);

  const html = await res.text();

  cacheSet(htmlCache, key, { html, responseUrl: res.url }, MAX_HTML_CACHE);

  const doc = new DOMParser().parseFromString(html, "text/html");
  return { doc, baseUrl: resolveBase(doc, res.url), responseUrl: res.url };
}

/* prefetch専用（ナビゲーションのAbortControllerとは独立） */
function prefetchPage(pathWithQuery) {
  const controller = new AbortController();
  return fetchPage(pathWithQuery, { signal: controller.signal }).catch(() => {});
}

/* キャッシュ破棄 */
function invalidateCache(pathWithQuery) {
  if (pathWithQuery) {
    htmlCache.delete(normalize(pathWithQuery));
  } else {
    htmlCache.clear();
  }
}

/* ---- プログレスバー ---- */
let progressEl = null;
let progressTimer = null;

function ensureProgressEl() {
  if (progressEl) return progressEl;
  progressEl = create("div");
  progressEl.id = "spa-progress";
  Object.assign(progressEl.style, {
    position: "fixed",
    top: "0",
    left: "0",
    height: "2px",
    width: "0%",
    background: "var(--spa-progress-color, #2563eb)",
    zIndex: "9999",
    transition: "width 200ms ease-out, opacity 200ms ease-out",
    opacity: "0",
  });
  document.body.appendChild(progressEl);
  return progressEl;
}

function startProgress() {
  const el = ensureProgressEl();
  clearTimeout(progressTimer);
  el.style.transition = "none";
  el.style.width = "0%";
  el.style.opacity = "1";
  requestAnimationFrame(() => {
    el.style.transition = "width 400ms ease-out, opacity 200ms ease-out";
    el.style.width = "70%";
  });
}

function finishProgress(success = true) {
  const el = ensureProgressEl();
  if (success) {
    el.style.width = "100%";
    progressTimer = setTimeout(() => {
      el.style.opacity = "0";
      el.style.width = "0%";
    }, 200);
  } else {
    el.style.opacity = "0";
    el.style.width = "0%";
  }
}

/* link interceptor */
document.addEventListener("click", (e) => {
  const a = e.target.closest("a");
  if (!a || !a.href) return;

  const url = new URL(a.href);
  const to = normalize(url.href);
  const from = normalize(location.href);

  log("[click]", "from:", from, "to:", to);

  if (
    url.origin !== location.origin ||
    a.target === "_blank" ||
    a.hasAttribute("download") ||
    e.metaKey ||
    e.ctrlKey ||
    e.shiftKey ||
    e.altKey
  )
    return;

  if (url.hash && to === from) {
    e.preventDefault();
    location.hash = url.hash;
    return;
  }

  if (to === from) return;

  // 遷移中の連打は無視し、最新のクリックのみ有効にする（navIdで自然に処理されるが
  // 念のためUI上のフィードバックも早める）
  e.preventDefault();
  navigate(to, true, url.hash);
});

/* スクロール位置を常時記録 */
let scrollTimer;
window.addEventListener(
  "scroll",
  () => {
    clearTimeout(scrollTimer);
    scrollTimer = setTimeout(() => {
      cacheSet(scrollMap, normalize(location.href), scrollY, MAX_SCROLL_ENTRIES);
    }, 100);
  },
  { passive: true }
);

/* ---- router core ---- */
async function navigate(pathWithQuery, push = true, hash = "") {
  if (!pathWithQuery) return;

  const key = normalize(pathWithQuery);
  const from = normalize(location.href);

  log("[navigate]", "from:", from, "to:", key);

  // beforeEach ガード
  if (typeof beforeEachHook === "function") {
    let result;
    try {
      result = await beforeEachHook(key, from);
    } catch (err) {
      console.error("beforeEach hook failed:", err);
      result = true;
    }
    if (result === false) {
      log("[navigate] blocked by beforeEach:", key);
      return;
    }
    if (typeof result === "string" && normalize(result) !== key) {
      return navigate(result, push);
    }
  }

  const id = ++navId;

  navController?.abort();
  navController = new AbortController();

  cacheSet(scrollMap, normalize(location.href), scrollY, MAX_SCROLL_ENTRIES);

  event({ type: "before", from, to: key, isPop: !push });

  const main = $("main");
  document.body.classList.add("load");
  isNavigating = true;
  startProgress();

  const pTransition = waitTransition(main);
  const pFetch = fetchPage(key, { signal: navController.signal });

  try {
    const [{ doc, baseUrl, responseUrl }] = await Promise.all([pFetch, pTransition]);

    if (id !== navId) return;

    const nextMain = $("main", doc);
    if (!main || !nextMain) {
      document.body.classList.remove("load");
      isNavigating = false;
      finishProgress(false);
      console.error("Nav failed: <main> not found (from or to page)");
      event({ type: "error", from, to: key, reason: "missing-main" });
      showErrorPage();
      return;
    }

    const nextScripts = $$("page-script[src]", doc);
    const nextStyleLinks = $$("link[data-page]", doc);

    cleanup();

    const adopted = document.adoptNode(nextMain);
    main.replaceWith(adopted);

    document.title = doc.title;
    syncMeta(doc);

    await loadStyles(nextStyleLinks, baseUrl);

    if (push) history.pushState(null, "", key + hash);

    if (hash) {
      const target = document.getElementById(hash.slice(1));
      if (target) {
        target.scrollIntoView();
      } else {
        window.scrollTo(0, 0);
      }
    } else {
      const scroll = push ? 0 : (cacheGet(scrollMap, key) ?? 0);
      window.scrollTo(0, scroll);
    }

    requestAnimationFrame(async () => {
      document.body.classList.remove("load");
      isNavigating = false;
      finishProgress(true);
      await loadPageScripts(nextScripts, baseUrl, responseUrl);
    });

    event({ type: "after", from, to: key, isPop: !push });
  } catch (err) {
    if (err.name === "AbortError") return;
    isNavigating = false;
    finishProgress(false);
    console.error("Nav failed:", err);
    event({ type: "error", from, to: key, reason: String(err) });
    showErrorPage();
  }
}

/* ---- スタイル差分管理（読み込み完了を待つ） ---- */
function loadStyles(nextStyleLinks, base) {
  const nextHrefs = new Set();

  nextStyleLinks.forEach((l) => {
    const href = new URL(l.getAttribute("href"), base).href;
    nextHrefs.add(href);
  });

  $$("link[data-page]").forEach((existing) => {
    if (!nextHrefs.has(existing.href)) {
      existing.remove();
    }
  });

  const newActiveStyles = [];
  const loadPromises = [];

  nextHrefs.forEach((href) => {
    let existing = null;
    for (const el of $$("link[data-page]")) {
      if (el.href === href) {
        existing = el;
        break;
      }
    }

    if (!existing) {
      existing = create("link");
      existing.rel = "stylesheet";
      existing.href = href;
      existing.dataset.page = "";
      loadPromises.push(
        new Promise((resolve) => {
          existing.addEventListener("load", resolve, { once: true });
          existing.addEventListener("error", resolve, { once: true });
        })
      );
      document.head.appendChild(existing);
    }

    newActiveStyles.push(existing);
  });

  activeStyles = newActiveStyles;
  return Promise.all(loadPromises);
}

/* onceスクリプトのキー */
function getScriptKey(rawHref) {
  const u = new URL(rawHref);
  return u.origin + u.pathname;
}

/* ---- ページスクリプト読み込み（script と同じ挙動） ---- */
async function loadPageScripts(scriptElements, base, responseUrl) {
  for (const s of scriptElements) {
    const raw = s.getAttribute("src");

    let resolved;
    if (raw.startsWith("/")) {
      resolved = new URL(raw, location.origin);
    } else {
      resolved = new URL(raw, responseUrl);
    }

    log("[script]", raw, "→", resolved.href);

    const isOnce = s.hasAttribute("once");
    const scriptKey = getScriptKey(resolved.href);

    if (isOnce && executedOnceScripts.has(scriptKey)) continue;

    if (!isOnce) {
      resolved.searchParams.set("t", performance.now());
    }

    try {
      const mod = await import(resolved.href);
      activeModules.push(mod);
      mod.init?.();
      if (isOnce) executedOnceScripts.add(scriptKey);
    } catch (err) {
      console.error("Script load failed:", resolved.href, err);
    }
  }
}

/* cleanup */
function cleanup() {
  activeModules.forEach((m) => {
    try {
      m.unmount?.();
    } catch (err) {
      console.error("Unmount failed:", err);
    }
  });
  activeModules = [];
  activeStyles = [];
}

/* meta同期 */
function syncMeta(doc) {
  const selectors = [
    'meta[name="description"]',
    'meta[property="og:title"]',
    'meta[property="og:description"]',
    'meta[property="og:image"]',
  ];

  selectors.forEach((sel) => {
    const next = $(sel, doc);
    const current = $(sel);

    if (next && current) {
      current.setAttribute("content", next.getAttribute("content"));
    } else if (next && !current) {
      document.head.appendChild(document.adoptNode(next));
    } else if (!next && current) {
      current.remove();
    }
  });
}

/* error page */
function showErrorPage() {
  const main = $("main");
  if (!main) return location.reload();

  main.innerHTML = `
    <section class="router-error">
      <h1>Navigation failed</h1>
      <p>ページの読み込みに失敗しました</p>
      <button type="button" data-router-reload>Reload</button>
    </section>
  `;
  $("[data-router-reload]", main)?.addEventListener("click", () => location.reload());
  document.body.classList.remove("load");
}

/* back/forward */
window.addEventListener("popstate", () => {
  const to = normalize(location.href);
  log("[popstate]", "to:", to);
  navigate(to, false);
});

/* prefetch on hover（mouseenterはバブリングしないため対象リンクのみで発火） */
document.addEventListener(
  "mouseenter",
  (e) => {
    const a = e.target.closest?.("a");
    if (!a || !a.href) return;
    if (a.hasAttribute("data-no-prefetch")) return;

    const url = new URL(a.href);
    if (url.origin !== location.origin) return;

    const to = normalize(url.href);
    log("[prefetch]", "to:", to);

    prefetchPage(to);
  },
  { capture: true }
);

/* ---- init ---- */
window.addEventListener("DOMContentLoaded", () => {
  activeStyles = $$("link[data-page]");
  history.replaceState(null, "", normalize(location.href) + location.hash);

  const initBase = resolveBase(document, location.href);
  log("[init]", "base:", initBase);

  loadPageScripts($$("page-script[src]"), initBase, location.href);
});

/* 外部公開 */
window.spaRouter = {
  navigate,
  invalidateCache,
  debug: DEBUG, // window.spaRouter.debug.on = true; で有効化
  beforeEach(fn) {
    beforeEachHook = fn;
  },
  isNavigating: () => isNavigating,
};
