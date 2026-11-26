class PageModals extends HTMLElement {
  constructor() {
    super();
    this.modals = new Map();
  }

  create(id, options = {}) {
    if (!id) throw new TypeError("モーダルIDを指定してください。");

    const existing = this.get(id);
    if (existing) return existing;

    const modal = document.createElement("ui-modal");
    modal.id = id;

    if (options.title != null) modal.setAttribute("title", options.title);
    if (options.dismissible === false) modal.setAttribute("dismissible", "false");
    if (options.sheetHeight) modal.setAttribute("sheet-height", options.sheetHeight);
    if (options.dialogWidth) modal.setAttribute("dialog-width", options.dialogWidth);
    if (options.dialogHeight) modal.setAttribute("dialog-height", options.dialogHeight);

    this.append(modal);
    this.modals.set(id, modal);

    return modal;
  }

  get(id) {
    return this.modals.get(id) || this.querySelector(`ui-modal#${CSS.escape(id)}`) || null;
  }

  open(id) {
    const modal = this.get(id);
    if (!modal) return false;
    modal.showModal();
    return true;
  }

  close(id) {
    const modal = this.get(id);
    if (!modal) return false;
    modal.close();
    return true;
  }

  remove(id) {
    const modal = this.get(id);
    if (!modal) return false;
    modal.remove();
    this.modals.delete(id);
    return true;
  }
}

if (!customElements.get("page-modals")) {
  customElements.define("page-modals", PageModals);
}

const ensurePageModals = () => {
  if (!document.querySelector("page-modals")) {
    document.body.append(document.createElement("page-modals"));
  }
};

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", ensurePageModals, { once: true });
} else {
  ensurePageModals();
}

export { PageModals };
