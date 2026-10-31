class Side extends HTMLElement {
  connectedCallback() {
    this.innerHTML = `
<style>
.sidebar {
  width: 100%;
  height: 100%;

  background: var(--glass-bg-3);
  backdrop-filter: blur(28px) saturate(180%);

  border-right: 1px solid var(--accent-border);

  box-shadow:
    var(--glass-inner-shadow),
    inset 0 0 14px rgba(255, 255, 255, 0.35);

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
    this.width = 0;
    this.startX = 0;
    this.isDragging = false;
    this.isOpen = false;

    this.initSwipeEvents();
  }

  initSwipeEvents() {
    const handleTouch = (handler) => (e) => {
      if (!this.mediaQuery.matches) return;
      handler.call(this, e);
    };

    window.addEventListener('touchstart', handleTouch(this.onTouchStart), { passive: true });
    window.addEventListener('touchmove', handleTouch(this.onTouchMove), { passive: false });
    window.addEventListener('touchend', handleTouch(this.onTouchEnd));
  }

  onTouchStart(e) {
    this.width = this.offsetWidth;
    const touchX = e.touches[0].clientX;
    const screenWidth = window.innerWidth;
    this.isOpen = this.classList.contains('open');

    const canStartClose = this.isOpen && touchX <= this.width;
    const canStartOpen = !this.isOpen && touchX < screenWidth * 0.2;

    if (canStartOpen || canStartClose) {
      this.startX = touchX;
      this.isDragging = true;
      this.style.transition = 'none';
    }
  }

  onTouchMove(e) {
    if (!this.isDragging) return;

    const diffX = e.touches[0].clientX - this.startX;
    let moveX = this.isOpen ? diffX : diffX - this.width;
    moveX = Math.max(-this.width, Math.min(0, moveX));

    this.style.transform = `translateX(${moveX}px)`;
    e.preventDefault();
  }

  onTouchEnd(e) {
    if (!this.isDragging) return;
    this.isDragging = false;

    this.style.transition = '';
    this.style.transform = '';

    const finalDiffX = e.changedTouches[0].clientX - this.startX;
    const threshold = this.width * 0.4;

    if (this.isOpen) {
      if (finalDiffX < -threshold) this.classList.remove('open');
    } else {
      if (finalDiffX > threshold) this.classList.add('open');
    }
  }
}

customElements.define('app-sidebar', Side);
