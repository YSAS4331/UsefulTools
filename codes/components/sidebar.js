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
  background: var(--bg-2);
  border-right: 1px solid var(--border-color);
}

.sidebar-sections {
  width: 100%;
  min-height: 0;
  flex: 1;
  overflow-y: auto;
  scrollbar-width: thin;
}

.sidebar-section {
  width: 100%;
  box-sizing: border-box;
  padding: 4px 16px;
}

.sidebar-section-list {
  display: grid;
  gap: .2rem;
  max-height: 100%;
  overflow-y: auto;
  scrollbar-width: thin;
}

.sidebar-section-list a {
  display: block;
  overflow: hidden;
  padding: .35rem .65rem;
  border-radius: 6px;
  color: var(--text-secondary);
  font-size: .9rem;
  text-overflow: ellipsis;
  white-space: nowrap;
  text-decoration: none;
  transition: background-color .18s ease, color .18s ease;
}

.sidebar-section-list a:hover {
  color: var(--text-primary);
  background: var(--bg-hover);
  text-decoration: none;
}

.sidebar-section-list a[aria-current="page"] {
  color: var(--text-primary);
  font-weight: bold;
}

.sidebar-section-empty {
  color: var(--text-tertiary);
  font-size: .85rem;
  line-height: 1.6;
  white-space: pre-line;
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
  font-size: .85rem;
}
.sidebar footer a:hover {
  color: var(--text-secondary);
  text-decoration: underline;
}

@media (max-width: 600px) {
  .sidebar {
    background: var(--bg-2);
  }
}
</style>
<aside class="sidebar">
  <div id="searchbar"></div>
  <div class="sidebar-sections">
    <section class="sidebar-section" aria-label="お気に入り">
      <ui-collapse label="お気に入り" duration="240ms" easing="ease">
        <span slot="label"><i data-lucide="heart" aria-hidden="true"></i>お気に入り</span>
        <nav class="sidebar-section-list sidebar-favorite-list" aria-live="polite">
          <span class="sidebar-section-empty sidebar-favorite-empty">お気に入りを読み込み中...</span>
        </nav>
      </ui-collapse>
    </section>

    <section class="sidebar-section" aria-label="履歴">
      <ui-collapse label="履歴" duration="240ms" easing="ease">
        <span slot="label"><i data-lucide="history" aria-hidden="true"></i>履歴</span>
        <nav class="sidebar-section-list sidebar-history-list" aria-live="polite">
          <span class="sidebar-section-empty sidebar-history-empty">履歴を読み込み中...</span>
        </nav>
      </ui-collapse>
    </section>
  </div>

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
      const type = event.detail?.type;
      if (type === 'setup-ok') {
        this.setupFavorites();
      } else if (type === 'after') {
        this.renderFavorites?.();
      }
    };
    this.handleStorageEvent = (event) => {
      if (['LibDB'].includes(event.detail?.key)) {
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
    if (!storage.get('LibDB')) return;

    this.favoriteInitializing = true;
    const token = ++this.favoriteInitToken;

    try {
      const LibDB = storage.get('LibDB');
      if (!LibDB) return;

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

      const db = await dbPromise;
      if (token !== this.favoriteInitToken || !this.isConnected) return;

      const favorites = db.store('favorite');
      const nodes = new Map();
      // Reuse the initial loading placeholder so it is removed when data arrives.
      let emptyMessage = this.favoriteList.querySelector('.sidebar-favorite-empty');

      const render = async () => {
        const saved = await favorites.getAll();
        if (token !== this.favoriteInitToken || !this.isConnected) return;

        saved.sort((a, b) => (b.addedAt ?? 0) - (a.addedAt ?? 0));
        const currentPath = location.pathname.replace(/\/+$/, '') || '/';
        const activeIds = new Set(saved.map((favorite) => String(favorite.id)));

        // Remove only entries that no longer exist.
        for (const [id, link] of nodes) {
          if (!activeIds.has(id)) {
            link.remove();
            nodes.delete(id);
          }
        }

        if (!saved.length) {
          if (!emptyMessage) {
            emptyMessage = document.createElement('span');
            emptyMessage.className = 'sidebar-section-empty sidebar-favorite-empty';
          }
          emptyMessage.textContent = 'お気に入りはまだありません。\n気に入ったツールを追加すると、ここに表示されます。';
          if (this.favoriteList.firstElementChild !== emptyMessage ||
              this.favoriteList.childElementCount !== 1) {
            this.favoriteList.replaceChildren(emptyMessage);
          }
          return;
        }

        // Remove the loading/empty placeholder once at least one favorite exists.
        emptyMessage?.remove();
        emptyMessage = null;
        for (let index = 0; index < saved.length; index++) {
          const favorite = saved[index];
          const id = String(favorite.id);
          let link = nodes.get(id);

          // Create DOM only for newly added favorites.
          if (!link) {
            link = document.createElement('a');
            const title = document.createElement('span');
            title.className = 'sidebar-favorite-title';
            link.append(title);
            nodes.set(id, link);
          }

          const favoritePath = new URL(favorite.url, location.origin).pathname.replace(/\/+$/, '') || '/';
          const title = favorite.title || favorite.key || '名称未設定';
          const description = favorite.description || favorite.title || favorite.key || '';

          if (link.getAttribute('href') !== favorite.url) link.href = favorite.url;
          if (link.title !== description) link.title = description;
          if (link.firstElementChild.textContent !== title) {
            link.firstElementChild.textContent = title;
          }

          if (favoritePath === currentPath) {
            if (link.getAttribute('aria-current') !== 'page') {
              link.setAttribute('aria-current', 'page');
            }
          } else {
            link.removeAttribute('aria-current');
          }

          // Move a node only when its sort position actually changed.
          const current = this.favoriteList.children[index];
          if (current !== link) {
            this.favoriteList.insertBefore(link, current || null);
          }
        }
      };

      this.renderFavorites = render;
      this.favoriteUnsubscribe = db.on('change', (event) => {
        if (event.stores?.includes('favorite')) {
          render().catch((error) => {
            console.error('[sidebar] お気に入り一覧の更新に失敗しました。', error);
          });
        }
      });
      await render();
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
    this.renderFavorites = null;
    window.removeEventListener('spa:router', this.handleRouterEvent);
    window.removeEventListener('spa:storage', this.handleStorageEvent);
    window.removeEventListener('touchstart', this.handleTouchStart);
    window.removeEventListener('touchmove', this.handleTouchMove);
    window.removeEventListener('touchend', this.handleTouchEnd);
    window.removeEventListener('touchcancel', this.handleTouchEnd);
  }
}

customElements.define('app-sidebar', Side);
