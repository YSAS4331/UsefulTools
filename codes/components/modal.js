class UIModal extends HTMLElement {
  static get observedAttributes() {
    return ["open", "title", "dismissible", "sheet-height"];
  }

  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this.handleKeydown = this.handleKeydown.bind(this);
    this.handleBackdropClick = this.handleBackdropClick.bind(this);
    this.previousFocus = null;
    this.dragState = null;
    this.handlePointerDown = this.handlePointerDown.bind(this);
    this.handlePointerMove = this.handlePointerMove.bind(this);
    this.handlePointerUp = this.handlePointerUp.bind(this);
  }

  connectedCallback() {
    if (!this.shadowRoot.hasChildNodes()) {
      this.shadowRoot.innerHTML = `
        <style>
          :host { display: contents; color: var(--text-primary); }
          .backdrop { position: fixed; inset: 0; z-index: 1000; display: grid; place-items: center; padding: 1.5rem; background: color-mix(in srgb, var(--bg) 28%, transparent); backdrop-filter: blur(5px) saturate(130%); -webkit-backdrop-filter: blur(5px) saturate(130%); opacity: 0; visibility: hidden; transition: opacity .22s ease, visibility .22s ease; }
          .dialog { --sheet-height: 70dvh; display: flex; flex-direction: column; width: min(100%, 34rem); max-height: min(80dvh, 48rem); overflow: hidden; border: 2px solid var(--border-color); border-radius: var(--radius); background: var(--bg-2); color: var(--text-primary); box-shadow: 0 1.25rem 4rem color-mix(in srgb, #000 22%, transparent), var(--glass-inner-shadow); transform: translateY(10px) scale(.985); transition: transform .22s ease; }
          :host([open]) .backdrop { opacity: 1; visibility: visible; }
          :host([open]) .dialog { transform: translateY(0) scale(1); }
          .header { display: flex; align-items: center; justify-content: space-between; gap: 1rem; min-height: 4rem; padding: .9rem 1.25rem; border-bottom: 1px solid var(--border-color); background: color-mix(in srgb, var(--bg-hover) 32%, transparent); }
          .title { min-width: 0; padding-left: .85rem; border-left: 3px solid var(--accent); color: var(--text-primary); font-size: 1.1rem; font-weight: 750; letter-spacing: -.015em; line-height: 1.35; }
          .close { display: grid; place-items: center; flex: none; width: 2.25rem; height: 2.25rem; padding: 0; border: 1px solid transparent; border-radius: 9px; background: transparent; color: var(--text-tertiary); cursor: pointer; transition: background-color .18s ease, border-color .18s ease, color .18s ease; }
          .close:hover { border-color: var(--border-color); background: var(--bg-hover); color: var(--text-primary); }
          .close:focus-visible { outline: 2px solid var(--accent-strong); outline-offset: 2px; }
          .close svg { width: 1.15rem; height: 1.15rem; }
          .content { min-height: 0; overflow: auto; padding: 1.5rem; color: var(--text-secondary); line-height: 1.65; overscroll-behavior: contain; }
          .footer { display: flex; justify-content: flex-end; flex-wrap: wrap; gap: .65rem; padding: 1rem 1.25rem; border-top: 1px solid var(--border-color); background: color-mix(in srgb, var(--bg-hover) 24%, transparent); }
          .footer[hidden] { display: none; }\n          .sheet-handle { display: none; }
          @media (max-width: 600px) { .backdrop { align-items: end; padding: 0; backdrop-filter: blur(3px); -webkit-backdrop-filter: blur(3px); } .dialog { width: 100%; height: min(var(--sheet-height), 92dvh); max-height: 92dvh; border: 1px solid var(--border-color); border-bottom: 0; border-radius: 18px 18px 0 0; padding-bottom: env(safe-area-inset-bottom, 0px); transform: translateY(20px); } :host([open]) .dialog { transform: translateY(0); } .sheet-handle { display: block; position: absolute; z-index: 2; top: 0; left: 50%; width: 4rem; height: 1.5rem; padding: 0; border: 0; background: transparent; transform: translateX(-50%); touch-action: none; cursor: grab; } .sheet-handle::after { content: ""; position: absolute; top: .45rem; left: 50%; width: 2.25rem; height: 4px; border-radius: 99px; background: var(--text-tertiary); opacity: .5; transform: translateX(-50%); } .sheet-handle:active { cursor: grabbing; } .header { position: relative; min-height: 3.75rem; padding: 1.1rem 1.25rem .85rem; background: var(--bg-2); } .header::before { content: ''; position: absolute; top: .45rem; left: 50%; width: 2.25rem; height: 4px; border-radius: 99px; background: var(--text-tertiary); opacity: .45; transform: translateX(-50%); } .title { font-size: 1.05rem; } .content { padding: 1.25rem; } .footer { padding: .85rem 1.25rem; } }
          @media (prefers-reduced-motion: reduce) { .backdrop, .dialog { transition-duration: 0ms; } }
        </style>
        <div class="backdrop">
          <section class="dialog" role="dialog" aria-modal="true" aria-labelledby="modal-title">
            <header class="header">\n              <button class="sheet-handle" type="button" aria-label="下にスライドして閉じる"></button>
              <h2 class="title" id="modal-title"></h2>
              <button class="close" type="button" aria-label="閉じる"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M18 6 6 18M6 6l12 12"></path></svg></button>
            </header>
            <div class="content"><slot></slot></div>
            <footer class="footer" hidden><slot name="footer"></slot></footer>
          </section>
        </div>
      `;

      this.shadowRoot.querySelector(".close").addEventListener("click", () => this.close());
      const handle = this.shadowRoot.querySelector(".sheet-handle");
      handle.addEventListener("pointerdown", this.handlePointerDown);
      handle.addEventListener("pointermove", this.handlePointerMove);
      handle.addEventListener("pointerup", this.handlePointerUp);
      handle.addEventListener("pointercancel", this.handlePointerUp);
      this.shadowRoot.querySelector(".backdrop").addEventListener("click", this.handleBackdropClick);
      this.shadowRoot.querySelector("slot[name=footer]").addEventListener("slotchange", () => this.syncFooter());
    }

    this.sync();
    this.syncFooter();
    this.syncSheetHeight();
    if (this.hasAttribute("open")) this.activate();
  }

  disconnectedCallback() {
    document.removeEventListener("keydown", this.handleKeydown);
  }

  attributeChangedCallback() {
    if (!this.shadowRoot) return;
    this.sync();
    this.syncSheetHeight();
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

  syncSheetHeight() {
    const value = (this.getAttribute("sheet-height") || "70dvh").trim();
    const valid = value.endsWith("%") || value.endsWith("px") || value.endsWith("vh") || value.endsWith("dvh") || value.endsWith("svh") || value.endsWith("lvh") || value.endsWith("rem") || value.endsWith("em");
    this.style.setProperty("--sheet-height", valid && /^[0-9.]+(%|px|vh|dvh|svh|lvh|rem|em)$/.test(value) ? value : "70dvh");
  }

  handlePointerDown(event) {
    if (!this.isOpen || event.button !== 0 || window.matchMedia("(min-width: 601px)").matches) return;
    const dialog = this.shadowRoot.querySelector(".dialog");
    this.dragState = { pointerId: event.pointerId, startY: event.clientY, startTime: performance.now(), height: dialog.getBoundingClientRect().height };
    event.currentTarget.setPointerCapture(event.pointerId);
    dialog.style.transition = "none";
    event.preventDefault();
  }

  handlePointerMove(event) {
    if (!this.dragState || event.pointerId !== this.dragState.pointerId) return;
    const delta = Math.max(0, event.clientY - this.dragState.startY);
    const dialog = this.shadowRoot.querySelector(".dialog");
    const backdrop = this.shadowRoot.querySelector(".backdrop");
    dialog.style.transform = "translateY(" + delta + "px)";
    backdrop.style.opacity = String(Math.max(.25, 1 - delta / Math.max(this.dragState.height, 1)));
  }

  handlePointerUp(event) {
    if (!this.dragState || event.pointerId !== this.dragState.pointerId) return;
    const state = this.dragState;
    this.dragState = null;
    const delta = Math.max(0, event.clientY - state.startY);
    const elapsed = Math.max(1, performance.now() - state.startTime);
    const velocity = delta / elapsed;
    const dialog = this.shadowRoot.querySelector(".dialog");
    const backdrop = this.shadowRoot.querySelector(".backdrop");
    dialog.style.transition = "";
    dialog.style.transform = "";
    backdrop.style.opacity = "";
    if (delta > state.height * .25 || velocity > .65) this.close();
  }

  syncFooter() {
    const slot = this.shadowRoot.querySelector("slot[name=footer]");
    const footer = this.shadowRoot.querySelector(".footer");
    if (slot && footer) footer.hidden = slot.assignedNodes({ flatten: true }).length === 0;
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
