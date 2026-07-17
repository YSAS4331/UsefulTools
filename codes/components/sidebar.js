class side extends HTMLElement {
  connectedCallback() {
    this.innerHTML = `
<style>
#aside {
  width: 240px;
  height: 100%;

  background: rgba(255, 255, 255, 0.32);
  backdrop-filter: blur(28px) saturate(180%);

  border-right: 1px solid var(--accent-border);

  box-shadow:
    inset 0 0 1px rgba(255, 255, 255, 0.9),
    inset 0 0 14px rgba(255, 255, 255, 0.35);
  
  box-sizing: border-box;
  display: flex;
  flex-direction: column;

  align-items: center;
}
</style>
<aside id="aside">
  <a href="/UsefulTools">UsefulTools</a>
</aside>
    `;
  }
}

customElements.define('app-sidebar', side);
