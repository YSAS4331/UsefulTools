class header extends HTMLElement {
  connectedCallback() {
    this.innerHTML = `
<style>
#global-header {
  height: 60px;
  background: var(--header-bg);
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

.header-actions {
  display: flex;
  align-items: center;
  gap: 12px;
}

.header-action {
  display: grid;
  place-items: center;
  width: 40px;
  height: 40px;
  padding: 0;
  border: 0;
  border-radius: 10px;
  background: transparent;
  color: var(--text-secondary);
  cursor: pointer;
  transition: color .18s ease, background-color .18s ease;
}

.header-action:hover {
  background: var(--bg-hover);
  color: var(--text-primary);
}

.header-action:focus-visible {
  outline: 2px solid var(--accent-strong);
  outline-offset: 2px;
}

.header-action svg {
  width: 22px;
  height: 22px;
}

@media (max-width: 600px) {
  #global-header { padding: 0 16px; }
}
</style>

<header id="global-header">
  <a href="/">UsefulTools</a>
  <div class="header-actions">
    <button class="header-action" id="settings-button" type="button" aria-label="設定" title="設定">
      <i data-lucide="settings"></i>
    </button>
    <button class="header-action" id="hamburger" type="button" aria-label="メニュー" title="メニュー">
      <i data-lucide="menu"></i>
    </button>
  </div>
</header>
    `;

    const renderIcons = () => {
      const createIcons = window.spaRouter?.commonStorage?.get("createIcons");
      const icons = window.spaRouter?.commonStorage?.get("lucideIcons");
      if (!createIcons || !icons) return false;
      createIcons({ icons, root: this });
      return true;
    };

    if (!renderIcons()) {
      window.addEventListener("spa:router", (event) => {
        if (event.detail?.type === "setup-ok") renderIcons();
      }, { once: true });
    }

    this.querySelector("#hamburger").addEventListener("click", () => {
      const sidebar = document.querySelector("app-sidebar");
      if (!sidebar) return;
      sidebar.classList.toggle("open");
    });

    this.querySelector("#settings-button").addEventListener("click", () => {
      const modals = window.spaRouter?.commonStorage?.get("Modals");
      if (!modals) return;

      const content = document.createElement("div");
      content.textContent = "設定項目はまだありません。";

      const modal = modals.create("settings", {
        title: "設定",
        dialogWidth: "36rem",
        content
      });
      modal.open();
    });
  }
}

customElements.define("app-header", header);
