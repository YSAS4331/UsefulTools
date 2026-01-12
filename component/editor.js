class Editor extends HTMLElement {
  #lang;
  #indent = 2;

  static get observedAttributes() {
    return ['lang', 'value', 'rows', 'height', 'indent'];
  }

  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this.shadowRoot.innerHTML = `
      <style>
        :host { display: block; --font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, "Roboto Mono", "Noto Sans Mono", monospace; --font-size: 14px; --line-height: 1.4; }
        h4 {margin: 0;padding: 0; z-index: 1; background: var(--high-header, #fff);}
        .wrapper { position: relative; overflow: auto; }
        .flexWrapper { display:flex; border:1px solid #e5e7eb; border-radius:6px; overflow:hidden; background:#fff; }
        .gutter { background:#f6f8fa; color:#6b7280; padding:8px 10px; text-align:right; user-select:none; box-sizing:border-box; }
        .gutter p { margin: 0; padding: 0; line-height: var(--line-height); font-size: var(--font-size); }
        .gutter p.active { background:var(--accent); }
        .editor-wrap { position:relative; flex:1; min-width:0; }
        /* 両者を完全に一致させる（ズレ防止） */
        .highlight, textarea {
          font-family: var(--font-family);
          font-size: var(--font-size);
          line-height: var(--line-height);
          padding: 8px 12px;
          margin: 0;
          box-sizing: border-box;
          white-space: pre;
          word-break: break-word;
          letter-spacing: 0;
          overflow: hidden;
          tab-size: 2;
          border: none;
          outline: none;
        }
        .highlight {
          position:absolute;
          inset:0;
          pointer-events:none;
          color:#111827;
          user-select: none;
        }
        textarea {
          position:relative;
          width:100%;
          min-height:200px;
          height: 100%;
          background:transparent;
          color: transparent;
          caret-color: #111827;
          border:none;
          outline:none;
          resize:none;
          overflow:auto;
        }
        /* 選択時に見やすくするための補助（選択色はブラウザ依存） */
        textarea::selection { background: rgba(0,120,212,0.12); }
        
        .highlight > .key {
          color: var(--high-key, #a626a4);
        }
        .highlight > .comment {
          color: var(--high-com, #a0a1a7);
          font-style: italic;
        }
        .highlight > .string {
          color: var(--high-str, #50a14f);
        }
      </style>

      <h4>${'JS'}</h4>
      <div class="wrapper" part="editor">
        <div class="flexWrapper">
          <div class="gutter" part="gutter" aria-hidden="true"></div>
          <div class="editor-wrap">
            <div class="highlight" part="highlight" aria-hidden="true"></div>
            <textarea part="textarea" role="textbox" aria-multiline="true" spellcheck="false" tabindex="0"></textarea>
          </div>
        </div>
      </div>
    `;
  }

  connectedCallback() {
    this.#lang = this.getAttribute('lang') ?? 'plaintext';
    this.$area = this.shadowRoot.querySelector('textarea');
    this.$layer = this.shadowRoot.querySelector('.highlight');
    this.$gutter = this.shadowRoot.querySelector('.gutter');
    this.$wrapper = this.shadowRoot.querySelector('.wrapper');
    this.$header = this.shadowRoot.querySelector('h4');

    if (this.hasAttribute('value')) this.$area.value = this.getAttribute('value');
    if (this.hasAttribute('rows')) this.$area.style.height = `${this.getAttribute('rows') * 1.4}em`;
    if (this.hasAttribute('height')) this.$area.style.height = this.getAttribute('height');
    if (this.hasAttribute('indent')) {
      const n = Number(this.getAttribute('indent'));
      if (!Number.isNaN(n) && n >= 0) {
        this.#indent = n;
      } else {
        this.#indent = 2;
      }
    }

    // 初期描画（即時）
    this.#renderAll();

    // イベント（すべて即時反映）
    this.$area.addEventListener('input', () => this.#renderAll());
    this.$area.addEventListener('scroll', () => this.#syncScroll(), { passive: true });
    this.$area.addEventListener('click', () => this.#updateActiveLine());
    this.$area.addEventListener('keyup', () => this.#updateActiveLine());
    this.$area.addEventListener('paste', () => setTimeout(() => this.#renderAll(), 0));

    // Tab をスペースに（即時）
    this.$area.addEventListener('keydown', e => {
      if (e.key === 'Tab') {
        e.preventDefault();
        const start = this.$area.selectionStart;
        const end = this.$area.selectionEnd;
        const insert = ' '.repeat(this.#indent);
        const v = this.$area.value;
        this.$area.value = v.slice(0, start) + insert + v.slice(end);
        this.$area.selectionStart = this.$area.selectionEnd = start + insert.length;
        this.#renderAll();
      }
      this.#updateActiveLine();
    });

    // highlight 側のスクロールが変わっても textarea を合わせる（双方向）
    this.$layer.addEventListener('scroll', () => {
      this.$area.scrollTop = this.$layer.scrollTop;
      this.$area.scrollLeft = this.$layer.scrollLeft;
    });

    // サイズ変化に対応
    this._ro = new ResizeObserver(() => this.#syncScroll());
    this._ro.observe(this);
  }

  disconnectedCallback() {
    if (this._ro) this._ro.disconnect();
  }

  attributeChangedCallback(name, oldVal, newVal) {
    if (oldVal === newVal) return;
    if (name === 'lang') this.#lang = newVal ?? 'plaintext';
    if (name === 'value') {
      this.$area.value = newVal ?? '';
      this.#renderAll();
    }
    if (name === 'rows' || name === 'height') {
      if (this.hasAttribute('height')) this.$area.style.height = this.getAttribute('height');
      else if (this.hasAttribute('rows')) this.$area.style.height = `${this.getAttribute('rows') * 1.4}em`;
    }
    if (name === 'indent') {
      const n = Number(newVal);
      if (!Number.isNaN(n) && n >= 0) {
        this.#indent = n;
      } else {
        this.#indent = 2;
      }
    }
  }

  // ---------- helpers ----------
  #escapeHtml(str) {
    return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  #renderHighlight(value) {
    const escaped = this.#escapeHtml(value || '');
    const highlighted = this.#applyHighlight(escaped);
    this.$layer.innerHTML = highlighted;
  }
  #keywords = {
    plaintext: [],
    js: ['await', 'async', 'break', 'case', 'catch', 'class', 'const', 'continue',
    'debugger', 'default', 'delete', 'do', 'else', 'enum', 'export',
    'extends', 'false', 'finally', 'for', 'function', 'if', 'import',
    'in', 'instanceof', 'new', 'null', 'return', 'super', 'switch',
    'this', 'throw', 'true', 'try', 'typeof', 'var', 'void', 'while',
    'with', 'yield', 'let', 'static', 'implements', 'interface',
    'package', 'private', 'protected', 'public', 'document'],
    py: ['False', 'None', 'True', 'and', 'as', 'assert', 'async', 'await',
    'break', 'class', 'continue', 'def', 'del', 'elif', 'else', 'except',
    'finally', 'for', 'from', 'global', 'if', 'import', 'in', 'is', 'lambda',
    'nonlocal', 'not', 'or', 'pass', 'raise', 'return', 'try', 'while', 'with', 'yield']
  };

  #applyHighlight(code) {
    if (!code) return '';
    const keywords = this.#keywords[this.#lang] || this.#keywords.plaintext;

    const keywordReg = new RegExp(
      `\\b(${keywords.join('|')})\\b(?![^<]*>)`,
      'g'
    );
    const lastcode = code
      .replace(/(\/\/[^\n]*)/g, '<span class="comment">$1</span>')
      .replace(/(['"])([^'"]*?)\1(?![^<]*>)/g, '<span class="string">$&</span>')
      .replace(/`[\s\S]*?`/g, '<span class="string">$&</span>')
      .replace(keywordReg, '<span class="key">$1</span>');

    return lastcode;
  }
  #updateLineNumbers(value) {
    const lines = value === '' ? 1 : value.split('\n').length;
    const html = Array.from({ length: lines }, (_, i) => `<p>${i + 1}</p>`).join('');
    this.$gutter.innerHTML = html;
    const digits = String(lines).length;
    const minWidthEm = Math.max(3.2, 0.9 + digits * 0.6);
    this.$gutter.style.minWidth = `${minWidthEm}em`;
    this.#updateActiveLine();
  }

  #getActiveLineIndex() {
    const pos = this.$area.selectionStart;
    return this.$area.value.slice(0, pos).split('\n').length - 1;
  }

  #getSelectedLineRange() {
    const v = this.$area.value;
    const start = this.$area.selectionStart;
    const end = this.$area.selectionEnd;
  
    const startLine = v.slice(0, start).split('\n').length - 1;
    const endLine   = v.slice(0, end).split('\n').length - 1;
  
    return [startLine, endLine];
  }

  #updateActiveLine() {
    const [start, end] = this.#getSelectedLineRange();
    const ps = this.$gutter.querySelectorAll('p');
  
    ps.forEach((p, i) => {
      p.classList.toggle('active', i >= start && i <= end);
    });
  }

  #syncScroll() {
    this.$layer.scrollTop = this.$area.scrollTop;
    this.$layer.scrollLeft = this.$area.scrollLeft;
  }

  #renderAll() {
    const v = this.$area.value;
    this.#renderHighlight(v);
    this.#updateLineNumbers(v);
    this.#updateActiveLine();
    this.#syncScroll();
    // 属性反映（外部から監視する場合）
    this.setAttribute('value', v);
    this.dispatchEvent(new CustomEvent('change', { detail: { value: v } }));
  }

  // public API
  get value() { return this.$area?.value ?? ''; }
  set value(v) { if (this.$area) { this.$area.value = v; this.#renderAll(); this.setAttribute('value', v); } }
}

customElements.define('custom-editor', Editor);
