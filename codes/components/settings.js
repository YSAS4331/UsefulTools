class UISettings extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this.openWhenReady = false;
    this.handleStorage = (event) => {
      if (event.detail?.key === "Modals" && this.openWhenReady) this.open();
      if (event.detail?.key === "getDatabase") this.loadTheme();
    };
  }

  connectedCallback() {
    if (!this.shadowRoot.hasChildNodes()) {
      this.shadowRoot.innerHTML = `
        <style>
          :host { display: block; color: var(--text-primary); }
          .setting { display: grid; gap: .55rem; padding: 1.25rem 0; }
          .setting + .setting { border-top: 1px solid var(--border-color); }
          label { font-size: .92rem; font-weight: 600; }
          p { margin: 0; color: var(--text-secondary); font-size: .82rem; line-height: 1.5; }
          select {
            width: 100%; box-sizing: border-box; padding: .7rem .8rem;
            border: 1px solid var(--border-color); border-radius: 9px;
            background: var(--bg); color: var(--text-primary); font: inherit;
          }
          select:focus-visible { outline: 2px solid var(--accent); outline-offset: 2px; }
          .status { min-height: 1.2em; color: var(--text-tertiary); font-size: .78rem; }
        </style>
        <section class="setting">
          <label for="theme">テーマ</label>
          <select id="theme" disabled>
            <option value="system">システム設定に合わせる</option>
            <option value="light">ライト</option>
            <option value="dark">ダーク</option>
          </select>
          <p>UsefulToolsの配色を設定します。</p>
          <span class="status" role="status" aria-live="polite">設定を読み込み中...</span>
        </section>
      `;
      this.themeSelect = this.shadowRoot.querySelector("#theme");
      this.status = this.shadowRoot.querySelector(".status");
      this.themeSelect.addEventListener("change", () => this.saveTheme());
    }
    window.addEventListener("spa:storage", this.handleStorage);
    this.loadTheme();
  }

  disconnectedCallback() {
    window.removeEventListener("spa:storage", this.handleStorage);
    this.unsubscribe?.();
    this.unsubscribe = null;
  }

  async loadTheme() {
    const getDatabase = window.spaRouter?.commonStorage?.get("getDatabase");
    if (!getDatabase || !this.themeSelect) return;
    try {
      const db = await getDatabase();
      const record = await db.store("settings").get("theme");
      this.themeSelect.value = record?.value || "system";
      this.themeSelect.disabled = false;
      this.status.textContent = "";
      this.unsubscribe?.();
      this.unsubscribe = db.on("change", async (event) => {
        if (!event.stores?.includes("settings")) return;
        const saved = await db.store("settings").get("theme");
        if (saved) this.themeSelect.value = saved.value;
      });
    } catch (error) {
      this.status.textContent = "設定を読み込めませんでした";
      console.error("[settings] テーマ設定の読み込みに失敗しました。", error);
    }
  }

  async saveTheme() {
    const value = this.themeSelect.value;
    this.themeSelect.disabled = true;
    this.status.textContent = "保存中...";
    try {
      const getDatabase = window.spaRouter.commonStorage.get("getDatabase");
      const db = await getDatabase();
      await db.store("settings").put({ key: "theme", value });
      this.status.textContent = "保存しました";
    } catch (error) {
      this.status.textContent = "保存に失敗しました";
      console.error("[settings] テーマ設定の保存に失敗しました。", error);
    } finally {
      this.themeSelect.disabled = false;
    }
  }

  open() {
    const modals = window.spaRouter?.commonStorage?.get("Modals");
    if (!modals) {
      this.openWhenReady = true;
      return;
    }
    this.openWhenReady = false;
    const modal = modals.create("settings", {
      title: "設定",
      dialogWidth: "36rem",
      sheetHeight: "75dvh",
      content: this
    });
    modal.open();
  }
}

customElements.define("ui-settings", UISettings);
