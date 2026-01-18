class Player extends HTMLElement {
  #audio
  #style = `
    :host {
      position: fixed;
      bottom: 16px;
      right: 16px;
      resize: both;
      
    }
  `;
  #html = ``;

  constructor() {
    super();
    this.#audio = new Audio();
    this.attachShadow({ mode: 'open' });
  }

  connectedCallback() {
    this.shadowRoot.innerHTML = `
      <style>${this.#style}</style>
      ${this.#html}
    `;
  }

  play() {
    this.#audio.play();
  }

  pause() {
    this.#audio.pause();
  }

  set src(v) {
    this.#audio.src = v;
  }

  get src() {
    return this.#audio.src;
  }
}

customElements.define('music-player', Player);
