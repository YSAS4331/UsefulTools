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
            min-height: 2.5rem;
            box-sizing: border-box;
            padding: .5rem .25rem .5rem .75rem;
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
            top: 0;
            bottom: 0;
            width: 3px;
            border-radius: 2px;
            background: var(--accent);
          }

          .label {
            display: flex;
            align-items: center;
            min-width: 0;
            gap: .4rem;
          }

          slot[name="label"]::slotted(*) {
            display: inline-flex;
            align-items: center;
            gap: .4rem;
          }

          @media (min-width: 601px) {
            :host-context(app-sidebar.collapsed) .toggle {
              justify-content: center;
              padding: .5rem 0;
            }

            :host-context(app-sidebar.collapsed) .chevron,
            :host-context(app-sidebar.collapsed) .toggle::before {
              display: none;
            }

            :host-context(app-sidebar.collapsed) .label {
              width: 100%;
              justify-content: center;
            }

            :host-context(app-sidebar.collapsed) slot[name="label"]::slotted(.label-text) {
              display: none;
            }

            :host-context(app-sidebar.collapsed) slot[name="label"]::slotted(.label-icon) {
              justify-content: center;
            }
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

          @media (min-width: 601px) {
            :host-context(app-sidebar.collapsed)[flyout] .panel {
              position: fixed;
              z-index: 1100;
              left: var(--flyout-left, 72px);
              top: var(--flyout-top, 12px);
              width: 260px;
              max-width: calc(100vw - 84px);
              box-sizing: border-box;
              grid-template-rows: 1fr;
              padding: 12px;
              border: 1px solid var(--border-color);
              border-radius: 10px;
              background: var(--bg-2);
              color: var(--text-primary);
              box-shadow: 0 8px 28px rgb(0 0 0 / 18%);
            }

            :host-context(app-sidebar.collapsed)[flyout] .panel-inner {
              max-height: calc(100dvh - 48px);
              overflow: auto;
              scrollbar-width: thin;
            }

            :host-context(app-sidebar.collapsed)[flyout] .content {
              margin: 0;
              padding: 0;
              border: 0;
            }

            :host-context(app-sidebar.collapsed)[flyout] .content ::slotted(.sidebar-section-list) {
              max-height: none;
              overflow: visible;
            }
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

      this.flyoutPanel = this.shadowRoot.querySelector('.panel');
      this.flyoutTimer = null;
      this.handleFlyoutEnter = () => this.showFlyout();
      this.handleFlyoutLeave = () => this.scheduleFlyoutClose();
      this.flyoutPanel.addEventListener('pointerenter', () => clearTimeout(this.flyoutTimer));
      this.flyoutPanel.addEventListener('pointerleave', this.handleFlyoutLeave);
      this.addEventListener('pointerenter', this.handleFlyoutEnter);
      this.addEventListener('pointerleave', this.handleFlyoutLeave);
    }

    this.sync();
  }

  showFlyout() {
    if (window.matchMedia('(max-width: 600px)').matches ||
        !this.closest('app-sidebar.collapsed')) return;

    clearTimeout(this.flyoutTimer);
    this.setAttribute('flyout', '');
    this.flyoutPanel.inert = false;
    this.flyoutPanel.setAttribute('aria-hidden', 'false');
    const rect = this.getBoundingClientRect();
    const panel = this.flyoutPanel;

    this.style.setProperty('--flyout-left', String(Math.max(8, rect.right + 8)) + 'px');
    this.style.setProperty('--flyout-top', String(Math.max(12, rect.top)) + 'px');

    requestAnimationFrame(() => {
      if (!this.hasAttribute('flyout')) return;
      const panelRect = panel.getBoundingClientRect();
      const left = Math.min(rect.right + 8, window.innerWidth - panelRect.width - 8);
      const top = Math.max(12, Math.min(rect.top, window.innerHeight - panelRect.height - 12));
      this.style.setProperty('--flyout-left', String(Math.max(8, left)) + 'px');
      this.style.setProperty('--flyout-top', String(top) + 'px');
    });
  }

  scheduleFlyoutClose() {
    clearTimeout(this.flyoutTimer);
    this.flyoutTimer = setTimeout(() => {
      this.removeAttribute('flyout');
      this.flyoutPanel.inert = !this.isOpen;
      this.flyoutPanel.setAttribute('aria-hidden', String(!this.isOpen));
    }, 140);
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

  disconnectedCallback() {
    clearTimeout(this.flyoutTimer);
  }

  sync() {
    const button = this.shadowRoot.querySelector('.toggle');
    if (!button) return;

    const label = this.getAttribute('label') || '開閉';
    const duration = this.getAttribute('duration') || '240ms';
    const easing = this.getAttribute('easing') || 'ease';

    this.style.setProperty('--collapse-duration', /^\\d+(\\.\\d+)?$/.test(duration) ? `${duration}ms` : duration);
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
