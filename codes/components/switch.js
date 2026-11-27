class UISwitch extends HTMLElement {
  static get observedAttributes() {
    return ["checked", "disabled"];
  }

  constructor() {
    super();
    this.attachShadow({mode:"open"});
    this.onClick = this.onClick.bind(this);
  }

  connectedCallback() {
    if (!this.shadowRoot.hasChildNodes()) {
      this.shadowRoot.innerHTML = `
        <style>
          :host {
            display:inline-flex;
            align-items:center;
            gap:.7em;
            max-width:100%;
            color:var(--text-secondary);
            font:inherit;
            font-size:.85em;
            cursor:pointer;
            user-select:none;
          }
          :host([disabled]) { opacity:.5; cursor:default; }
          button {
            position:relative;
            flex:none;
            box-sizing:border-box;
            width:2.5em;
            height:1.45em;
            padding:0;
            border:1px solid var(--border-color);
            border-radius:999px;
            background:var(--bg-hover);
            cursor:inherit;
            transition:background-color .18s,border-color .18s;
          }
          button::before {
            content:"";
            position:absolute;
            top:.16em;
            left:.16em;
            width:1.05em;
            height:1.05em;
            border-radius:50%;
            background:var(--text-tertiary);
            transition:transform .18s,background-color .18s;
          }
          :host([checked]) button {
            border-color:var(--accent-strong);
            background:var(--accent-strong);
          }
          :host([checked]) button::before {
            transform:translateX(1.05em);
            background:white;
          }
          button:focus-visible {
            outline:2px solid var(--accent-strong);
            outline-offset:2px;
          }
          @media(prefers-reduced-motion:reduce) {
            button,button::before { transition:none; }
          }
        </style>
        <button type="button" role="switch" aria-checked="false" part="control"></button>
        <slot></slot>
      `;
      this.shadowRoot.querySelector("button").addEventListener("click",this.onClick);
    }
    this.sync();
  }

  attributeChangedCallback() {
    this.sync();
  }

  get checked() {
    return this.hasAttribute("checked");
  }

  set checked(value) {
    this.toggleAttribute("checked",Boolean(value));
  }

  get disabled() {
    return this.hasAttribute("disabled");
  }

  set disabled(value) {
    this.toggleAttribute("disabled",Boolean(value));
  }

  onClick() {
    if (this.disabled) return;
    this.checked = !this.checked;
    this.dispatchEvent(new Event("change",{bubbles:true,composed:true}));
  }

  sync() {
    const button=this.shadowRoot?.querySelector("button");
    if (!button) return;
    button.setAttribute("aria-checked",String(this.checked));
    button.disabled=this.disabled;
    button.setAttribute("aria-label",this.textContent.trim() || "切り替え");
  }
}

customElements.define("ui-switch",UISwitch);
