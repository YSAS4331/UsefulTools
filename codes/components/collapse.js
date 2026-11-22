class UICollapse extends HTMLElement {
  static get observedAttributes() {
    return ['label', 'duration', 'easing', 'open'];
  }

  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this.onToggleClick = this.onToggleClick.bind(this);
  }

  connectedCallback() {
    if (!this.shadowRoot.hasChildNodes()) {
      this.shadowRoot.innerHTML = `
        <style>
          :host {
            display: block;
            min-width: 0;
          }

          .toggle {
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: .75rem;
            width: 100%;
            padding: 0 .25rem 0 .75rem;
            border: 0;
            position: relative;
            border-left: 0;
            border-radius: 0;
            background: transparent;
            color: var(--text-secondary);
            font: inherit;
            font-size: .85rem;
            font-weight: 700;
            text-align: left;
            cursor: pointer;
          }

          .toggle::before {
            content: "";
            position: absolute;
            left: 0;
            top: 50%;
            width: 3px;
            height: 1rem;
            border-radius: 2px;
            background: var(--accent);
            transform: translateY(-50%);
          }

          .label {
            display: flex;
            align-items: center;
            min-width: 0;
          }

          slot[name="label"]::slotted(*) {
            display: inline-flex;
            align-items: center;
            gap: .4rem;
          }

          .toggle:focus-visible {
            outline: 2px solid var(--accent);
            outline-offset: 3px;
          }

          .chevron {
            width: 1rem;
            height: 1rem;
            flex: none;
            transition: transform var(--collapse-duration, 240ms) var(--collapse-easing, ease);
          }

          :host([open]) .chevron {
            transform: rotate(90deg);
          }

          .panel {
            display: grid;
            grid-template-rows: 0fr;
            transition: grid-template-rows var(--collapse-duration, 240ms) var(--collapse-easing, ease);
          }

          :host([open]) .panel {
            grid-template-rows: 1fr;
          }

          .panel-inner {
            min-height: 0;
            overflow: hidden;
          }

          .content {
            margin-left: .75rem;
            padding: .75rem 0 0 .75rem;
            border-left: 1px solid var(--border-color);
          }

          @media (prefers-reduced-motion: reduce) {
            .panel, .chevron {
              transition-duration: 0ms !important;
            }
          }
        </style>
        <button class="toggle" type="button" aria-expanded="false">
          <span class="label"><slot name="label"><span class="label-fallback"></span></slot></span>
          <svg class="chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor"
            stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
            <path d="m9 18 6-6-6-6"></path>
          </svg>
        </button>
        <div class="panel">
          <div class="panel-inner">
            <div class="content"><slot></slot></div>
          </div>
        </div>
      `;
      this.shadowRoot.querySelector('.toggle').addEventListener('click', this.onToggleClick);
      this.shadowRoot.querySelector('slot[name="label"]').addEventListener('slotchange', () => this.sync());
    }

    this.sync();
  }

  attributeChangedCallback() {
    if (this.isConnected) this.sync();
  }

  get isOpen() {
    return this.hasAttribute('open');
  }

  set isOpen(value) {
    this.toggleAttribute('open', Boolean(value));
  }

  onToggleClick() {
    this.isOpen = !this.isOpen;
    this.dispatchEvent(new CustomEvent('toggle', {
      bubbles: true,
      composed: true,
      detail: { open: this.isOpen }
    }));
  }

  sync() {
    const button = this.shadowRoot.querySelector('.toggle');
    if (!button) return;

    const label = this.getAttribute('label') || '開閉';
    const duration = this.getAttribute('duration') || '240ms';
    const easing = this.getAttribute('easing') || 'ease';

    this.style.setProperty('--collapse-duration', /^\d+(\.\d+)?$/.test(duration) ? `${duration}ms` : duration);
    this.style.setProperty('--collapse-easing', easing);

    const labelSlot = this.shadowRoot.querySelector('slot[name="label"]');
    const fallback = this.shadowRoot.querySelector('.label-fallback');
    fallback.textContent = label;
    const slottedLabel = labelSlot.assignedNodes({ flatten: true })
      .map(node => node.textContent || '')
      .join('')
      .trim();
    const accessibleLabel = slottedLabel || label;

    button.setAttribute('aria-expanded', String(this.isOpen));
    button.setAttribute('aria-label', `${accessibleLabel}${this.isOpen ? 'を閉じる' : 'を開く'}`);

    const panel = this.shadowRoot.querySelector('.panel');
    panel.setAttribute('aria-hidden', String(!this.isOpen));
    panel.inert = !this.isOpen;
  }
}

customElements.define('ui-collapse', UICollapse);
