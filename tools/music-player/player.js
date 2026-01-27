class Player extends HTMLElement {
  #audio
  #style = `
    :host {
      position: fixed;
      bottom: 16px;
      right: 16px;
      resize: both;
      display: block;
      z-index: 9999;
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
    this.#audio.addEventListener('timeupdate', e => {
      this.dispatchEvent(new Event('timeupdate', { bubbles: true }));
    });
    
    this.#audio.addEventListener('ended', e => {
      this.dispatchEvent(new Event('ended', { bubbles: true }));
    });
  }

  /* --- Methods --- */
  play() { this.#audio.play(); }
  pause() { this.#audio.pause(); }
  load() { this.#audio.load(); }

  /* --- Setter --- */
  set src(v) { this.#audio.src = v; }
  set currentTime(v) { this.#audio.currentTime = v; }
  set volume(v) { this.#audio.volume = v; }
  set muted(v) { this.#audio.muted = v; }
  set loop(v) { this.#audio.loop = v; }
  set playbackRate(v) { this.#audio.playbackRate = v; }

  /* --- Getter --- */
  get src() { return this.#audio.src; }
  get currentTime() { return this.#audio.currentTime; }
  get volume() { return this.#audio.volume; }
  get muted() { return this.#audio.muted; }
  get loop() { return this.#audio.loop; }
  get playbackRate() { return this.#audio.playbackRate; }
  get duration() { return this.#audio.duration; }
  get paused() { return this.#audio.paused; }
  get ended() { return this.#audio.ended; }

  /* --- Visibility control (PiP用) --- */
  hide() { this.style.display = 'none'; }
  show() { this.style.display = ''; }
}

customElements.define('music-player', Player);
