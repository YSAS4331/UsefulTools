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
}
.sidebar footer a {
  color: var(--text-tertiary);
}
</style>
<aside class="sidebar">
  <a href="/UsefulTools/">UsefulTools</a>
  <footer>
    <a href="/UsefulTools/terms/">利用規約</a>
    <a href="/UsefulTools/privacy/">プライバシーポリシー</a>
    <a href="/UsefulTools/sitemap/">サイトマップ</a>
  </footer>
</aside>
    `;
  }
}

customElements.define('app-sidebar', Side);
