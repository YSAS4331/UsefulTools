class ToolSearch extends HTMLElement {
  connectedCallback() {
    if (this.initialized) return;
    this.initialized = true;

    this.attachShadow({ mode: "open" });
    this.shadowRoot.innerHTML = `
      <style>
        :host { display: block; width: 100%; }
        button {
          display: flex;
          align-items: center;
          gap: .65rem;
          width: 100%;
          padding: .7rem .75rem;
          border: 1px solid var(--border-color);
          border-radius: 8px;
          background: var(--bg);
          color: var(--text-secondary);
          font: inherit;
          font-size: .9rem;
          text-align: left;
          cursor: pointer;
          transition: border-color .18s ease, background-color .18s ease, color .18s ease;
        }
        button:hover {
          border-color: var(--accent-border-strong);
          background: var(--bg-hover);
          color: var(--text-primary);
        }
        svg { width: 1rem; height: 1rem; flex: none; }
        .hint {
          margin-left: auto;
          color: var(--text-tertiary);
          font-size: .75rem;
        }
      </style>
      <button type="button" aria-label="ツールを検索">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="11" cy="11" r="7"></circle><path d="m20 20-4-4"></path></svg>
        <span>ツールを検索...</span>
      </button>
    `;

    this.button = this.shadowRoot.querySelector("button");
    this.button.addEventListener("click", () => this.open());

    this.handleGlobalKeydown = (event) => {
      if (
        event.repeat ||
        event.altKey ||
        event.shiftKey ||
        !(event.ctrlKey || event.metaKey) ||
        event.key.toLowerCase() !== "k"
      ) return;

      event.preventDefault();
      this.open();
    };
    document.addEventListener("keydown", this.handleGlobalKeydown);

    this.handleStorage = (event) => {
      if (["Modals", "toolsPromise"].includes(event.detail?.key)) {
        this.initializeModal();
      }
    };
    window.addEventListener("spa:storage", this.handleStorage);
    this.initializeModal();
  }

  disconnectedCallback() {
    window.removeEventListener("spa:storage", this.handleStorage);
    document.removeEventListener("keydown", this.handleGlobalKeydown);
  }

  async initializeModal() {
    if (this.modal || this.initializing) return;

    const storage = window.spaRouter?.commonStorage;
    const modals = storage?.get("Modals");
    const toolsPromise = storage?.get("toolsPromise");
    if (!modals || !toolsPromise) return;

    this.initializing = true;

    try {
      const registry = await toolsPromise;
      if (!this.isConnected) return;

      this.registry = Object.entries(registry || {}).map(([key, tool]) => ({
        key,
        ...tool
      }));

      this.modal = modals.create("tool-search", {
        title: "ツールを検索",
        dialogWidth: "42rem",
        dialogHeight: "90dvh",
        dialogMinHeight: "72dvh",
        sheetHeight: "92dvh"
      });

      this.createSearchPanel();
      if (this.openWhenReady) {
        this.openWhenReady = false;
        this.open();
      }
    } catch (error) {
      console.error("[search] 検索機能の初期化に失敗しました。", error);
    } finally {
      this.initializing = false;
    }
  }

  createSearchPanel() {
    const style = document.createElement("style");
    style.textContent = `
      #tool-search-panel { display: flex; flex-direction: column; gap: 1rem; }
      #tool-search-panel .search-field {
        display: flex; align-items: center; gap: .7rem;
        padding: .8rem 1rem; border: 1px solid var(--border-color);
        border-radius: 10px; background: var(--bg); color: var(--text-tertiary);
      }
      #tool-search-panel .search-field:focus-within {
        border-color: var(--accent-border-strong);
        box-shadow: 0 0 0 3px color-mix(in srgb, var(--accent) 12%, transparent);
      }
      #tool-search-panel .search-field svg { width: 1.1rem; height: 1.1rem; flex: none; }
      #tool-search-panel input {
        width: 100%; min-width: 0; border: 0; outline: 0;
        background: transparent; color: var(--text-primary);
        font: inherit; font-size: 1rem;
      }
      #tool-search-panel input::placeholder { color: var(--text-tertiary); }
      #tool-search-panel .search-status {
        color: var(--text-tertiary); font-size: .82rem; line-height: 1.5;
      }
      #tool-search-panel .search-results {
        display: grid; gap: .4rem; max-height: min(68dvh, 40rem);
        overflow-y: auto; overscroll-behavior: contain;
      }
      #tool-search-panel .search-result {
        display: grid; gap: .25rem; padding: .8rem .9rem;
        border: 1px solid transparent; border-radius: 9px;
        color: var(--text-primary); text-decoration: none;
        transition: background-color .16s ease, border-color .16s ease;
      }
      #tool-search-panel .search-result:hover {
        border-color: var(--border-color); background: var(--bg-hover);
        text-decoration: none;
      }
      #tool-search-panel .result-title { font-size: .95rem; font-weight: 650; }
      #tool-search-panel .result-description {
        color: var(--text-secondary); font-size: .82rem; line-height: 1.5;
      }
      #tool-search-panel .search-empty {
        padding: 1.5rem .75rem; color: var(--text-tertiary);
        font-size: .9rem; text-align: center;
      }
    `;

    const panel = document.createElement("div");
    panel.id = "tool-search-panel";
    panel.innerHTML = `
      <label class="search-field">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="11" cy="11" r="7"></circle><path d="m20 20-4-4"></path></svg>
        <input type="search" autocomplete="off" placeholder="ツール名や機能で検索..." aria-label="ツール名や機能で検索">
      </label>
      <p class="search-status" role="status" aria-live="polite">ツール名や説明に含まれる言葉で検索できます。</p>
      <div class="search-results"></div>
    `;

    this.modal.append(style, panel);
    this.input = panel.querySelector("input");
    this.status = panel.querySelector(".search-status");
    this.results = panel.querySelector(".search-results");

    this.input.addEventListener("input", () => this.renderResults());
    this.input.addEventListener("keydown", (event) => {
      if (event.key === "Enter" || event.key === "Search") {
        event.preventDefault();
        this.input.blur();
      }
    });
    this.input.addEventListener("search", () => this.input.blur());
    this.modal.addEventListener("open", () => {
      this.input.value = "";
      this.renderResults();
      requestAnimationFrame(() => this.input.focus());
    });

    const createIcons = window.spaRouter?.commonStorage.get("createIcons");
    const icons = window.spaRouter?.commonStorage.get("lucideIcons");
    createIcons?.({ icons });
  }

  renderResults() {
    const query = this.input.value.trim().toLocaleLowerCase();
    this.results.replaceChildren();

    if (!query) {
      this.status.textContent = "ツール名や説明に含まれる言葉で検索できます。";
      return;
    }

    const terms = query.split(/\s+/).filter(Boolean);
    const matches = this.registry
      .map((tool) => {
        const title = String(tool.title || "");
        const description = String(tool.description || "");
        const searchable = [tool.key, title, description].join(" ").toLocaleLowerCase();
        if (!terms.every((term) => searchable.includes(term))) return null;

        const lowerTitle = title.toLocaleLowerCase();
        const score = lowerTitle.startsWith(query) ? 0 :
          lowerTitle.includes(query) ? 1 : 2;
        return { tool, score };
      })
      .filter(Boolean)
      .sort((a, b) => a.score - b.score || a.tool.title.localeCompare(b.tool.title, "ja"));

    if (!matches.length) {
      this.status.textContent = "検索結果はありません。";
      const empty = document.createElement("p");
      empty.className = "search-empty";
      empty.textContent = "別のキーワードで検索してみてください。";
      this.results.append(empty);
      return;
    }

    const visible = matches.slice(0, 30);
    this.status.textContent = matches.length > 30
      ? `${matches.length}件見つかりました（先頭30件を表示）`
      : `${matches.length}件見つかりました`;

    for (const { tool } of visible) {
      const link = document.createElement("a");
      link.className = "search-result";
      link.href = tool.url;

      const title = document.createElement("span");
      title.className = "result-title";
      title.textContent = tool.title || tool.key;

      const description = document.createElement("span");
      description.className = "result-description";
      description.textContent = tool.description || "";

      link.append(title, description);
      link.addEventListener("click", () => this.modal.close());
      this.results.append(link);
    }
  }

  open() {
    if (!this.modal) {
      this.openWhenReady = true;
      this.initializeModal();
      return;
    }

    this.modal.open();
  }

}

customElements.define("ui-search", ToolSearch);
