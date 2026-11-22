class Side extends HTMLElement {
  connectedCallback() {
    this.innerHTML = \`
<style>
.sidebar {
  width: 100%;
  height: 100%;
  min-height: 0;
  display: flex;
  flex-direction: column;
  box-sizing: border-box;
  padding: 22px 16px 16px;
  overflow: hidden;
  color: var(--text-primary);
  background: rgba(255, 255, 255, .58);
  -webkit-backdrop-filter: blur(28px) saturate(180%);
  backdrop-filter: blur(28px) saturate(180%);
  border-right: 1px solid var(--glass-border-2);
  box-shadow: var(--glass-inner-shadow);
}

.sidebar-brand {
  display: flex;
  align-items: center;
  gap: 11px;
  padding: 2px 8px 22px;
  color: var(--text-primary);
  text-decoration: none;
}
.sidebar-brand:hover {
  text-decoration: none;
}
.sidebar-brand-mark {
  display: grid;
  place-items: center;
  width: 38px;
  height: 38px;
  flex: 0 0 38px;
  border-radius: 12px;
  color: #fff;
  font-size: 20px;
  font-weight: 800;
  background: linear-gradient(145deg, #4ade80, #22c55e);
  box-shadow: 0 4px 12px rgba(34, 197, 94, .22);
}
.sidebar-brand-copy {
  display: flex;
  flex-direction: column;
  gap: 2px;
}
.sidebar-brand-name {
  font-size: 16px;
  font-weight: 800;
  letter-spacing: -.035em;
  line-height: 1.2;
}
.sidebar-brand-caption {
  color: var(--text-tertiary);
  font-size: 10px;
  font-weight: 600;
  letter-spacing: .08em;
}

.sidebar-divider {
  height: 1px;
  flex: 0 0 1px;
  margin: 0 8px;
  background: var(--glass-border-2);
}

.sidebar-favorites {
  display: flex;
  flex: 1;
  flex-direction: column;
  min-height: 0;
  padding: 22px 4px 14px;
}
.sidebar-section-heading {
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 0 8px 12px;
  color: var(--text-secondary);
  font-size: 12px;
  font-weight: 700;
  letter-spacing: .045em;
}
.sidebar-section-icon {
  display: grid;
  place-items: center;
  width: 25px;
  height: 25px;
  border: 1px solid rgba(34, 197, 94, .16);
  border-radius: 8px;
  color: var(--accent-strong);
  background: rgba(74, 222, 128, .10);
  font-size: 13px;
}
.sidebar-favorite-list {
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-height: 0;
  overflow-y: auto;
  overscroll-behavior: contain;
  scrollbar-width: thin;
  scrollbar-color: var(--glass-border-2) transparent;
}
.sidebar-favorite-list a {
  display: flex;
  align-items: center;
  gap: 10px;
  min-width: 0;
  padding: 10px 11px;
  border: 1px solid transparent;
  border-radius: 11px;
  color: var(--text-secondary);
  font-size: 13px;
  font-weight: 550;
  line-height: 1.4;
  text-decoration: none;
  transition: background .18s ease, border-color .18s ease, color .18s ease, transform .18s ease;
}
.sidebar-favorite-list a::before {
  content: "";
  width: 6px;
  height: 6px;
  flex: 0 0 6px;
  border-radius: 50%;
  background: #b8c5bc;
  transition: background .18s ease, box-shadow .18s ease;
}
.sidebar-favorite-list a:hover {
  border-color: rgba(34, 197, 94, .15);
  background: rgba(74, 222, 128, .09);
  color: var(--text-primary);
  text-decoration: none;
}
.sidebar-favorite-list a:hover::before {
  background: var(--accent-strong);
  box-shadow: 0 0 0 3px rgba(34, 197, 94, .12);
}
.sidebar-favorite-list a[aria-current="page"] {
  border-color: rgba(34, 197, 94, .22);
  background: rgba(74, 222, 128, .13);
  color: #16803d;
  font-weight: 700;
}
.sidebar-favorite-list a[aria-current="page"]::before {
  background: var(--accent-strong);
  box-shadow: 0 0 0 3px rgba(34, 197, 94, .14);
}
.sidebar-favorite-title {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.sidebar-favorite-empty {
  margin: 2px 4px;
  padding: 17px 12px;
  border: 1px dashed var(--glass-border-2);
  border-radius: 12px;
  color: var(--text-tertiary);
  font-size: 12px;
  line-height: 1.6;
  text-align: center;
  background: rgba(255, 255, 255, .22);
}

.sidebar footer {
  display: flex;
  flex-direction: column;
  gap: 3px;
  padding: 14px 4px 0;
  border-top: 1px solid var(--glass-border-2);
}
.sidebar footer a {
  display: block;
  padding: 7px 10px;
  border-radius: 8px;
  color: var(--text-tertiary);
  font-size: 11px;
  font-weight: 550;
  text-decoration: none;
  transition: background .18s ease, color .18s ease;
}
.sidebar footer a:hover {
  color: var(--text-secondary);
  background: rgba(255, 255, 255, .38);
  text-decoration: none;
}

@media (max-width: 600px) {
  .sidebar {
    padding: 18px 16px 14px;
    background: rgba(250, 252, 250, .94);
  }
}
</style>
<aside class="sidebar">
  <a class="sidebar-brand" href="/" aria-label="UsefulTools ホーム">
    <span class="sidebar-brand-mark" aria-hidden="true">U</span>
    <span class="sidebar-brand-copy">
      <span class="sidebar-brand-name">UsefulTools</span>
      <span class="sidebar-brand-caption">TOOLS FOR EVERYDAY</span>
    </span>
  </a>

  <div class="sidebar-divider"></div>

  <section class="sidebar-favorites" aria-label="お気に入り">
    <h2 class="sidebar-section-heading">
      <span class="sidebar-section-icon" aria-hidden="true">★</span>
      お気に入り
    </h2>
    <nav class="sidebar-favorite-list" aria-live="polite">
      <span class="sidebar-favorite-empty">お気に入りを読み込み中...</span>
    </nav>
  </section>

  <footer>
    <a href="/terms/">利用規約</a>
    <a href="/privacy/">プライバシーポリシー</a>
    <a href="/sitemap/">サイトマップ</a>
  </footer>
</aside>
    \`;

    this.favoriteList = this.querySelector('.sidebar-favorite-list');
    this.favoriteInitToken = 0;
    this.favoriteUnsubscribe = null;
    this.favoriteInitializing = false;
    this.handleRouterEvent = (event) => {
      if (event.detail?.type === 'setup-ok') this.setupFavorites();
    };
    this.handleStorageEvent = (event) => {
      if (['LibDB', 'toolsPromise'].includes(event.detail?.key)) {
        this.setupFavorites();
      }
    };
    window.addEventListener('spa:router', this.handleRouterEvent);
    window.addEventListener('spa:storage', this.handleStorageEvent);
    this.setupFavorites();

    this.mediaQuery = window.matchMedia('(max-width: 600px)');

    this.width = 0;
    this.startX = 0;
    this.startY = 0;
    this.currentX = 0;
    this.startTime = 0;

    this.isDragging = false;
    this.isHorizontal = false;
    this.isOpen = false;

    this.handleTouchStart = this.onTouchStart.bind(this);
    this.handleTouchMove = this.onTouchMove.bind(this);
    this.handleTouchEnd = this.onTouchEnd.bind(this);

    window.addEventListener('touchstart', this.handleTouchStart, { passive: true });
    window.addEventListener('touchmove', this.handleTouchMove, { passive: false });
    window.addEventListener('touchend', this.handleTouchEnd, { passive: true });
    window.addEventListener('touchcancel', this.handleTouchEnd, { passive: true });
  }

  async setupFavorites() {
    const storage = window.spaRouter?.commonStorage;
    if (!storage || !this.favoriteList || this.favoriteUnsubscribe || this.favoriteInitializing) return;
    if (!storage.get('LibDB') || !storage.get('toolsPromise')) return;

    this.favoriteInitializing = true;
    const token = ++this.favoriteInitToken;

    try {
      const LibDB = storage.get('LibDB');
      const toolsPromise = storage.get('toolsPromise');
      if (!LibDB || !toolsPromise) return;

      let dbPromise = storage.get('favoriteDBPromise');
      if (!dbPromise) {
        const db = new LibDB('UsefulTools', 'auto', {
          favorite: { keyPath: 'id' }
        });
        dbPromise = db.ready.then(() => db).catch((error) => {
          storage.delete('favoriteDBPromise');
          db.close();
          throw error;
        });
        storage.set('favoriteDBPromise', dbPromise);
      }

      const [, db] = await Promise.all([toolsPromise, dbPromise]);
      if (token !== this.favoriteInitToken || !this.isConnected) return;

      const favorites = db.store('favorite');
      const render = async () => {
        const saved = await favorites.getAll();
        if (token !== this.favoriteInitToken || !this.isConnected) return;

        saved.sort((a, b) => (b.addedAt ?? 0) - (a.addedAt ?? 0));
        this.favoriteList.replaceChildren();

        if (!saved.length) {
          const empty = document.createElement('span');
          empty.className = 'sidebar-favorite-empty';
          empty.textContent = 'お気に入りはまだありません。\\n気に入ったツールを追加すると、ここに表示されます。';
          this.favoriteList.append(empty);
          return;
        }

        const currentPath = location.pathname.replace(/\\/+$/, '') || '/';
        for (const favorite of saved) {
          const link = document.createElement('a');
          const favoritePath = new URL(favorite.url, location.origin).pathname.replace(/\\/+$/, '') || '/';
          link.href = favorite.url;
          link.title = favorite.description || favorite.title || favorite.key || '';
          if (favoritePath === currentPath) link.setAttribute('aria-current', 'page');

          const title = document.createElement('span');
          title.className = 'sidebar-favorite-title';
          title.textContent = favorite.title || favorite.key || '名称未設定';
          link.append(title);
          this.favoriteList.append(link);
        }
      };

      await render();
      this.favoriteUnsubscribe = db.on('change', (event) => {
        if (event.stores?.includes('favorite')) {
          render().catch((error) => {
            console.error('[sidebar] お気に入り一覧の更新に失敗しました。', error);
          });
        }
      });
    } catch (error) {
      if (token === this.favoriteInitToken && this.isConnected) {
        this.favoriteList.textContent = 'お気に入りを読み込めませんでした';
      }
      console.error('[sidebar] お気に入りの初期化に失敗しました。', error);
    } finally {
      this.favoriteInitializing = false;
    }
  }

  onTouchStart(e) {
    if (!this.mediaQuery.matches || e.touches.length !== 1) return;

    const touch = e.touches[0];

    this.width = this.offsetWidth;
    this.isOpen = this.classList.contains('open');

    const canOpen = !this.isOpen &&
      touch.clientX <= window.innerWidth * 0.3;

    const canClose = this.isOpen &&
      touch.clientX <= this.width;

    if (!canOpen && !canClose) return;

    this.startX = touch.clientX;
    this.startY = touch.clientY;
    this.currentX = touch.clientX;
    this.startTime = performance.now();

    this.isDragging = true;
    this.isHorizontal = false;

    this.style.transition = 'none';
  }

  onTouchMove(e) {
    if (!this.isDragging || e.touches.length !== 1) return;

    const touch = e.touches[0];

    const diffX = touch.clientX - this.startX;
    const diffY = touch.clientY - this.startY;

    if (!this.isHorizontal) {
      const threshold = this.width * 0.02;

      if (
        Math.abs(diffX) < threshold &&
        Math.abs(diffY) < threshold
      ) return;

      if (Math.abs(diffY) > Math.abs(diffX)) {
        this.isDragging = false;
        this.style.transition = '';
        return;
      }

      this.isHorizontal = true;
    }

    this.currentX = touch.clientX;

    const base = this.isOpen ? 0 : -this.width;

    const moveX = Math.max(
      -this.width,
      Math.min(0, base + diffX)
    );

    this.style.transform = \`translateX(\${moveX}px)\`;

    if (this.isHorizontal && e.cancelable) {
      e.preventDefault();
    }
  }

  onTouchEnd(e) {
    if (!this.isDragging) return;

    this.isDragging = false;

    const diffX = this.currentX - this.startX;
    const elapsed = Math.max(1, performance.now() - this.startTime);
    const velocity = diffX / elapsed;

    const threshold = this.width * 0.3;

    let shouldOpen = this.isOpen;

    if (diffX > threshold || velocity > 0.5) {
      shouldOpen = true;
    } else if (diffX < -threshold || velocity < -0.5) {
      shouldOpen = false;
    }

    this.style.transition = '';
    this.style.transform = '';

    this.classList.toggle('open', shouldOpen);
    this.isOpen = shouldOpen;
  }

  disconnectedCallback() {
    this.favoriteInitToken++;
    this.favoriteUnsubscribe?.();
    this.favoriteUnsubscribe = null;
    window.removeEventListener('spa:router', this.handleRouterEvent);
    window.removeEventListener('spa:storage', this.handleStorageEvent);
    window.removeEventListener('touchstart', this.handleTouchStart);
    window.removeEventListener('touchmove', this.handleTouchMove);
    window.removeEventListener('touchend', this.handleTouchEnd);
    window.removeEventListener('touchcancel', this.handleTouchEnd);
  }
}

customElements.define('app-sidebar', Side);
