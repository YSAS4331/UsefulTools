class UIModal extends HTMLElement {
  static get observedAttributes() {
    return ["open", "title", "dismissible", "sheet-height", "dialog-width", "dialog-height", "dialog-min-height"];
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
          :host { --sheet-height: 70dvh; --dialog-width: 48rem; --dialog-height: 85dvh; --dialog-min-height: 0px; display: contents; color: var(--text-primary); }
          .backdrop { position: fixed; inset: 0; z-index: 1000; display: grid; place-items: center; padding: 1.5rem; background: color-mix(in srgb, var(--bg) 45%, transparent); opacity: 0; visibility: hidden; transition: opacity .22s ease, visibility .22s ease; }
          .dialog { display: flex; flex-direction: column; width: min(100%, var(--dialog-width)); max-height: var(--dialog-height); min-height: var(--dialog-min-height); overflow: hidden; border: 1px solid var(--border-color); border-radius: var(--radius); background: var(--bg-2); color: var(--text-primary); box-shadow: var(--glass-inner-shadow); transform: translateY(10px) scale(.985); transition: transform .22s ease; }
          :host([open]) .backdrop { opacity: 1; visibility: visible; }
          :host([open]) .dialog { transform: translateY(0) scale(1); }
          .header { display: flex; align-items: center; justify-content: space-between; gap: 1rem; min-height: 3.5rem; padding: .75rem 1rem; border-bottom: 1px solid var(--border-color); background: var(--bg-2); }
          .title { min-width: 0; color: var(--text-primary); font-size: .95rem; font-weight: 700; line-height: 1.4; }
          .close { display: grid; place-items: center; flex: none; width: 2.25rem; height: 2.25rem; padding: 0; border: 1px solid transparent; border-radius: 9px; background: transparent; color: var(--text-tertiary); cursor: pointer; transition: background-color .18s ease, border-color .18s ease, color .18s ease; }
          .close:hover { border-color: var(--border-color); background: var(--bg-hover); color: var(--text-primary); }
          .close:focus-visible { outline: 2px solid var(--accent-strong); outline-offset: 2px; }
          .close svg { width: 1.15rem; height: 1.15rem; }
          .content { min-height: 0; overflow: auto; padding: 1.25rem; color: var(--text-secondary); line-height: 1.65; overscroll-behavior: contain; }
          :host([dialog-min-height]) .content { flex: 1; }
          .footer { display: flex; justify-content: flex-end; flex-wrap: wrap; gap: .65rem; padding: .85rem 1rem; border-top: 1px solid var(--border-color); background: var(--bg-2); }
          .footer[hidden] { display: none; }\n          @media (max-width: 600px) { .backdrop { align-items: end; padding: 0; backdrop-filter: blur(3px); -webkit-backdrop-filter: blur(3px); } .dialog { width: 100%; height: min(var(--sheet-height), 92dvh); max-height: 92dvh; border: 1px solid var(--border-color); border-bottom: 0; border-radius: 18px 18px 0 0; padding-bottom: env(safe-area-inset-bottom, 0px); transform: translateY(20px); } :host([open]) .dialog { transform: translateY(0); } .header { position: relative; min-height: 3.75rem; padding: 1.1rem 1.25rem .85rem; background: var(--bg-2); touch-action: pan-x; user-select: none; -webkit-user-select: none; cursor: grab; } .header:active { cursor: grabbing; } .header::before { content: ''; position: absolute; top: .45rem; left: 50%; width: 2.25rem; height: 4px; border-radius: 99px; background: var(--text-tertiary); opacity: .45; transform: translateX(-50%); } .title { font-size: 1.05rem; } .content { padding: 1.25rem; } .footer { padding: .85rem 1.25rem; } }
          @media (prefers-reduced-motion: reduce) { .backdrop, .dialog { transition-duration: 0ms; } }
        </style>
        <div class="backdrop">
          <section class="dialog" role="dialog" aria-modal="true" aria-labelledby="modal-title">
            <header class="header">\n              <h2 class="title" id="modal-title"></h2>
              <button class="close" type="button" aria-label="閉じる"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M18 6 6 18M6 6l12 12"></path></svg></button>
            </header>
            <div class="content"><slot></slot></div>
            <footer class="footer" hidden><slot name="footer"></slot></footer>
          </section>
        </div>
      `;

      this.shadowRoot.querySelector(".close").addEventListener("click", () => this.close());
      const header = this.shadowRoot.querySelector(".header");
      header.addEventListener("pointerdown", this.handlePointerDown);
      header.addEventListener("pointermove", this.handlePointerMove);
      header.addEventListener("pointerup", this.handlePointerUp);
      header.addEventListener("pointercancel", this.handlePointerUp);
      this.shadowRoot.querySelector(".backdrop").addEventListener("click", this.handleBackdropClick);
      this.shadowRoot.querySelector("slot[name=footer]").addEventListener("slotchange", () => this.syncFooter());
    }

    this.sync();
    this.syncFooter();
    this.syncSheetHeight();
    this.syncDialogSize();
    if (this.hasAttribute("open")) this.activate();
  }

  disconnectedCallback() {
    document.removeEventListener("keydown", this.handleKeydown);
  }

  attributeChangedCallback() {
    if (!this.shadowRoot) return;
    this.sync();
    this.syncSheetHeight();
    this.syncDialogSize();
    if (this.isConnected) {
      if (this.hasAttribute("open")) this.activate();
      else this.deactivate();
    }
  }

  get isOpen() {
    return this.hasAttribute("open");
  }

  open() {
    if (this.isOpen) return;
    this.previousFocus = document.activeElement;
    this.setAttribute("open", "");
    this.dispatchEvent(new CustomEvent("open", { bubbles: true, composed: true }));
  }

  showModal() {
    this.open();
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

  syncDialogSize() {
    const validLength = (value) =>
      /^(\d+(?:\.\d+)?)(px|rem|em|vw|vh|dvw|dvh|svh|lvh|%)$/.test(value);

    const width = (this.getAttribute("dialog-width") || "48rem").trim();
    const height = (this.getAttribute("dialog-height") || "85dvh").trim();
    const minHeight = (this.getAttribute("dialog-min-height") || "0px").trim();

    this.style.setProperty("--dialog-width", validLength(width) ? width : "48rem");
    this.style.setProperty("--dialog-height", validLength(height) ? height : "85dvh");
    this.style.setProperty("--dialog-min-height", validLength(minHeight) ? minHeight : "0px");
  }

  handlePointerDown(event) {
    if (!this.isOpen || event.button !== 0 || window.matchMedia("(min-width: 601px)").matches) return;
    if (event.target.closest("button")) return;

    const dialog = this.shadowRoot.querySelector(".dialog");
    this.dragState = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      currentY: event.clientY,
      startTime: performance.now(),
      height: dialog.getBoundingClientRect().height,
      isVertical: false
    };

    event.currentTarget.setPointerCapture(event.pointerId);
  }

  handlePointerMove(event) {
    const state = this.dragState;
    if (!state || event.pointerId !== state.pointerId) return;

    const deltaX = event.clientX - state.startX;
    const deltaY = event.clientY - state.startY;

    if (!state.isVertical) {
      const threshold = state.height * .02;
      if (Math.abs(deltaX) < threshold && Math.abs(deltaY) < threshold) return;

      if (Math.abs(deltaX) > Math.abs(deltaY)) {
        this.dragState = null;
        return;
      }

      state.isVertical = true;
      this.shadowRoot.querySelector(".dialog").style.transition = "none";
    }

    state.currentY = event.clientY;
    const distance = Math.max(0, deltaY);
    const dialog = this.shadowRoot.querySelector(".dialog");
    const backdrop = this.shadowRoot.querySelector(".backdrop");

    dialog.style.transform = "translateY(" + distance + "px)";
    backdrop.style.opacity = String(Math.max(.25, 1 - distance / Math.max(state.height, 1)));

    if (event.cancelable) event.preventDefault();
  }

  handlePointerUp(event) {
    const state = this.dragState;
    if (!state || event.pointerId !== state.pointerId) return;
    this.dragState = null;

    const deltaY = event.clientY - state.startY;
    const distance = Math.max(0, deltaY);
    const elapsed = Math.max(1, performance.now() - state.startTime);
    const velocity = distance / elapsed;
    const dialog = this.shadowRoot.querySelector(".dialog");
    const backdrop = this.shadowRoot.querySelector(".backdrop");

    dialog.style.transition = "";
    dialog.style.transform = "";
    backdrop.style.opacity = "";

    if (state.isVertical && (velocity > .5 || distance >= state.height * .5)) {
      this.close();
    }
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
