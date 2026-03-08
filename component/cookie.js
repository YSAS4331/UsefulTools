(() => {
  window.dataLayer = window.dataLayer || [];
  function gtag(){ dataLayer.push(arguments); }
  function enableCookie() {gtag('js', new Date());gtag('config', 'G-416K6GDFJP');}

  const STORAGE_KEY = 'USEFUL-cookie';
  const state = localStorage.getItem(STORAGE_KEY);
  if (state !== null) {
    enableCookie();
    return;
  }

  const c = tag => document.createElement(tag);

  // 親コンテナ
  const parent = c('div');
  parent.setAttribute('role', 'dialog');
  parent.setAttribute('aria-live', 'polite');
  parent.setAttribute('aria-label', 'Cookie に関するお知らせ');

  Object.assign(parent.style, {
    position: 'fixed',
    left: '50%',
    bottom: '25px',
    transform: 'translate(-50%, 12px)',
    width: '80vw',
    maxWidth: '600px',
    padding: '1rem 1.25rem',
    display: 'flex',
    alignItems: 'flex-start',
    gap: '0.75rem',

    background: 'color-mix(in srgb, var(--bg) 92%, white 8%)',
    border: '2.5px solid var(--accentBlack)',
    borderRadius: 'var(--radius)',

    color: 'var(--text)',
    fontFamily: `'Inter', 'Noto Sans JP', sans-serif`,
    lineHeight: '1.6',

    zIndex: '9999',
    boxSizing: 'border-box',
    opacity: '0',
    transition: 'opacity .25s ease, transform .25s ease',
    backdropFilter: 'blur(4px)',

    // ★ 追加：close ボタンを absolute で置くため
    position: 'fixed',
  });

  // DOM 構造：close を最上位に移動
  parent.innerHTML = `
    <button class="cookie-close" aria-label="閉じる">
      <span class="material-symbols-outlined">close</span>
    </button>

    <span class="material-symbols-outlined" aria-hidden="true">
      cookie
    </span>

    <div class="cookie-inner">
      <p class="cookie-text">
        このサイトでは、より良い体験のために Cookie を使用しています。<br>
        よろしければ、Cookie の利用にご協力ください。
      </p>
      <div class="cookie-actions">
        <button type="button" class="cookie-accept">
          同意する <i class="fa-solid fa-arrow-right"></i>
        </button>
        <button type="button" class="cookie-more nostyle">
          詳しく見る
        </button>
      </div>
    </div>
  `;

  // ★ close ボタンの右上固定スタイル
  const closeBtn = parent.querySelector('.cookie-close');
  Object.assign(closeBtn.style, {
    position: 'absolute',
    top: '6px',
    right: '6px',
    padding: '4px',
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    color: 'var(--text)',
  });

  closeBtn.onclick = () => closeBanner();

  // アイコンスタイル
  const icon = parent.querySelector('.material-symbols-outlined:not(.cookie-close .material-symbols-outlined)');
  if (icon) {
    Object.assign(icon.style, {
      fontSize: '1.5rem',
      flexShrink: '0',
      marginTop: '0.1rem',
      color: 'color-mix(in srgb, var(--accentBlack) 90%, black 10%)'
    });
  }

  const inner = parent.querySelector('.cookie-inner');
  if (inner) {
    Object.assign(inner.style, {
      display: 'flex',
      flexDirection: 'column',
      gap: '0.5rem',
      width: '100%'
    });
  }

  const actions = parent.querySelector('.cookie-actions');
  if (actions) {
    Object.assign(actions.style, {
      display: 'flex',
      flexWrap: 'wrap',
      gap: '0.5rem',
      marginTop: '0.25rem'
    });
  }

  const acceptBtn = parent.querySelector('.cookie-accept');
  if (acceptBtn) {
    Object.assign(acceptBtn.style, {
      paddingInline: '0.75rem',
      whiteSpace: 'nowrap',
      borderRadius: 'var(--radius)'
    });
  }

  const moreBtn = parent.querySelector('.cookie-more');
  if (moreBtn) {
    Object.assign(moreBtn.style, {
      fontSize: '0.8rem',
      textDecoration: 'underline',
      textUnderlineOffset: '2px',
      cursor: 'pointer',
      padding: '0',
      background: 'none',
      border: 'none',
      color: 'var(--linkColor)'
    });
  }

  const closeBanner = () => {
    parent.style.opacity = '0';
    parent.style.transform = 'translate(-50%, 12px)';
    setTimeout(() => parent.remove(), 260);
  };

  if (acceptBtn) {
    acceptBtn.addEventListener('click', () => {
      localStorage.setItem(STORAGE_KEY, 'accepted');
      enableCookie();
      closeBanner();
    });
  }

  if (moreBtn) {
    moreBtn.addEventListener('click', () => {
      window.open('/UsefulTools/privacy', '_blank', 'noopener');
    });
  }

  document.body.appendChild(parent);
  requestAnimationFrame(() => {
    parent.style.opacity = '1';
    parent.style.transform = 'translate(-50%, 0)';
  });
})();
