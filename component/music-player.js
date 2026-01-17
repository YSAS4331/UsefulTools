class Player extends HTMLElement {
  #audio
  #style = ``;
  #html = ``;

  constructor() {
    super()
    this.#audio = new Audio()
  }

  connectedCallback() {
    this.innerHTML = `
      <style>${this.#style}</style>
      ${this.#html}
    `;
  }

  audio(fn, ...args) {
    const allowed = ['play', 'pause', 'load']
    if (!allowed.includes(fn)) return

    const func = this.#audio[fn]
    if (typeof func === 'function') {
      func.apply(this.#audio, args)
    }
  }

  seek(time) {
    this.#audio.currentTime = time
  }

  set volume(v) {
    this.#audio.volume = v
  }
}

customElements.define('music-player', Player);
