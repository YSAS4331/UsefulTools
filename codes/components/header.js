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

#hamburger {
  display: none;
  width: 32px;
  height: 32px;
  flex-direction: column;
  justify-content: center;
  gap: 6px;
  cursor: pointer;
}

#hamburger span {
  display: block;
  width: 100%;
  height: 3px;
  background: var(--accent-border);
  border-radius: 4px;
}

@media (max-width: 600px) {
  #hamburger {
    display: flex;
  }
}
</style>

<header id="global-header">
  <a href="/UsefulTools/">UsefulTools</a>
  <div id="hamburger">
    <span></span>
    <span></span>
    <span></span>
  </div>
</header>
    `;

    // ★ ここでイベントを付ける（ヘッダー自身の中で完結）
    const btn = this.querySelector("#hamburger");

    btn.addEventListener("click", () => {
      const sidebar = document.querySelector("app-sidebar");
      if (!sidebar) return;
      sidebar.classList.toggle("open");
    });
  }
}

customElements.define('app-header', header);
