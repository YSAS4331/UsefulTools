class UISettings extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this.openWhenReady = false;
    this.activeTab = "appearance";
    this.handleStorage = (event) => {
      if (event.detail?.key === "Modals" && this.openWhenReady) this.open();
      if (event.detail?.key === "getDatabase") {
        this.loadTheme();
        this.loadData();
      }
    };
  }

  connectedCallback() {
    if (!this.shadowRoot.hasChildNodes()) this.render();
    window.addEventListener("spa:storage", this.handleStorage);
    this.loadTheme();
    this.loadData();
  }

  disconnectedCallback() {
    window.removeEventListener("spa:storage", this.handleStorage);
    this.unsubscribe?.();
    this.unsubscribe = null;
    this.dataUnsubscribe?.();
    this.dataUnsubscribe = null;
  }

  render() {
    this.shadowRoot.innerHTML = `
      <style>
        :host { display:block; color:var(--text-primary); }
        .tabs {
          display:flex; gap:.35rem; margin:0 0 1.25rem; padding:.3rem;
          border:1px solid var(--border-color); border-radius:12px;
          background:var(--bg); overflow-x:auto;
        }
        .tab {
          flex:1 0 auto; padding:.65rem 1rem; border:0; border-radius:9px;
          background:transparent; color:var(--text-secondary);
          font:inherit; font-size:.88rem; font-weight:600; cursor:pointer;
          transition:background-color .16s ease, color .16s ease;
        }
        .tab:hover { background:var(--bg-hover); color:var(--text-primary); }
        .tab[aria-selected="true"] {
          background:var(--bg-2); color:var(--text-primary);
          box-shadow:0 1px 3px color-mix(in srgb, var(--text-primary) 12%, transparent);
        }
        .tab:focus-visible, button:focus-visible, select:focus-visible, input:focus-visible {
          outline:2px solid var(--accent); outline-offset:2px;
        }
        .tab-panel { display:grid; align-content:start; gap:1rem; }
        .tab-panel[hidden] { display:none; }
        .setting {
          display:grid; gap:.6rem; padding:1rem 1.1rem;
          border:1px solid var(--border-color); border-radius:12px;
          background:var(--bg);
        }
        label,.setting-title { font-size:.9rem; font-weight:650; }
        p { margin:0; color:var(--text-secondary); font-size:.8rem; line-height:1.55; }
        select {
          width:100%; box-sizing:border-box; padding:.7rem .8rem;
          border:1px solid var(--border-color); border-radius:9px;
          background:var(--bg); color:var(--text-primary); font:inherit;
        }
        select:disabled { opacity:.6; }
        .section {
          display:grid; gap:.7rem; padding:1rem 1.1rem;
          border:1px solid var(--border-color); border-radius:12px;
          background:var(--bg);
        }
        .section-heading { display:flex; align-items:center; justify-content:space-between; gap:1rem; }
        .section-heading h3, .section h3 { margin:0; font-size:.9rem; font-weight:650; }
        .muted { color:var(--text-tertiary); font-size:.78rem; }
        .action {
          justify-self:start; padding:.55rem .85rem; border:1px solid var(--border-color);
          border-radius:9px; background:var(--bg-2); color:var(--text-primary);
          font:inherit; font-size:.82rem; font-weight:600; cursor:pointer;
          transition:background-color .16s ease, border-color .16s ease;
        }
        .action:hover { background:var(--bg-hover); border-color:color-mix(in srgb, var(--accent) 35%, var(--border-color)); }
        .action:disabled { opacity:.45; cursor:default; }
        .action.danger { color:var(--danger, #dc4545); }
        .history-list {
          display:grid; gap:.35rem; max-height:11rem; overflow:auto;
          padding:.15rem; border-radius:9px; overscroll-behavior:contain;
        }
        .history-item {
          display:flex; align-items:center; justify-content:space-between; gap:.75rem;
          padding:.55rem .65rem; border:1px solid var(--border-color);
          border-radius:9px; background:var(--bg-2);
        }
        .history-copy { display:grid; gap:.2rem; min-width:0; }
        .history-copy strong { overflow:hidden; text-overflow:ellipsis; white-space:nowrap; font-size:.84rem; }
        .history-copy small { color:var(--text-tertiary); font-size:.72rem; }
        .history-item .action { flex:none; padding:.4rem .6rem; font-size:.76rem; }
        .empty { padding:.75rem; color:var(--text-tertiary); font-size:.82rem; }
        .backup-actions { display:flex; flex-wrap:wrap; gap:.5rem; }
        .status { min-height:1.2em; color:var(--text-secondary); font-size:.8rem; }
        .warning {
          padding:.75rem .85rem; border:1px solid color-mix(in srgb, var(--danger, #dc4545) 22%, transparent);
          border-radius:9px; background:color-mix(in srgb, var(--danger, #dc4545) 7%, var(--bg));
          color:var(--text-secondary); font-size:.78rem; line-height:1.55;
        }
        .file-input { display:none; }
        @media (max-width:480px) {
          .tabs { margin-bottom:.9rem; }
          .tab { padding:.65rem .7rem; font-size:.82rem; }
          .setting, .section { padding:.9rem; }
        }
      </style>
      <nav class="tabs" role="tablist" aria-label="設定カテゴリ">
        <button class="tab" id="appearance-tab" type="button" role="tab" aria-selected="true" aria-controls="appearance-panel">見た目</button>
        <button class="tab" id="data-tab" type="button" role="tab" aria-selected="false" aria-controls="data-panel">データ管理</button>
      </nav>
      <section class="tab-panel" id="appearance-panel" role="tabpanel" aria-labelledby="appearance-tab">
        <section class="setting">
          <label for="theme">テーマ</label>
          <select id="theme" disabled>
            <option value="system">システム設定に合わせる</option>
            <option value="light">ライト</option>
            <option value="dark">ダーク</option>
          </select>
          <p>UsefulToolsの配色を設定します。</p>
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
      <section class="tab-panel" id="data-panel" role="tabpanel" aria-labelledby="data-tab" hidden>
        <section class="section">
          <div class="section-heading"><h3>閲覧履歴</h3><span class="muted" id="history-count">読み込み中...</span></div>
          <p>履歴を個別に削除したり、すべて削除できます。</p>
          <div class="history-list" id="history-list"><div class="empty">履歴を読み込み中...</div></div>
          <button class="action danger" id="clear-history" type="button">履歴をすべて削除</button>
        </section>
        <section class="section">
          <div class="section-heading"><h3>お気に入り</h3><span class="muted" id="favorite-count">読み込み中...</span></div>
          <p>登録したお気に入りをすべて解除します。</p>
          <button class="action danger" id="clear-favorites" type="button">お気に入りをリセット</button>
        </section>
        <section class="section">
          <h3>バックアップ</h3>
          <p>設定・お気に入り・閲覧履歴をJSONファイルに保存、またはバックアップから復元できます。</p>
          <div class="backup-actions">
            <button class="action" id="export-data" type="button">エクスポート</button>
            <button class="action" id="import-data" type="button">インポート</button>
            <input class="file-input" id="import-file" type="file" accept=".json,application/json">
          </div>
          <p class="muted">インポートすると、現在の設定・お気に入り・履歴はバックアップの内容に置き換わります。</p>
          <p class="status" id="backup-status" role="status" aria-live="polite"></p>
        </section>
        <section class="section">
          <h3>すべて初期化</h3>
          <p>設定・お気に入り・閲覧履歴をすべて削除し、テーマなどを初期状態に戻します。</p>
          <div class="warning">この操作は取り消せません。必要なデータは先にエクスポートしてください。</div>
          <button class="action danger" id="reset-all" type="button">すべてのデータを初期化</button>
        </section>
      </section>
    `;

    this.themeSelect = this.shadowRoot.querySelector("#theme");
    this.accentSelect = this.shadowRoot.querySelector("#accent-color");
    this.historyList = this.shadowRoot.querySelector("#history-list");
    this.historyCount = this.shadowRoot.querySelector("#history-count");
    this.favoriteCount = this.shadowRoot.querySelector("#favorite-count");
    this.backupStatus = this.shadowRoot.querySelector("#backup-status");

    this.shadowRoot.querySelectorAll('[role="tab"]').forEach((tab) => {
      tab.addEventListener("click", () => this.selectTab(tab.id === "data-tab" ? "data" : "appearance"));
    });
    this.themeSelect.addEventListener("change", () => this.saveTheme());
    this.accentSelect.addEventListener("change", () => this.saveAccentColor());
    this.shadowRoot.querySelector("#clear-history").addEventListener("click", () => this.clearHistory());
    this.shadowRoot.querySelector("#clear-favorites").addEventListener("click", () => this.clearFavorites());
    this.shadowRoot.querySelector("#export-data").addEventListener("click", () => this.exportData());
    this.shadowRoot.querySelector("#import-data").addEventListener("click", () => this.shadowRoot.querySelector("#import-file").click());
    this.shadowRoot.querySelector("#import-file").addEventListener("change", (event) => this.importData(event));
    this.shadowRoot.querySelector("#reset-all").addEventListener("click", () => this.resetAll());
    this.historyList.addEventListener("click", (event) => {
      const button = event.target.closest("[data-delete-history]");
      if (button) this.deleteHistoryItem(button.dataset.deleteHistory);
    });
  }

  selectTab(name) {
    this.activeTab = name;
    for (const tab of this.shadowRoot.querySelectorAll('[role="tab"]')) {
      const active = tab.id === (name === "data" ? "data-tab" : "appearance-tab");
      tab.setAttribute("aria-selected", String(active));
      this.shadowRoot.getElementById(tab.getAttribute("aria-controls")).hidden = !active;
    }
    if (name === "data") this.loadData();
  }

  async getDB() {
    const getDatabase = window.spaRouter?.commonStorage?.get("getDatabase");
    if (!getDatabase) throw new Error("データベースを利用できません。");
    return getDatabase();
  }

  async loadTheme() {
    if (!this.themeSelect) return;
    try {
      const db = await this.getDB();
      const record = await db.store("settings").get("theme");
      const accent = await db.store("settings").get("accentColor");
      this.themeSelect.value = record?.value || "system";
      this.accentSelect.value = accent?.value || "green";
      this.themeSelect.disabled = false;
      this.accentSelect.disabled = false;
      this.unsubscribe?.();
      this.unsubscribe = db.on("change", async (event) => {
        if (!event.stores?.includes("settings") || !this.isConnected) return;
        const saved = await db.store("settings").get("theme");
        const savedAccent = await db.store("settings").get("accentColor");
        this.themeSelect.value = saved?.value || "system";
        this.accentSelect.value = savedAccent?.value || "green";
      });
    } catch (error) {
      console.error("[settings] 設定の読み込みに失敗しました。", error);
    }
  }

  async saveAccentColor() {
    this.accentSelect.disabled = true;
    try {
      const db = await this.getDB();
      await db.store("settings").put({ key: "accentColor", value: this.accentSelect.value });
    } catch (error) {
      console.error("[settings] テーマカラーの保存に失敗しました。", error);
    } finally {
      this.accentSelect.disabled = false;
    }
  }

  async saveTheme() {
    this.themeSelect.disabled = true;
    try {
      const db = await this.getDB();
      await db.store("settings").put({ key: "theme", value: this.themeSelect.value });
    } catch (error) {
      console.error("[settings] テーマ設定の保存に失敗しました。", error);
    } finally {
      this.themeSelect.disabled = false;
    }
  }

  async loadData() {
    if (!this.historyList || !this.isConnected) return;
    try {
      const db = await this.getDB();
      const [history, favorites] = await Promise.all([
        db.store("history").getAll(),
        db.store("favorite").getAll()
      ]);
      if (!this.isConnected) return;
      history.sort((a, b) => (b.visitedAt || 0) - (a.visitedAt || 0));
      this.historyCount.textContent = `${history.length}件`;
      this.favoriteCount.textContent = `${favorites.length}件`;
      this.historyList.replaceChildren();
      if (!history.length) {
        const empty = document.createElement("div");
        empty.className = "empty";
        empty.textContent = "履歴はありません。";
        this.historyList.append(empty);
      } else {
        for (const item of history) {
          const row = document.createElement("div");
          row.className = "history-item";
          const copy = document.createElement("div");
          copy.className = "history-copy";
          const title = document.createElement("strong");
          title.textContent = item.title || item.key || item.id;
          const date = document.createElement("small");
          date.textContent = item.visitedAt ? new Date(item.visitedAt).toLocaleString() : "";
          copy.append(title, date);
          const remove = document.createElement("button");
          remove.className = "action";
          remove.type = "button";
          remove.textContent = "削除";
          remove.dataset.deleteHistory = String(item.id);
          remove.setAttribute("aria-label", (item.title || item.key || item.id) + "を履歴から削除");
          row.append(copy, remove);
          this.historyList.append(row);
        }
      }
      this.dataUnsubscribe?.();
      this.dataUnsubscribe = db.on("change", (event) => {
        if (event.stores?.some((store) => ["history", "favorite"].includes(store))) {
          this.loadData();
        }
      });
    } catch (error) {
      this.historyCount.textContent = "取得できません";
      this.favoriteCount.textContent = "取得できません";
      this.historyList.textContent = "データを読み込めませんでした。";
      console.error("[settings] データの読み込みに失敗しました。", error);
    }
  }

  async deleteHistoryItem(id) {
    try {
      const db = await this.getDB();
      await db.store("history").delete(id);
      await this.loadData();
    } catch (error) {
      this.setStatus("履歴を削除できませんでした。");
      console.error("[settings] 履歴の削除に失敗しました。", error);
    }
  }

  async clearHistory() {
    try {
      const db = await this.getDB();
      const history = db.store("history");
      if (!await history.count()) return;
      if (!confirm("閲覧履歴をすべて削除しますか？")) return;
      await history.clear();
      await this.loadData();
    } catch (error) {
      this.setStatus("履歴を削除できませんでした。");
      console.error("[settings] 履歴の一括削除に失敗しました。", error);
    }
  }

  async clearFavorites() {
    try {
      const db = await this.getDB();
      const favorites = db.store("favorite");
      if (!await favorites.count()) return;
      if (!confirm("お気に入りをすべて解除しますか？")) return;
      await favorites.clear();
      await this.loadData();
    } catch (error) {
      this.setStatus("お気に入りをリセットできませんでした。");
      console.error("[settings] お気に入りのリセットに失敗しました。", error);
    }
  }

  setStatus(message) {
    if (this.backupStatus) this.backupStatus.textContent = message;
  }

  async exportData() {
    try {
      const db = await this.getDB();
      const [settings, favorites, history] = await Promise.all([
        db.store("settings").getAll(),
        db.store("favorite").getAll(),
        db.store("history").getAll()
      ]);
      const backup = {
        format: "UsefulTools-backup",
        version: 1,
        exportedAt: new Date().toISOString(),
        data: { settings, favorites, history }
      };
      const blob = new Blob([JSON.stringify(backup, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `usefultools-backup-${new Date().toISOString().slice(0, 10)}.json`;
      link.click();
      URL.revokeObjectURL(url);
      this.setStatus("バックアップをエクスポートしました。");
    } catch (error) {
      this.setStatus("エクスポートに失敗しました。");
      console.error("[settings] エクスポートに失敗しました。", error);
    }
  }

  validateBackup(backup) {
    if (!backup || backup.format !== "UsefulTools-backup" || backup.version !== 1 || !backup.data) {
      throw new Error("対応していないバックアップ形式です。");
    }
    const { settings, favorites, history } = backup.data;
    if (![settings, favorites, history].every(Array.isArray)) {
      throw new Error("バックアップのデータ構造が不正です。");
    }
    if (!settings.every((item) => item && typeof item.key === "string" && "value" in item)) {
      throw new Error("設定データが不正です。");
    }
    if (![favorites, history].every((items) => items.every((item) =>
      item && (typeof item.id === "string" || typeof item.id === "number")
    ))) {
      throw new Error("お気に入りまたは履歴のデータが不正です。");
    }
    return { settings, favorites, history };
  }

  async importData(event) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    try {
      const backup = JSON.parse(await file.text());
      const data = this.validateBackup(backup);
      const summary = `設定 ${data.settings.length}件、お気に入り ${data.favorites.length}件、履歴 ${data.history.length}件です。\n現在のデータを置き換えて復元しますか？`;
      if (!confirm(summary)) return;
      const db = await this.getDB();
      await db.transaction(["settings", "favorite", "history"], "readwrite", (stores) => {
        const requests = [
          stores.settings.clear(),
          stores.favorite.clear(),
          stores.history.clear()
        ];
        for (const item of data.settings) requests.push(stores.settings.put(item));
        for (const item of data.favorites) requests.push(stores.favorite.put(item));
        for (const item of data.history) requests.push(stores.history.put(item));
        return requests;
      });
      await this.loadTheme();
      await this.loadData();
      this.setStatus("バックアップから復元しました。");
    } catch (error) {
      this.setStatus(error.message || "インポートに失敗しました。");
      console.error("[settings] インポートに失敗しました。", error);
    }
  }

  async resetAll() {
    if (!confirm("設定・お気に入り・履歴をすべて初期化します。\nこの操作は取り消せません。続行しますか？")) return;
    try {
      const db = await this.getDB();
      await db.transaction(["settings", "favorite", "history"], "readwrite", (stores) => [
        stores.settings.clear(),
        stores.favorite.clear(),
        stores.history.clear()
      ]);
      await this.loadTheme();
      await this.loadData();
      this.setStatus("すべてのデータを初期化しました。");
    } catch (error) {
      this.setStatus("初期化に失敗しました。");
      console.error("[settings] 初期化に失敗しました。", error);
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
      dialogWidth: "48rem",
      dialogMinHeight: "36rem",
      sheetHeight: "90dvh",
      content: this
    });
    modal.open();
  }
}

customElements.define("ui-settings", UISettings);
