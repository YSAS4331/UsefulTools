class Side extends HTMLElement {
  connectedCallback() {
    this.innerHTML = `
<style>
.sidebar {
  width: 100%;
  height: 100%;
  min-height: 0;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  padding: 24px 0;
  overflow: hidden;
  color: var(--text-primary);
  background: var(--glass-bg-3);
  backdrop-filter: blur(28px) saturate(180%);
  -webkit-backdrop-filter: blur(28px) saturate(180%);
  border-right: 1px solid var(--border-color);
  box-shadow: var(--glass-inner-shadow);
}

.sidebar > a {
  display: block;
  width: 100%;
  padding: 0 24px 22px;
  color: var(--text-primary);
  font-size: 17px;
  font-weight: 750;
  letter-spacing: -.025em;
  text-decoration: none;
}
.sidebar > a:hover {
  text-decoration: none;
}

.sidebar-favorites {
  width: 100%;
  min-height: 0;
  flex: 1;
  box-sizing: border-box;
  padding: 24px 16px;
}
.sidebar-favorites h2 {
  margin: 0 0 12px;
  color: var(--text-secondary);
  font-size: 13px;
  font-weight: 650;
}
.sidebar-favorite-list {
  display: grid;
  gap: 6px;
  max-height: 100%;
  overflow-y: auto;
  scrollbar-width: thin;
}
.sidebar-favorite-list a {
  display: block;
  overflow: hidden;
  padding: 9px 10px;
  border-radius: 9px;
  color: var(--text-primary);
  font-size: 14px;
  text-overflow: ellipsis;
  white-space: nowrap;
  text-decoration: none;
  transition: background-color .18s ease, color .18s ease;
}
.sidebar-favorite-list a:hover {
  background: var(--glass-bg-2);
  text-decoration: none;
}
.sidebar-favorite-list a[aria-current="page"] {
  background: rgba(0, 0, 0, .045);
  box-shadow: inset 2px 0 var(--accent-border-strong);
  font-weight: 650;
}
.sidebar-favorite-empty {
  color: var(--text-tertiary);
  font-size: 13px;
  line-height: 1.6;
}

.sidebar footer {
  margin-top: auto;
  display: grid;
  grid-template-columns: 1fr;
  gap: 12px;
  justify-items: center;
  width: 100%;
}
.sidebar footer a {
  color: var(--text-tertiary);
  text-decoration: none;
  font-size: 14px;
}
.sidebar footer a:hover {
  text-decoration: underline;
}

@media (max-width: 600px) {
  .sidebar {
    background: var(--bg-2);
  }
}
</style>
<aside class="sidebar">
  <a href="/">UsefulTools</a>

  <section class="sidebar-favorites" aria-label="お気に入り">
    <h2>お気に入り</h2>
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
    `;

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
          empty.textContent = 'お気に入りはまだありません。\n気に入ったツールを追加すると、ここに表示されます。';
          this.favoriteList.append(empty);
          return;
        }

        const currentPath = location.pathname.replace(/\/+$/, '') || '/';
        for (const favorite of saved) {
          const link = document.createElement('a');
          const favoritePath = new URL(favorite.url, location.origin).pathname.replace(/\/+$/, '') || '/';
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

    this.style.transform = `translateX(${moveX}px)`;

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
