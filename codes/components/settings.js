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
          .tabs {
            display: flex; gap: .35rem; margin: 0 -1.25rem;
            padding: 0 1.25rem; border-bottom: 1px solid var(--border-color);
          }
          .tab {
            position: relative; padding: .8rem .9rem; border: 0;
            background: transparent; color: var(--text-secondary);
            font: inherit; font-size: .9rem; font-weight: 600; cursor: pointer;
          }
          .tab[aria-selected="true"] { color: var(--text-primary); }
          .tab[aria-selected="true"]::after {
            content: ""; position: absolute; right: .65rem; bottom: -1px; left: .65rem;
            height: 2px; border-radius: 2px 2px 0 0; background: var(--accent);
          }
          .tab:focus-visible { outline: 2px solid var(--accent); outline-offset: -2px; border-radius: 6px; }
          .tab-panel { padding-top: 1.25rem; }
          .setting { display: grid; gap: .55rem; padding: .5rem 0; }
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
        <nav class="tabs" role="tablist" aria-label="設定カテゴリ">
          <button class="tab" id="appearance-tab" type="button" role="tab"
            aria-selected="true" aria-controls="appearance-panel">見た目</button>
        </nav>
        <section class="tab-panel" id="appearance-panel" role="tabpanel"
          aria-labelledby="appearance-tab">
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
          <section class="setting">
            <label for="accent-color">テーマカラー</label>
            <select id="accent-color" disabled>
              <option value="green">グリーン（デフォルト）</option>
              <option value="blue">ブルー</option>
              <option value="red">レッド</option>
              <option value="purple">パープル</option>
              <option value="orange">オレンジ</option>
              <option value="pink">ピンク</option>
            </select>
            <p>アクセントカラーを変更します。</p>
          </section>
        </section>
      `;
      this.themeSelect = this.shadowRoot.querySelector("#theme");
      this.status = this.shadowRoot.querySelector(".status");
      this.accentSelect = this.shadowRoot.querySelector("#accent-color");
      this.themeSelect.addEventListener("change", () => this.saveTheme());
      this.accentSelect.addEventListener("change", () => this.saveAccentColor());
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
      const accent = await db.store("settings").get("accentColor");
      this.accentSelect.value = accent?.value || "green";
      this.themeSelect.disabled = false;
      this.accentSelect.disabled = false;
      this.status.textContent = "";
      this.unsubscribe?.();
      this.unsubscribe = db.on("change", async (event) => {
        if (!event.stores?.includes("settings")) return;
        const saved = await db.store("settings").get("theme");
        if (saved) this.themeSelect.value = saved.value;
        const accent = await db.store("settings").get("accentColor");
        this.accentSelect.value = accent?.value || "green";
      });
    } catch (error) {
      this.status.textContent = "設定を読み込めませんでした";
      console.error("[settings] テーマ設定の読み込みに失敗しました。", error);
    }
  }

  async saveAccentColor() {
    const value = this.accentSelect.value;
    this.accentSelect.disabled = true;
    this.status.textContent = "保存中...";
    try {
      const getDatabase = window.spaRouter.commonStorage.get("getDatabase");
      const db = await getDatabase();
      await db.store("settings").put({ key: "accentColor", value });
      this.status.textContent = "保存しました";
    } catch (error) {
      this.status.textContent = "保存に失敗しました";
      console.error("[settings] テーマカラーの保存に失敗しました。", error);
    } finally {
      this.accentSelect.disabled = false;
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
      sheetHeight: "90dvh",
      content: this
    });
    modal.open();
  }
}

customElements.define("ui-settings", UISettings);
