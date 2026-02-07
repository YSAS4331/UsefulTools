class Player extends HTMLElement {
  #audio = new Audio();
  #files = [];
  #index = 0;
  #currentBlobUrl = null;

  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this.shadowRoot.innerHTML = `<style>:host{display:none;}</style>`;
  }

  connectedCallback() {
    const events = ['play','pause','ended','timeupdate','loadedmetadata'];
    events.forEach(ev => {
      this.#audio.addEventListener(ev, () => {
        this.dispatchEvent(new Event(ev, { bubbles: true }));
      });
    });

    this.#audio.addEventListener('ended', () => {
      this.next();
    });
  }

  /* --- playlist control --- */
  next() {
    if (this.#index < this.#files.length - 1) {
      this.#index++;
      this.#loadCurrent();
    }
  }

  prev() {
    if (this.#index > 0) {
      this.#index--;
      this.#loadCurrent();
    }
  }

  #loadCurrent() {
    const file = this.#files[this.#index];
    if (!file) return;

    // 古い blob を解放
    if (this.#currentBlobUrl) {
      URL.revokeObjectURL(this.#currentBlobUrl);
      this.#currentBlobUrl = null;
    }

    // 新しい blob を作成
    this.#currentBlobUrl = URL.createObjectURL(file);
    this.#audio.src = this.#currentBlobUrl;

    this.#audio.load();
    this.play();

    this.dispatchEvent(new CustomEvent('trackchange', {
      detail: { index: this.#index, file },
      bubbles: true
    }));
  }

  /* --- Audio methods --- */
  play() { return this.#audio.play(); }
  pause() { return this.#audio.pause(); }
  load() { return this.#audio.load(); }

  /* --- setter: replace files --- */
  set files(list) {
    const arr = Array.from(list);
    const seen = new Set();

    this.#files = arr.filter(f => {
      if (seen.has(f.name)) return false;
      seen.add(f.name);
      return true;
    });

    this.#index = 0;
    this.#loadCurrent();
  }

  /* --- addFiles: append without duplicates --- */
  addFiles(list) {
    const arr = Array.from(list);
    const existing = new Set(this.#files.map(f => f.name));

    for (const file of arr) {
      if (!existing.has(file.name)) {
        this.#files.push(file);
        existing.add(file.name);
      }
    }

    if (this.#audio.src === '') {
      this.#index = 0;
      this.#loadCurrent();
    }
  }

  /* --- remove: delete file at index --- */
  remove(i) {
    if (i < 0 || i >= this.#files.length) return;

    this.#files.splice(i, 1);

    if (this.#files.length === 0) {
      this.#audio.pause();
      this.#audio.src = '';
      return;
    }

    if (this.#index >= this.#files.length) {
      this.#index = this.#files.length - 1;
    }

    this.#loadCurrent();
  }

  /* --- swap: reorder playlist --- */
  swap(a, b) {
    if (
      a < 0 || a >= this.#files.length ||
      b < 0 || b >= this.#files.length
    ) return;

    const tmp = this.#files[a];
    this.#files[a] = this.#files[b];
    this.#files[b] = tmp;

    if (this.#index === a) this.#index = b;
    else if (this.#index === b) this.#index = a;

    this.#loadCurrent();
  }

  /* --- setters --- */
  set currentTime(v) { this.#audio.currentTime = v; }
  set volume(v) { this.#audio.volume = v; }
  set muted(v) { this.#audio.muted = v; }
  set loop(v) { this.#audio.loop = v; }
  set playbackRate(v) { this.#audio.playbackRate = v; }

  set index(i) {
    if (i >= 0 && i < this.#files.length) {
      this.#index = i;
      this.#loadCurrent();
    }
  }

  /* --- getters --- */
  get files() { return [...this.#files]; } // コピー返しで安全
  get index() { return this.#index; }
  get currentIndex() { return this.#index; }

  get currentFile() { return this.#files[this.#index] || null; }
  get currentSrc() { return this.#audio.src; }

  get currentTime() { return this.#audio.currentTime; }
  get duration() { return this.#audio.duration || 0; }

  get progress() {
    if (!this.#audio.duration) return 0;
    return this.#audio.currentTime / this.#audio.duration;
  }

  get volume() { return this.#audio.volume; }
  get muted() { return this.#audio.muted; }
  get loop() { return this.#audio.loop; }
  get playbackRate() { return this.#audio.playbackRate; }
  get paused() { return this.#audio.paused; }
  get ended() { return this.#audio.ended; }
}

customElements.define('music-player', Player);
