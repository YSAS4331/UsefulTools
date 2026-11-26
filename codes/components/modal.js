class UIModal extends HTMLElement {
  static get observedAttributes() {
    return ["open", "title", "dismissible"];
  }

  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this.handleKeydown = this.handleKeydown.bind(this);
    this.handleBackdropClick = this.handleBackdropClick.bind(this);
    this.previousFocus = null;
  }

  connectedCallback() {
    if (!this.shadowRoot.hasChildNodes()) {
      this.shadowRoot.innerHTML = `
        <style>
          :host {
            display: contents;
          }

          .backdrop {
            position: fixed;
            inset: 0;
            z-index: 1000;
            display: grid;
            place-items: center;
            padding: 1.5rem;
            background: color-mix(in srgb, #000 48%, transparent);
            opacity: 0;
            visibility: hidden;
            transition: opacity .2s ease, visibility .2s ease;
          }

          .dialog {
            display: flex;
            flex-direction: column;
            width: min(100%, 32rem);
            max-height: min( min(80dvh, 48rem), calc(100dvh - 3rem) );
            overflow: hidden;
            border: 1px solid var(--border-color);
            border-radius: var(--radius, 1rem);
            background: var(--bg-2, var(--bg));
            color: var(--text-primary, inherit);
            box-shadow: 0 1.25rem 4rem color-mix(in srgb, #000 24%, transparent);
            transform: translateY(8px) scale(.98);
            transition: transform .2s ease;
          }

          :host([open]) .backdrop {
            opacity: 1;
            visibility: visible;
          }

          :host([open]) .dialog {
            transform: translateY(0) scale(1);
          }

          .header {
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 1rem;
            padding: 1rem 1.25rem;
            border-bottom: 1px solid var(--border-color);
          }

          .title {
            min-width: 0;
            font-size: 1.05rem;
            font-weight: 700;
          }

          .close {
            display: grid;
            place-items: center;
            flex: none;
            width: 2rem;
            height: 2rem;
            padding: 0;
            border: 0;
            border-radius: .5rem;
            background: transparent;
            color: var(--text-secondary);
            cursor: pointer;
            font: inherit;
            font-size: 1.35rem;
          }

          .close:hover {
            background: color-mix(in srgb, var(--bg-hover, var(--text-primary)) 45%, transparent);
          }

          .content {
            min-height: 0;
            overflow: auto;
            padding: 1.25rem;
            overscroll-behavior: contain;
          }

          ::slotted([slot="footer"]) {
            display: flex;
            justify-content: flex-end;
            flex-wrap: wrap;
            gap: .75rem;
          }

          .footer {
            padding: 1rem 1.25rem;
            border-top: 1px solid var(--border-color);
          }

          .footer:empty {
            display: none;
          }

          @media (max-width: 600px) {
            .backdrop {
              align-items: end;
              padding: 0;
            }

            .dialog {
              width: 100%;
              max-height: min(85dvh, 48rem);
              border-radius: 1.25rem 1.25rem 0 0;
              border-bottom: 0;
              transform: translateY(16px);
              padding-bottom: env(safe-area-inset-bottom, 0px);
            }

            :host([open]) .dialog {
              transform: translateY(0);
            }
          }

          @media (prefers-reduced-motion: reduce) {
            .backdrop, .dialog {
              transition-duration: 0ms;
            }
          }
        </style>
        <div class="backdrop">
          <section class="dialog" role="dialog" aria-modal="true" aria-labelledby="modal-title">
            <header class="header">
              <h2 class="title" id="modal-title"></h2>
              <button class="close" type="button" aria-label="閉じる">&times;</button>
            </header>
            <div class="content"><slot></slot></div>
            <footer class="footer"><slot name="footer"></slot></footer>
          </section>
        </div>
      `;

      this.shadowRoot.querySelector(".close").addEventListener("click", () => this.close());
      this.shadowRoot.querySelector(".backdrop").addEventListener("click", this.handleBackdropClick);
    }

    this.sync();
    if (this.hasAttribute("open")) this.activate();
  }

  disconnectedCallback() {
    document.removeEventListener("keydown", this.handleKeydown);
  }

  attributeChangedCallback() {
    if (!this.shadowRoot) return;
    this.sync();
    if (this.isConnected) {
      if (this.hasAttribute("open")) this.activate();
      else this.deactivate();
    }
  }

  get isOpen() {
    return this.hasAttribute("open");
  }

  showModal() {
    if (this.isOpen) return;
    this.previousFocus = document.activeElement;
    this.setAttribute("open", "");
    this.dispatchEvent(new CustomEvent("open", { bubbles: true, composed: true }));
  }

  close() {
    if (!this.isOpen) return;
    this.removeAttribute("open");
    this.dispatchEvent(new CustomEvent("close", { bubbles: true, composed: true }));
  }

  sync() {
    const title = this.shadowRoot.querySelector("#modal-title");
    if (title) title.textContent = this.getAttribute("title") || "";
    const closeButton = this.shadowRoot.querySelector(".close");
    if (closeButton) closeButton.hidden = this.hasAttribute("dismissible") && this.getAttribute("dismissible") === "false";
  }

  activate() {
    document.addEventListener("keydown", this.handleKeydown);
    requestAnimationFrame(() => {
      if (!this.isOpen) return;
      const target = this.shadowRoot.querySelector(".close:not([hidden])") ||
        this.querySelector("button, a[href], input, select, textarea, [tabindex]:not([tabindex='-1'])");
      target?.focus();
    });
  }

  deactivate() {
    document.removeEventListener("keydown", this.handleKeydown);
    this.previousFocus?.focus?.();
    this.previousFocus = null;
  }

  handleKeydown(event) {
    if (event.key === "Escape" && this.isOpen && this.getAttribute("dismissible") !== "false") {
      event.preventDefault();
      this.close();
    }
  }

  handleBackdropClick(event) {
    if (event.target === this.shadowRoot.querySelector(".backdrop") &&
        this.getAttribute("dismissible") !== "false") {
      this.close();
    }
  }
}

customElements.define("ui-modal", UIModal);
