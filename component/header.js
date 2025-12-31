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
      background: color-mix(in srgb, var(--accent) 75%, transparent 25%);
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
      <a href="#"><span>Useful Tools</span></a>
      <div id="searchBar">
        <i class="fa-solid fa-magnifying-glass"></i>
        <input type="text" placeholder="ツールを検索する..." id="searchContent">
        <button id="searchBtn">
          <span>検索する</span>
          <i class="fa-solid fa-arrow-right"></i>
        </button>
      </div>
      <div id="buttons">
        <button id="favoriteTools" title="お気に入りのツール" class="nostyle">
          <i class="fa-solid fa-heart" style="color: #FFD761;"></i>
        </button>
        <button id="settings" title="設定を開く" class="nostyle">
          <i class="fa-solid fa-user-gear"></i>
        </button>
        <button id="colorTheme" title="カラーテーマを変更" style="color: #f0f0f0; border: 2px solid var(--accent);">
          <i class="fa-solid fa-palette"></i>
        </button>
      </div>
    </header>
  `;

  connectedCallback() {
    this.render();
  }

  render() {
    this.innerHTML = `<style>${this.#Style}</style>${this.#HTML}`;
  }
}

customElements.define('com-header', Header);
