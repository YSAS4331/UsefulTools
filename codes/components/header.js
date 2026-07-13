class header extends HTMLElement {
  connectedCallback() {
    this.innerHTML = `
<style>
#global-header {
  height: 60px;
  background: rgba(255, 255, 255, 0.12);
  backdrop-filter: blur(28px) saturate(180%);
  border-bottom: 1px solid var(--accent-border);
  box-shadow: var(--glass-inner-shadow), var(--accent-glow);
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 24px;
  box-sizing: border-box;
  position: fixed;
  top: 0; left: 0; right: 0;
  z-index: 20;
}
</style>
<header id="global-header">
  <a href="/UsefulTools/">UsefulTools</a>
</header>
    `;
  }
}

customElements.define('app-header', header);
