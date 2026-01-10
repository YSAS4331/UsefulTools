import $ from 'https://ysas4331.github.io/UsefulTools/fncs/utils.js';

class Header extends HTMLElement {
  #Style = `
    header {
      max-width: 1100px;
      width: 80%;
      margin: 1rem auto;
      padding: 0.35rem 1.2rem;

      background: color-mix(in srgb, var(--glassBg) 85%, transparent 15%);
      backdrop-filter: blur(var(--glassBlur));
      border: var(--borderSize) solid var(--accent);
      border-radius: var(--radius);

      display: flex;
      align-items: center;
      gap: 8px;

      position: fixed;
      left: 50%;
      top: 1rem;
      transform: translateX(-50%);
      z-index: 1000;
    }

    #searchBar {
      border-radius: var(--radius);
      border: var(--borderSize) dashed var(--accent);
      padding: 0.25rem 0.7rem;
      display: flex;
      gap: 5px;
      align-items: center;
      transition: transform .5s ease;
    }
    #searchBar > input {
      flex: 1;
      border: none;
      outline: none;
      background: none;
    }
    #searchBar > input::placeholder {
      user-select: none;
      transition: opacity .3s ease;
    }
    #searchBar > input:focus::placeholder {
      opacity: 0.4;
    }

    #searchBtn {
      border-radius: var(--radius);
      overflow: hidden;
      padding: 0.4rem 0.9rem;
    }
    #searchBtn i {
      transition: transform .25s ease;
    }
    #searchBtn:hover i {
      transform: translateX(2.5px);
    }

    #buttons {
      flex: 1;
      display: flex;
      gap: 3px;
      flex-direction: row-reverse;
      height: 100%;
    }
    #buttons > button {
      border-radius: 9px;
      padding: .35rem;
      aspect-ratio: 1/1;
      display: flex;
      justify-content: center;
      align-items: center;
      border: none;
      background: none;
      cursor: pointer;
      transition: all .5s ease;
      font-size: clamp(1.3rem, 2vw, 1.5rem);
    }
    #buttons > button:hover {
      background: color-mix(in srgb, var(--accentGrey) 75%, transparent 25%);
    }
    #buttons > .themeBtn {
      color: color-mix(in srgb, var(--accentGrey) 90%, var(--bg) 10%);
    }
    #buttons > .themeBtn:hover {
      color: var(--bg);
    }

    @media(max-width:768px) {
      #searchBtn > span {
        display: none;
      }
      header {
        width: 85%;
      }
    }
  `;

  #HTML = `
    <header>
      <a href="/UsefulTools/"><span>Useful Tools</span></a>

      <div id="searchBar">
        <i class="fa-solid fa-magnifying-glass"></i>
        <input type="text" placeholder="ツールを検索する..." id="searchContent">
        <button id="searchBtn">
          <span>検索する</span>
          <i class="fa-solid fa-arrow-right"></i>
        </button>
      </div>

      <div id="buttons">
        <button id="favoriteTools" title="お気に入りのツール">
          <i class="fa-solid fa-heart" style="color: #FFD761;" class="nostyle"></i>
        </button>
        <button id="settings" title="設定を開く" class="nostyle themeBtn">
          <i class="fa-solid fa-user-gear"></i>
        </button>
        <button id="colorTheme" title="テーマカラーを変更" class="nostyle themeBtn">
          <i class="fa-solid fa-palette"></i>
        </button>
      </div>
    </header>
  `;

  #theme = ['blue', 'green', 'yellow', 'orange', 'red', 'purple', 'grey'];
  #themeNum = 0;

  connectedCallback() {
    this.render();
    this.#attachEvents();
    this.#applyTheme(localStorage.getItem('USEFUL-theme') || 0, true);
  }

  render() {
    this.innerHTML = `<style>${this.#Style}</style>${this.#HTML}`;

    this.$favorite = this.querySelector('#favoriteTools');
    this.$settings = this.querySelector('#settings');
    this.$theme = this.querySelector('#colorTheme');
  }

  #applyTheme(n = 1, absolute = false) {
    const themes = this.#theme;

    if (absolute) {
      this.#themeNum = Number(n);
    } else {
      this.#themeNum = (this.#themeNum + n) % themes.length;
    }

    const next = themes[this.#themeNum];
    const html = document.documentElement.classList;

    html.remove(...themes);
    html.add(next);

    localStorage.setItem('USEFUL-theme', this.#themeNum);
  }

  #showSetting() {
    const { content } = $.dialog();

    content.innerHTML = `
      <style>
        .sidebar {
          width: 160px;
          padding: 0;
          margin: 0;
          list-style: none;
          border-right: 2px solid var(--accent);
        }
        .sidebar li {
          width: 100%;
        }
        .sidebar button.nostyle {
          width: 100%;
          padding: .6rem .8rem;
          text-align: left;
          background: none;
          border: none;
          cursor: pointer;
          font-size: 1rem;
          transition: background .25s ease;
        }
        .sidebar li.active button {
          background: color-mix(in srgb, var(--accent) 25%, transparent 75%);
          font-weight: bold;
        }
        .sidebar button:hover {
          background: color-mix(in srgb, var(--accentGrey) 40%, transparent 60%);
        }

        .main > div {
          display: none;
          position: relative;
          overflow-y: auto;
        }
        .main > div.active {
          display: block;
          height: 100%;
        }
        .setting-section {
          position: relative;
        }
        .setting-section h3 {
          position: sticky;
          top: 0;
        }

        .setting-item {
          margin-bottom: 1rem;
        }
        .setting-item label {
          display: block;
          margin-bottom: .3rem;
        }
        .setting-item input[type="range"] {
          width: 100%;
        }
      </style>

      <div style="display:flex;width:100%;height:100%;">
        <ul class="sidebar" role="tab">
          <li data-tab="theme" class="active">
            <button class="nostyle">テーマ</button>
          </li>
          <li data-tab="accessibility">
            <button class="nostyle">アクセシビリティ</button>
          </li>
        </ul>

        <div class="main" style="flex:1;height:100%;padding-left:1rem;overflow:hidden;">
          <div data-tab="theme" class="active">
            <h3>テーマ設定</h3>
            <section class="setting-section">
              <h3>テーマカラー選択</h3>
              <div style="height:2000px"></div>
            </section>
          </div>
          <div data-tab="accessibility">
            <h3>アクセシビリティ設定</h3>
          </div>
        </div>
      </div>
    `;

    const sidebar = $('.sidebar', content);
    const main = $('.main', content);

    sidebar.addEventListener('click', e => {
      const li = e.target.closest('li');
      if (!li) return;

      const tab = li.dataset.tab;

      sidebar.querySelectorAll('li').forEach(el => el.classList.remove('active'));
      li.classList.add('active');

      main.querySelectorAll('div[data-tab]').forEach(el => el.classList.remove('active'));
      main.querySelector(`[data-tab="${tab}"]`).classList.add('active');
    });
  }

  #attachEvents() {
    this.$theme.addEventListener('click', () => this.#applyTheme());
    this.$settings.addEventListener('click', () => this.#showSetting());
  }
}

customElements.define('com-header', Header);
