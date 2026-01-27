class Player extends HTMLElement {
  #audio = new Audio();

  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this.shadowRoot.innerHTML = `
      <style>
        :host {
          display: none; /* UI は外部で作る前提 */
        }
      </style>
    `;
  }

  connectedCallback() {
    // Audio のイベントをそのまま外へ流す
    const events = [
      'play', 'pause', 'ended', 'timeupdate', 'loadedmetadata'
    ];

    events.forEach(ev => {
      this.#audio.addEventListener(ev, e => {
        this.dispatchEvent(new Event(ev, { bubbles: true }));
      });
    });
  }

  /* --- Audio と同じメソッド --- */
  play() { return this.#audio.play(); }
  pause() { return this.#audio.pause(); }
  load() { return this.#audio.load(); }

  /* --- setter --- */
  set src(v) { this.#audio.src = v; }
  set currentTime(v) { this.#audio.currentTime = v; }
  set volume(v) { this.#audio.volume = v; }
  set muted(v) { this.#audio.muted = v; }
  set loop(v) { this.#audio.loop = v; }
  set playbackRate(v) { this.#audio.playbackRate = v; }

  /* --- getter --- */
  get src() { return this.#audio.src; }
  get currentTime() { return this.#audio.currentTime; }
  get volume() { return this.#audio.volume; }
  get muted() { return this.#audio.muted; }
  get loop() { return this.#audio.loop; }
  get playbackRate() { return this.#audio.playbackRate; }
  get duration() { return this.#audio.duration; }
  get paused() { return this.#audio.paused; }
  get ended() { return this.#audio.ended; }
}

customElements.define('music-player', Player);
