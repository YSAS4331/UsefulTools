class Side extends HTMLElement {
  connectedCallback() {
    this.innerHTML = `
<style>
:host {
  position: fixed;
  inset: 0 auto 0 0;
  z-index: 1000;
  width: min(280px, 85vw);
  transform: translateX(-100%);
  transition: transform .28s cubic-bezier(.2, .8, .2, 1);
  will-change: transform;
}

:host(.open) {
  transform: translateX(0);
}

.sidebar {
  width: 100%;
  height: 100%;

  background: var(--glass-bg-3);
  backdrop-filter: blur(28px) saturate(180%);

  border-right: 1px solid var(--accent-border);

  box-shadow:
    var(--glass-inner-shadow),
    inset 0 0 14px rgba(255, 255, 255, .35);

  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  align-items: center;

  padding: 24px 0;
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

@media (min-width: 601px) {
  :host {
    position: relative;
    transform: none;
    transition: none;
    width: 240px;
    flex-shrink: 0;
  }
}
</style>

<aside class="sidebar">
  <a href="/">UsefulTools</a>
  <footer>
    <a href="/terms/">利用規約</a>
    <a href="/privacy/">プライバシーポリシー</a>
    <a href="/sitemap/">サイトマップ</a>
  </footer>
</aside>
    `;

    this.mediaQuery = window.matchMedia('(max-width: 600px)');

    this.startX = 0;
    this.startY = 0;
    this.currentX = 0;
    this.startTime = 0;

    this.isDragging = false;
    this.isHorizontal = false;
    this.isOpen = false;

    this.width = this.offsetWidth || 280;

    this.handleTouchStart = this.onTouchStart.bind(this);
    this.handleTouchMove = this.onTouchMove.bind(this);
    this.handleTouchEnd = this.onTouchEnd.bind(this);

    window.addEventListener('touchstart', this.handleTouchStart, { passive: true });
    window.addEventListener('touchmove', this.handleTouchMove, { passive: false });
    window.addEventListener('touchend', this.handleTouchEnd, { passive: true });
    window.addEventListener('touchcancel', this.handleTouchEnd, { passive: true });
  }

  onTouchStart(e) {
    if (!this.mediaQuery.matches || e.touches.length !== 1) return;

    const touch = e.touches[0];
    const x = touch.clientX;

    this.isOpen = this.classList.contains('open');
    this.width = this.offsetWidth || 280;

    // 閉じている場合は画面左端からのみ開始
    const canOpen = !this.isOpen && x <= 24;

    // 開いている場合はサイドバー内から開始
    const canClose = this.isOpen && x <= this.width;

    if (!canOpen && !canClose) return;

    this.startX = x;
    this.startY = touch.clientY;
    this.currentX = x;
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

    // 横方向か縦方向かを判定
    if (!this.isHorizontal) {
      if (Math.abs(diffX) < 5 && Math.abs(diffY) < 5) return;

      if (Math.abs(diffY) > Math.abs(diffX)) {
        this.isDragging = false;
        return;
      }

      this.isHorizontal = true;
    }

    this.currentX = touch.clientX;

    // 開いている場合は0から、閉じている場合は-widthから移動
    const base = this.isOpen ? 0 : -this.width;

    const moveX = Math.max(
      -this.width,
      Math.min(0, base + diffX)
    );

    this.style.transform = `translateX(${moveX}px)`;

    e.preventDefault();
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
    window.removeEventListener('touchstart', this.handleTouchStart);
    window.removeEventListener('touchmove', this.handleTouchMove);
    window.removeEventListener('touchend', this.handleTouchEnd);
    window.removeEventListener('touchcancel', this.handleTouchEnd);
  }
}

customElements.define('app-sidebar', Side);
