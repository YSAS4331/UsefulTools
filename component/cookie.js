(() => {
  const STORAGE_KEY = 'USEFUL_cookie';

  // すでに同意ずみなら何もしない
  const state = localStorage.getItem(STORAGE_KEY);
  if (state !== null) return;

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
    borderRadius: '6px',

    color: 'var(--text)',
    fontFamily: `'Inter', 'Noto Sans JP', sans-serif`,
    lineHeight: '1.6',

    zIndex: '9999',
    boxSizing: 'border-box',
    opacity: '0',
    transition: 'opacity .25s ease, transform .25s ease',
    backdropFilter: 'blur(4px)'
  });

  // 中身の構造
  // アイコン + テキスト + ボタン群
  parent.innerHTML = `
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

  // アイコンスタイル
  const icon = parent.querySelector('.material-symbols-outlined');
  if (icon) {
    Object.assign(icon.style, {
      fontSize: '1.5rem',
      flexShrink: '0',
      marginTop: '0.1rem',
      color: 'color-mix(in srgb, var(--accentBlack) 90%, black 10%)'
    });
  }

  // テキストとボタンコンテナ
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

  // ボタン: accept は既存の button:not(.nostyle) スタイルが乗る前提
  const acceptBtn = parent.querySelector('.cookie-accept');
  if (acceptBtn) {
    Object.assign(acceptBtn.style, {
      // ここでは最小限だけ。見た目はグローバル CSS に任せる
      paddingInline: '0.75rem',
      whiteSpace: 'nowrap'
    });
  }

  // 詳細リンク風ボタン（nostyle でベーススタイル解除前提）
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

  // 閉じる処理
  const closeBanner = () => {
    parent.style.opacity = '0';
    parent.style.transform = 'translate(-50%, 12px)';
    setTimeout(() => {
      parent.remove();
    }, 260);
  };

  // 同意ボタン
  if (acceptBtn) {
    acceptBtn.addEventListener('click', () => {
      localStorage.setItem(STORAGE_KEY, 'accepted');
      closeBanner();
    });
  }

  // 詳細ボタン（必要ならリンク先を変えて）
  if (moreBtn) {
    moreBtn.addEventListener('click', () => {
      // ここ、主のサイトのポリシーページに差し替え推奨
      window.open('/privacy', '_blank', 'noopener');
    });
  }

  // DOM に追加してからフェードイン
  document.body.appendChild(parent);
  requestAnimationFrame(() => {
    parent.style.opacity = '1';
    parent.style.transform = 'translate(-50%, 0)';
  });
})();
