class UISettings extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this.openWhenReady = false;
    this.handleStorage = (event) => {
      if (event.detail?.key === "Modals" && this.openWhenReady) {
        this.open();
      }
    };
  }

  connectedCallback() {
    if (!this.shadowRoot.hasChildNodes()) {
      this.shadowRoot.innerHTML = `
        <style>
          :host {
            display: block;
            color: var(--text-primary);
          }

          .empty-state {
            display: grid;
            justify-items: center;
            gap: .65rem;
            padding: 3rem 1rem;
            text-align: center;
          }

          .icon {
            display: grid;
            place-items: center;
            width: 3rem;
            height: 3rem;
            margin-bottom: .25rem;
            border: 1px solid var(--border-color);
            border-radius: 14px;
            background: var(--bg);
            color: var(--text-tertiary);
          }

          .icon svg {
            width: 1.4rem;
            height: 1.4rem;
          }

          h3 {
            margin: 0;
            color: var(--text-primary);
            font-size: .95rem;
            font-weight: 650;
          }

          p {
            max-width: 24rem;
            margin: 0;
            color: var(--text-secondary);
            font-size: .85rem;
            line-height: 1.65;
          }
        </style>

        <section class="empty-state" aria-labelledby="settings-empty-title">
          <div class="icon" aria-hidden="true">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"
              stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">
              <path d="M12 8.5a3.5 3.5 0 1 0 0 7 3.5 3.5 0 0 0 0-7Z"></path>
              <path d="m19.4 15 .1.1a1.7 1.7 0 0 1-2.4 2.4l-.1-.1a1.7 1.7 0 0 0-2.9 1.2v.2a1.7 1.7 0 0 1-3.4 0v-.2a1.7 1.7 0 0 0-2.9-1.2l-.1.1a1.7 1.7 0 0 1-2.4-2.4l.1-.1a1.7 1.7 0 0 0-1.2-2.9H4a1.7 1.7 0 0 1 0-3.4h.2a1.7 1.7 0 0 0 1.2-2.9l-.1-.1a1.7 1.7 0 0 1 2.4-2.4l.1.1a1.7 1.7 0 0 0 2.9-1.2V2a1.7 1.7 0 0 1 3.4 0v.2a1.7 1.7 0 0 0 2.9 1.2l.1-.1a1.7 1.7 0 0 1 2.4 2.4l-.1.1a1.7 1.7 0 0 0 1.2 2.9h.2a1.7 1.7 0 0 1 0 3.4h-.2a1.7 1.7 0 0 0-1.2 2.9Z"></path>
            </svg>
          </div>
          <h3 id="settings-empty-title">設定項目はまだありません</h3>
          <p>今後、UsefulTools全体の動作や表示に関する設定をここで管理できるようにします。</p>
        </section>
      `;
    }

    window.addEventListener("spa:storage", this.handleStorage);
  }

  disconnectedCallback() {
    window.removeEventListener("spa:storage", this.handleStorage);
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
