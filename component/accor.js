class Acc extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
  }

  connectedCallback() {
    const header = this.querySelector('button');
    const raw = this.querySelector('div');

    // Shadow DOM 内のルート
    const root = document.createElement('div');
    root.className = 'panel';

    // header をクローンして panel-header に
    const headerClone = header.cloneNode(true);
    headerClone.classList.add('panel-header');

    // アイコン追加
    const icon = document.createElement('span');
    icon.className = 'icon';
    icon.textContent = '＋';
    headerClone.appendChild(icon);

    // 内容ラッパー
    const content = document.createElement('div');
    content.className = 'panel-content';

    const body = document.createElement('div');
    body.className = 'panel-body';

    // ① Light DOM の HTML をそのまま移植（ここが変更点）
    const clonedBody = raw.cloneNode(true);
    body.appendChild(clonedBody);

    content.appendChild(body);

    // Shadow DOM に構築
    root.appendChild(headerClone);
    root.appendChild(content);

    // Shadow DOM にスタイル追加
    const style = document.createElement('style');
    style.textContent = `
      .panel {
        border: 1px solid var(--accent);
        border-radius: var(--radius);
        margin-bottom: 10px;
      }
      .panel-header {
        width: 100%;
        padding: 15px 20px;
        display: flex;
        justify-content: space-between;
        align-items: center;
        background: #fff;
        border: none;
        border-radius: var(--radius);
        cursor: pointer;
        font-size: 16px;
        text-align: left;
      }
      .panel-header:hover {
        background: #f8f9fa;
      }
      .icon {
        font-size: 20px;
        transition: transform 0.3s;
      }
      .panel-header.active .icon {
        transform: rotate(45deg);
      }
      .panel-content {
        height: 0;
        overflow: hidden;
        transition: height 0.3s ease-out;
      }
      .panel-body {
        padding: 20px;
        border-top: 1px solid #eee;
      }
    `;

    this.shadowRoot.appendChild(style);
    this.shadowRoot.appendChild(root);

    // 開閉処理
    headerClone.addEventListener('click', () => {
      const isOpen = headerClone.classList.toggle('active');
      content.style.height = isOpen ? content.scrollHeight + 'px' : '0';
    });
  }
}

customElements.define('com-acc', Acc);
