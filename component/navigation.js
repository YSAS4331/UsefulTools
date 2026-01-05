class ComNav extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
  }

  connectedCallback() {
    const tgs = document.querySelectorAll('section > h3');

    const nav = document.createElement('nav');
    const ul = document.createElement('ul');

    // ハイライトバー
    const highlight = document.createElement('div');
    highlight.className = 'nav-highlight';
    nav.appendChild(highlight);

    const links = [];

    tgs.forEach(el => {
      const li = document.createElement('li');
      const a = document.createElement('a');

      if (!el.id) {
        el.id = el.textContent
          .trim()
          .toLowerCase()
          .replace(/\s+/g, '-')
          .replace(/[^\w\-]/g, '');
      }

      a.textContent = el.textContent;
      a.href = `#${el.id}`;

      li.appendChild(a);
      ul.appendChild(li);
      links.push(a);
    });

    nav.appendChild(ul);

    // ===== CSS =====
    const style = document.createElement('style');
    style.textContent = `
      :host {
        display: block;
      }

      nav {
        position: relative;
        font-family: inherit;
      }

      nav ul {
        list-style: none;
        padding: 0;
        margin: 0;
      }

      nav li {
        position: relative;
        padding-left: 12px;
      }

      nav a {
        display: block;
        padding: 8px 0;
        color: inherit;
        text-decoration: none;
      }

      .nav-highlight {
        position: absolute;
        left: 0;
        width: 4px;
        background: var(--accent, #00aaff);
        border-radius: 2px;
        transition:
          top 0.25s ease,
          height 0.25s ease;
      }
    `;

    this.shadowRoot.append(style, nav);

    // ===== IntersectionObserver =====
    const visible = new Set();

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          visible.add(entry.target);
        } else {
          visible.delete(entry.target);
        }
      });

      updateHighlight();
    }, {
      root: null,
      threshold: 0.3
    });

    tgs.forEach(h3 => observer.observe(h3));

    // ===== ハイライト更新 =====
    const updateHighlight = () => {
      if (visible.size === 0) return;

      const topMost = [...visible].sort((a, b) => {
        return a.getBoundingClientRect().top - b.getBoundingClientRect().top;
      })[0];

      const link = links.find(a => a.getAttribute('href') === `#${topMost.id}`);
      const li = link.parentElement;

      const rect = li.getBoundingClientRect();
      const navRect = nav.getBoundingClientRect();

      highlight.style.top = `${rect.top - navRect.top}px`;
      highlight.style.height = `${rect.height}px`;
    };
  }
}

customElements.define('com-nav', ComNav);
