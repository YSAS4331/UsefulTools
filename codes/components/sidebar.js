class side extends HTMLElement {
  connectedCallback() {
    this.innerHTML = `
<style>
#aside {
  min-width: 240px;
  max-width: 75vh;
  height: 100%;

  background: rgba(255, 255, 255, 0.32);
  backdrop-filter: blur(28px) saturate(180%);

  border-right: 1px solid rgba(255, 255, 255, 0.45);

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
</aside>
    `;
  }
}

customElements.define('app-sidebar', side);
