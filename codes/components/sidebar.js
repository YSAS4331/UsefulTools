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

.sidebar-search {
  padding: 0 16px 16px;
}

.sidebar-flyout {
  position: fixed;
  z-index: 1100;
  width: 260px;
  max-width: calc(100vw - 84px);
  max-height: calc(100dvh - 24px);
  overflow: auto;
  padding: 12px;
  border: 1px solid var(--border-color);
  border-radius: 10px;
  background: var(--bg-2);
  color: var(--text-primary);
  box-shadow: 0 8px 28px rgb(0 0 0 / 18%);
}

.sidebar-flyout-title {
  margin: 2px 8px 8px;
  color: var(--text-primary);
  font-size: .85rem;
  font-weight: 700;
}

.sidebar-flyout .sidebar-section-list {
  max-height: none;
}

@media (min-width: 601px) {
  app-sidebar.collapsed .sidebar-search,
  app-sidebar.collapsed .sidebar footer {
    display: none;
  }

  app-sidebar.collapsed .sidebar-sections {
    overflow: visible;
  }

  app-sidebar.collapsed .sidebar {
    padding: 24px 0;
  }

  app-sidebar.collapsed .sidebar-section {
    padding: 4px 6px;
  }
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
  display: flex;
  align-items: center;
  gap: .55rem;
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

.sidebar-item-icon {
  width: 1rem;
  height: 1rem;
  flex: 0 0 1rem;
}

.sidebar-item-icon[hidden] {
  display: none;
}

.sidebar-item-title {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
}

.sidebar-section-list a:hover {
  color: var(--text-primary);
  background: var(--bg-hover);
  text-decoration: none;
}

.sidebar a[aria-current="page"] {
  color: var(--text-primary);
  font-weight: bold;
  cursor: default;
  pointer-events: none;
}

.sidebar-section-list a[aria-current="page"] {
  background: color-mix(in srgb, var(--bg-hover) 55%, transparent);
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
  <div class="sidebar-search"><ui-search></ui-search></div>
  <div class="sidebar-sections">
    <section class="sidebar-section" aria-label="お気に入り">
      <ui-collapse label="お気に入り" duration="240ms" easing="ease">
        <span slot="label" class="label-icon"><i data-lucide="heart" aria-hidden="true"></i></span><span slot="label" class="label-text">お気に入り</span>
        <nav class="sidebar-section-list sidebar-favorite-list" aria-live="polite">
          <span class="sidebar-section-empty sidebar-favorite-empty">お気に入りを読み込み中...</span>
        </nav>
      </ui-collapse>
    </section>

    <section class="sidebar-section" aria-label="履歴">
      <ui-collapse label="履歴" duration="240ms" easing="ease">
        <span slot="label" class="label-icon"><i data-lucide="history" aria-hidden="true"></i></span><span slot="label" class="label-text">履歴</span>
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
    this.historyList = this.querySelector('.sidebar-history-list');

    this.sidebarAside = this.querySelector('.sidebar');
    this.flyout = null;
    this.flyoutTimer = null;
    this.handleRailClick = (event) => {
      if (!this.matches('.collapsed') || this.mediaQuery?.matches) return;
      if (event.target.closest('ui-collapse')) return;
      this.classList.remove('collapsed');
    };
    this.sidebarAside.addEventListener('click', this.handleRailClick);

    this.collapses = [...this.querySelectorAll('ui-collapse')];
    this.handleCollapseEnter = (event) => this.showFlyout(event.currentTarget);
    this.handleCollapseLeave = () => this.scheduleFlyoutClose();
    this.handleCollapsedIconClick = (event) => {
      if (!this.mediaQuery?.matches && this.classList.contains('collapsed')) {
        event.preventDefault();
        event.stopPropagation();
      }
    };
    this.collapses.forEach((collapse) => {
      collapse.addEventListener('mouseenter', this.handleCollapseEnter);
      collapse.addEventListener('mouseleave', this.handleCollapseLeave);
      collapse.addEventListener('click', this.handleCollapsedIconClick, true);
    });
    this.favoriteInitToken = 0;
    this.historyInitToken = 0;
    this.favoriteUnsubscribe = null;
    this.historyUnsubscribe = null;
    this.favoriteInitializing = false;
    this.historyInitializing = false;
    this.handleActiveLinkClick = (event) => {
      const link = event.target.closest('a[aria-current="page"]');
      if (link && this.contains(link)) event.preventDefault();
    };
    this.handleRouterEvent = (event) => {
      const type = event.detail?.type;
      if (type === 'setup-ok') {
        this.setupFavorites();
        this.setupHistory();
      } else if (type === 'after') {
        const path = event.detail?.to || location.pathname;
        this.updateActiveLinks(path);
        this.renderFavorites?.(path);
        this.renderHistory?.(path);
        this.recordHistory(path);
      }
    };
    this.handleStorageEvent = (event) => {
      if (event.detail?.key === 'LibDB') {
        this.setupFavorites();
        this.setupHistory();
      } else if (event.detail?.key === 'toolsPromise') {
        this.setupHistory();
      }
    };
    this.addEventListener('click', this.handleActiveLinkClick);
    window.addEventListener('spa:router', this.handleRouterEvent);
    window.addEventListener('spa:storage', this.handleStorageEvent);
    this.updateActiveLinks(location.pathname);
    this.setupFavorites();
    this.setupHistory();

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

  showFlyout(collapse) {
    if (this.mediaQuery.matches || !this.classList.contains('collapsed')) return;

    clearTimeout(this.flyoutTimer);
    this.hideFlyout();

    const section = collapse.closest('.sidebar-section');
    const sourceList = section?.querySelector('.sidebar-section-list');
    if (!section || !sourceList) return;

    const rect = collapse.getBoundingClientRect();
    const flyout = document.createElement('div');
    flyout.className = 'sidebar-flyout';
    flyout.setAttribute('role', 'region');
    flyout.setAttribute('aria-label', section.getAttribute('aria-label') || 'サイドバー');
    flyout.innerHTML = '<div class="sidebar-flyout-title"></div>';
    flyout.querySelector('.sidebar-flyout-title').textContent =
      section.getAttribute('aria-label') || 'メニュー';

    const list = sourceList.cloneNode(true);
    list.classList.remove('sidebar-favorite-list', 'sidebar-history-list');
    flyout.append(list);

    const storage = window.spaRouter?.commonStorage;
    const createIcons = storage?.get('createIcons');
    const icons = storage?.get('lucideIcons');
    if (createIcons && icons) createIcons({ icons, root: flyout });

    flyout.addEventListener('mouseenter', () => clearTimeout(this.flyoutTimer));
    flyout.addEventListener('mouseleave', () => this.scheduleFlyoutClose());
    flyout.addEventListener('click', () => {
      this.scheduleFlyoutClose(80);
    });

    document.body.append(flyout);
    const width = flyout.offsetWidth;
    const height = flyout.offsetHeight;
    const left = Math.min(rect.right + 8, window.innerWidth - width - 8);
    const top = Math.max(12, Math.min(rect.top, window.innerHeight - height - 12));
    Object.assign(flyout.style, {
      left: `${Math.max(8, left)}px`,
      top: `${top}px`
    });

    this.flyout = flyout;
  }

  scheduleFlyoutClose(delay = 140) {
    clearTimeout(this.flyoutTimer);
    this.flyoutTimer = setTimeout(() => this.hideFlyout(), delay);
  }

  hideFlyout() {
    clearTimeout(this.flyoutTimer);
    this.flyoutTimer = null;
    this.flyout?.remove();
    this.flyout = null;
  }

  updateActiveLinks(path = location.pathname) {
    const currentPath = new URL(path, location.origin).pathname.replace(/\/+$/, '') || '/';

    this.querySelectorAll('a[href]').forEach((link) => {
      const linkPath = new URL(link.href, location.origin).pathname.replace(/\/+$/, '') || '/';
      if (linkPath === currentPath) {
        link.setAttribute('aria-current', 'page');
        link.setAttribute('aria-disabled', 'true');
        link.tabIndex = -1;
      } else {
        link.removeAttribute('aria-current');
        link.removeAttribute('aria-disabled');
        link.removeAttribute('tabindex');
      }
    });
  }

  createSectionRenderer({ list, store, emptyClass, emptyText, timestampKey }) {
    const nodes = new Map();
    let emptyMessage = list.querySelector('.' + emptyClass);

    return async (path = location.pathname) => {
      const saved = await store.getAll();
      if (!this.isConnected) return;

      saved.sort((a, b) => (b[timestampKey] ?? 0) - (a[timestampKey] ?? 0));
      const currentPath = new URL(path, location.origin).pathname.replace(/\/+$/, '') || '/';
      const activeIds = new Set(saved.map((item) => String(item.id)));

      for (const [id, link] of nodes) {
        if (!activeIds.has(id)) {
          link.remove();
          nodes.delete(id);
        }
      }

      if (!saved.length) {
        if (!emptyMessage) {
          emptyMessage = document.createElement('span');
          emptyMessage.className = 'sidebar-section-empty ' + emptyClass;
        }
        emptyMessage.textContent = emptyText;
        if (list.firstElementChild !== emptyMessage || list.childElementCount !== 1) {
          list.replaceChildren(emptyMessage);
        }
        return;
      }

      emptyMessage?.remove();
      emptyMessage = null;

      saved.forEach((item, index) => {
        const id = String(item.id);
        let link = nodes.get(id);
        if (!link) {
          link = document.createElement('a');
          const icon = document.createElement('i');
          icon.className = 'sidebar-item-icon';
          icon.setAttribute('aria-hidden', 'true');
          const title = document.createElement('span');
          title.className = 'sidebar-item-title';
          link.append(icon, title);
          nodes.set(id, link);
        }

        const itemPath = new URL(item.url, location.origin).pathname.replace(/\/+$/, '') || '/';
        const title = item.title || item.key || '名称未設定';
        const description = item.description || title;
        const icon = link.querySelector('.sidebar-item-icon');
        const titleElement = link.querySelector('.sidebar-item-title');

        if (link.getAttribute('href') !== item.url) link.href = item.url;
        if (link.title !== description) link.title = description;
        if (titleElement.textContent !== title) titleElement.textContent = title;

        const iconName = typeof item.icon === 'string' ? item.icon.trim() : '';
        if (iconName) {
          if (icon.getAttribute('data-lucide') !== iconName) {
            icon.setAttribute('data-lucide', iconName);
          }
          icon.hidden = false;
        } else {
          icon.removeAttribute('data-lucide');
          icon.hidden = true;
        }

        if (itemPath === currentPath) {
          link.setAttribute('aria-current', 'page');
          link.setAttribute('aria-disabled', 'true');
          link.tabIndex = -1;
        } else {
          link.removeAttribute('aria-current');
          link.removeAttribute('aria-disabled');
          link.removeAttribute('tabindex');
        }

        const current = list.children[index];
        if (current !== link) list.insertBefore(link, current || null);
      });

      const storage = window.spaRouter?.commonStorage;
      const createIcons = storage?.get('createIcons');
      const icons = storage?.get('lucideIcons');
      if (createIcons && icons) createIcons({ icons, root: list });
    };
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
          favorite: { keyPath: 'id' },
          history: { keyPath: 'id' }
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
      const render = this.createSectionRenderer({
        list: this.favoriteList,
        store: favorites,
        emptyClass: 'sidebar-favorite-empty',
        emptyText: 'お気に入りはまだありません。\n気に入ったツールを追加すると、ここに表示されます。',
        timestampKey: 'addedAt'
      });

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


  async setupHistory() {
    const storage = window.spaRouter?.commonStorage;
    if (!storage || !this.historyList || this.historyUnsubscribe || this.historyInitializing) return;
    if (!storage.get('LibDB') || !storage.get('toolsPromise')) return;

    this.historyInitializing = true;
    const token = ++this.historyInitToken;

    try {
      const LibDB = storage.get('LibDB');
      let dbPromise = storage.get('favoriteDBPromise');
      if (!dbPromise) {
        const db = new LibDB('UsefulTools', 'auto', {
          favorite: { keyPath: 'id' },
          history: { keyPath: 'id' }
        });
        dbPromise = db.ready.then(() => db).catch((error) => {
          storage.delete('favoriteDBPromise');
          db.close();
          throw error;
        });
        storage.set('favoriteDBPromise', dbPromise);
      }

      const [db, registry] = await Promise.all([
        dbPromise,
        storage.get('toolsPromise')
      ]);
      if (token !== this.historyInitToken || !this.isConnected) return;

      const history = db.store('history');
      const render = this.createSectionRenderer({
        list: this.historyList,
        store: history,
        emptyClass: 'sidebar-history-empty',
        emptyText: '履歴はまだありません。\nツールを開くと、ここに表示されます。',
        timestampKey: 'visitedAt'
      });

      this.renderHistory = render;
      this.historyUnsubscribe = db.on('change', (event) => {
        if (event.stores?.includes('history')) {
          render().catch((error) => {
            console.error('[sidebar] 履歴一覧の更新に失敗しました。', error);
          });
        }
      });

      await this.recordHistory(location.pathname, registry, db);
      await render();
    } catch (error) {
      if (token === this.historyInitToken && this.isConnected) {
        this.historyList.textContent = '履歴を読み込めませんでした';
      }
      console.error('[sidebar] 履歴の初期化に失敗しました。', error);
    } finally {
      this.historyInitializing = false;
    }
  }

  async recordHistory(path, suppliedRegistry, suppliedDb) {
    if (!path) return;
    const storage = window.spaRouter?.commonStorage;
    if (!storage) return;

    try {
      const [registry, db] = await Promise.all([
        suppliedRegistry ? Promise.resolve(suppliedRegistry) : storage.get('toolsPromise'),
        suppliedDb ? Promise.resolve(suppliedDb) : storage.get('favoriteDBPromise')
      ]);
      const pathname = new URL(path, location.origin).pathname.replace(/\/+$/, '') || '/';
      const tool = Object.entries(registry || {}).map(([key, item]) => ({ key, ...item }))
        .find((item) => (new URL(item.url, location.origin).pathname.replace(/\/+$/, '') || '/') === pathname);
      if (!tool) return;

      const history = db.store('history');
      await history.put({
        id: tool.id,
        key: tool.key || tool.id,
        title: tool.title,
        description: tool.description,
        url: tool.url,
        visitedAt: Date.now()
      });

      const saved = await history.getAll();
      saved.sort((a, b) => (b.visitedAt ?? 0) - (a.visitedAt ?? 0));
      await Promise.all(saved.slice(30).map((item) => history.delete(item.id)));
      await this.renderHistory?.();
    } catch (error) {
      console.error('[sidebar] 履歴の保存に失敗しました。', error);
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
    this.historyInitToken++;
    this.favoriteUnsubscribe?.();
    this.historyUnsubscribe?.();
    this.favoriteUnsubscribe = null;
    this.historyUnsubscribe = null;
    this.renderFavorites = null;
    this.renderHistory = null;
    this.sidebarAside?.removeEventListener('click', this.handleRailClick);
    this.collapses?.forEach((collapse) => {
      collapse.removeEventListener('mouseenter', this.handleCollapseEnter);
      collapse.removeEventListener('mouseleave', this.handleCollapseLeave);
      collapse.removeEventListener('click', this.handleCollapsedIconClick, true);
    });
    this.hideFlyout();
    this.removeEventListener('click', this.handleActiveLinkClick);
    window.removeEventListener('spa:router', this.handleRouterEvent);
    window.removeEventListener('spa:storage', this.handleStorageEvent);
    window.removeEventListener('touchstart', this.handleTouchStart);
    window.removeEventListener('touchmove', this.handleTouchMove);
    window.removeEventListener('touchend', this.handleTouchEnd);
    window.removeEventListener('touchcancel', this.handleTouchEnd);
  }
}

customElements.define('app-sidebar', Side);
