const styleId = "media-engine-styles";
if (!document.getElementById(styleId)) {
  const link = document.createElement("link");
  link.id = styleId;
  link.rel = "stylesheet";
  link.href = "/tools/media-player/media-engine.css";
  document.head.append(link);
}

if (!customElements.get("media-engine")) {
  customElements.define("media-engine", class extends HTMLElement {
    connectedCallback() {
      if (this.audio) return;
      Object.assign(this.style, {
        position: "fixed",
        display: "block",
        left: "12px",
        right: "12px",
        bottom: "calc(12px + env(safe-area-inset-bottom))",
        width: "auto",
        height: "auto",
        overflow: "visible",
        pointerEvents: "none",
        zIndex: "1000"
      });
      this.entries = new Map();
      this.artworks = new Map();
      this.lyricFiles = new Map();
      this.objectUrls = new Set();
      this.currentId = null;
      this.nextId = 1;
      this.shuffle = false;
      this.shuffleBag = [];
      this.repeat = false;
      this.volume = 1;
      this.playbackRate = 1;
      this.audio = document.createElement("audio");
      this.audio.preload = "metadata";
      this.audio.hidden = true;
      this.video = document.createElement("video");
      this.video.id = "video-player";
      this.video.preload = "metadata";
      this.video.playsInline = true;
      this.video.hidden = true;
      this.append(this.audio, this.video);
      this.audioContext = null;
      this.analyser = null;
      this.analysisData = null;
      this.analysisSources = new WeakSet();
      this.analysisFrame = 0;
      this.setupAudioAnalysis = () => {
        const AudioContextClass = window.AudioContext || window.webkitAudioContext;
        if (!AudioContextClass) return false;
        try {
          if (!this.audioContext) {
            this.audioContext = new AudioContextClass();
            this.analyser = this.audioContext.createAnalyser();
            this.analyser.fftSize = 1024;
            this.analyser.smoothingTimeConstant = 0.78;
            this.analysisData = new Uint8Array(this.analyser.frequencyBinCount);
            this.analyser.connect(this.audioContext.destination);
          }
          for (const media of [this.audio, this.video]) {
            if (this.analysisSources.has(media)) continue;
            const source = this.audioContext.createMediaElementSource(media);
            source.connect(this.analyser);
            this.analysisSources.add(media);
          }
          if (this.audioContext.state === "suspended") this.audioContext.resume().catch(() => {});
          return true;
        } catch (error) {
          console.warn("[media-player] 音声解析を初期化できませんでした。", error);
          return false;
        }
      };
      this.updateVisualizer = () => {
        if (!this.analyser || !this.analysisData) return;
        this.analyser.getByteFrequencyData(this.analysisData);
        const bins = this.analysisData;
        const max = bins.length;
        const average = (from, to) => {
          let sum = 0, count = 0;
          for (let i = from; i < Math.min(to, max); i++) { sum += bins[i]; count++; }
          return count ? sum / count / 255 : 0;
        };
        const bands = [
          average(1, Math.max(5, Math.floor(max * 0.08))),
          average(Math.floor(max * 0.08), Math.floor(max * 0.38)),
          average(Math.floor(max * 0.38), Math.floor(max * 0.9))
        ];
        const indicator = document.getElementById("playing-indicator");
        if (indicator) {
          indicator.classList.add("is-analyzed");
          [...indicator.children].forEach((bar, index) => {
            bar.style.height = (4 + bands[index] * 16).toFixed(1) + "px";
          });
        }
        if (!this.audio.paused || !this.video.paused) {
          this.analysisFrame = requestAnimationFrame(this.updateVisualizer);
        } else {
          this.analysisFrame = 0;
        }
      };
      for (const media of [this.audio, this.video]) {
        media.addEventListener("play", () => {
          this.setupAudioAnalysis();
          if (!this.analysisFrame) this.analysisFrame = requestAnimationFrame(this.updateVisualizer);
        });
        media.addEventListener("pause", () => {
          if (this.audio.paused && this.video.paused && this.analysisFrame) {
            cancelAnimationFrame(this.analysisFrame);
            this.analysisFrame = 0;
          }
        });
      }
      this.globalMini = document.createElement("section");
      this.globalMini.className = "mini-player global-media-mini";
      this.globalMini.innerHTML = `
        <div class="mini-artwork"><img alt="" hidden><i data-lucide="music-2"></i></div>
        <div class="mini-track"><strong>再生待ち</strong><span>ファイルが選択されていません</span></div>
        <button type="button" class="global-mini-play" aria-label="再生"><i data-lucide="play"></i></button>
        <button type="button" class="global-mini-next" aria-label="次のファイル"><i data-lucide="skip-forward"></i></button>
        <button type="button" class="global-mini-toggle" aria-label="閉じる"><i data-lucide="chevron-down"></i></button>
        <div class="global-mini-expanded" aria-label="簡易再生操作">
          <div class="global-mini-seek-row"><span class="global-mini-current">0:00</span><input class="global-mini-seek" type="range" min="0" max="1000" value="0" aria-label="再生位置" disabled><span class="global-mini-duration">0:00</span></div>
          <div class="global-mini-controls">
            <button type="button" class="global-mini-back" aria-label="閉じる"><i data-lucide="chevron-down"></i></button>
            <button type="button" class="global-mini-previous" aria-label="前のファイル"><i data-lucide="skip-back"></i></button>
            <button type="button" class="global-mini-play" aria-label="再生"><i data-lucide="play"></i></button>
            <button type="button" class="global-mini-next" aria-label="次のファイル"><i data-lucide="skip-forward"></i></button>
            <button type="button" class="global-mini-shuffle" aria-label="シャッフル" aria-pressed="false"><i data-lucide="shuffle"></i></button>
            <button type="button" class="global-mini-repeat" aria-label="リピート" aria-pressed="false"><i data-lucide="repeat-1"></i></button>
          </div>
        </div>`;
      this.append(this.globalMini);
      this.globalMini.addEventListener("click", event => {
        if (!event.target.closest(".mini-track, .mini-artwork")) return;
        if (this.globalMini.classList.contains("is-expanded")) {
          window.spaRouter?.navigate("/tools/media-player/");
          return;
        }
        this.globalMini.classList.add("is-expanded");
        this.globalMini.querySelector(".global-mini-toggle").setAttribute("aria-label", "ミニプレーヤーを閉じる");
      });
      this.globalMini.querySelector(".global-mini-back").addEventListener("click", () => {
        this.globalMini.classList.remove("is-expanded");
      });
      this.globalMini.querySelector(".global-mini-previous").addEventListener("click", () => this.sessionMove(-1));
      this.globalMini.querySelector(".global-mini-shuffle").addEventListener("click", () => {
        this.shuffle = !this.shuffle;
        this.shuffleBag = this.shuffle ? this.shuffleBag.filter(id => this.entries.has(id) && id !== this.currentId) : [];
        this.updateGlobalMini();
      });
      this.globalMini.querySelector(".global-mini-repeat").addEventListener("click", () => {
        this.repeat = !this.repeat;
        this.updateGlobalMini();
      });
      const miniSeek = this.globalMini.querySelector(".global-mini-seek");
      miniSeek.addEventListener("input", () => {
        const active = this.currentMedia;
        if (active && Number.isFinite(active.duration)) {
          this.globalMini.querySelector(".global-mini-current").textContent = this.formatMediaTime(active.duration * Number(miniSeek.value) / 1000);
        }
      });
      miniSeek.addEventListener("change", () => {
        const active = this.currentMedia;
        if (active && Number.isFinite(active.duration)) active.currentTime = active.duration * Number(miniSeek.value) / 1000;
      });
      this.globalMini.querySelectorAll(".global-mini-play").forEach(button => button.addEventListener("click", () => {
        const active = this.currentMedia;
        if (active) { if (active.paused) { this.setupAudioAnalysis(); active.play().catch(() => {}); } else active.pause(); }
      }));
      this.globalMini.querySelectorAll(".global-mini-next").forEach(button => button.addEventListener("click", () => this.sessionMove(1)));
      this.globalMini.querySelector(".global-mini-toggle").addEventListener("click", () => {
        this.globalMini.classList.toggle("is-collapsed");
        const collapsed = this.globalMini.classList.contains("is-collapsed");
        this.classList.toggle("is-mini-collapsed", collapsed);
        this.globalMini.querySelector(".global-mini-toggle").innerHTML = collapsed ? '<i data-lucide="chevron-up"></i>' : '<i data-lucide="chevron-down"></i>';
        this.globalMini.querySelector(".global-mini-toggle").setAttribute("aria-label", collapsed ? "ミニプレーヤーを開く" : "閉じる");
      });
      this.updateGlobalMini = () => {
        const entry = this.entries.get(this.currentId);
        const onPlayerPage = location.pathname.replace(/\/$/, "") === "/tools/media-player";
        if (onPlayerPage) this.globalMini.classList.remove("is-expanded");
        this.globalMini.classList.toggle("is-visible", !!entry && !onPlayerPage);
        this.globalMini.querySelector(".mini-track strong").textContent = entry ? entry.file.name.replace(/\.[^.]+$/, "") : "再生待ち";
        this.globalMini.querySelector(".mini-track span").textContent = entry ? (entry.kind === "video" ? "動画" : "音声") : "ファイルが選択されていません";
        const image = this.globalMini.querySelector(".mini-artwork img");
        image.src = entry?.artworkUrl || "";
        image.hidden = !entry?.artworkUrl;
        this.globalMini.querySelector(".mini-artwork i, .mini-artwork svg").hidden = !!entry?.artworkUrl;
        const playing = !!this.currentMedia && !this.currentMedia.paused;
        const active = this.currentMedia;
        const canMove = this.entries.size > 1;
        this.globalMini.querySelector(".global-mini-previous").disabled = !canMove;
        this.globalMini.querySelector(".global-mini-next").disabled = !canMove;
        const shuffleButton = this.globalMini.querySelector(".global-mini-shuffle");
        const repeatButton = this.globalMini.querySelector(".global-mini-repeat");
        shuffleButton.classList.toggle("is-on", this.shuffle);
        shuffleButton.setAttribute("aria-pressed", String(this.shuffle));
        repeatButton.classList.toggle("is-on", this.repeat);
        repeatButton.setAttribute("aria-pressed", String(this.repeat));
        const seek = this.globalMini.querySelector(".global-mini-seek");
        const current = this.globalMini.querySelector(".global-mini-current");
        const duration = this.globalMini.querySelector(".global-mini-duration");
        const format = value => this.formatMediaTime(value);
        const hasDuration = !!active && Number.isFinite(active.duration) && active.duration > 0;
        seek.disabled = !hasDuration;
        if (hasDuration) seek.value = String(active.currentTime / active.duration * 1000);
        current.textContent = format(active?.currentTime || 0);
        duration.textContent = format(hasDuration ? active.duration : 0);
        this.globalMini.querySelectorAll(".global-mini-play").forEach(button => {
          button.innerHTML = playing ? '<i data-lucide="pause"></i>' : '<i data-lucide="play"></i>';
          button.setAttribute("aria-label", playing ? "一時停止" : "再生");
        });
        const createIcons = window.spaRouter?.commonStorage?.get("createIcons");
        const lucideIcons = window.spaRouter?.commonStorage?.get("lucideIcons");
        createIcons?.({icons:lucideIcons});
      };
      window.addEventListener("spa:router", () => this.updateGlobalMini());
      this.nextShuffleId = () => {
        const ids = [...this.entries.keys()];
        this.shuffleBag = this.shuffleBag.filter(id => this.entries.has(id) && id !== this.currentId);
        if (!this.shuffleBag.length) {
          this.shuffleBag = ids.filter(id => id !== this.currentId);
          for (let i = this.shuffleBag.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [this.shuffleBag[i], this.shuffleBag[j]] = [this.shuffleBag[j], this.shuffleBag[i]];
          }
        }
        return this.shuffleBag.shift() ?? null;
      };
      const handleEnded = () => {
        const ids = [...this.entries.keys()];
        if (this.currentId == null || ids.length < 2 && !this.repeat) return;
        const activeEntry = this.entries.get(this.currentId);
        if (!activeEntry) return;
        const active = activeEntry.kind === "video" ? this.video : this.audio;
        if (this.repeat) {
          active.currentTime = 0;
          active.play().catch(() => {});
          return;
        }
        let nextId;
        if (this.shuffle && ids.length > 1) {
          nextId = this.nextShuffleId();
        } else {
          const index = ids.indexOf(this.currentId);
          nextId = ids[(index + 1) % ids.length];
        }
        const nextEntry = this.entries.get(nextId);
        if (!nextEntry) return;
        this.audio.pause();
        this.video.pause();
        this.audio.removeAttribute("src");
        this.video.removeAttribute("src");
        this.audio.load();
        this.video.load();
        const nextMedia = nextEntry.kind === "video" ? this.video : this.audio;
        this.currentId = nextId;
        this.updateSession?.(nextEntry);
        nextMedia.src = nextEntry.url;
        nextMedia.volume = this.volume;
        nextMedia.playbackRate = this.playbackRate;
        nextMedia.load();
        this.dispatchEvent(new CustomEvent("trackchange", { detail: { id: nextId } }));
        nextMedia.play().catch(() => {});
      };
      this.audio.addEventListener("ended", handleEnded);
      this.video.addEventListener("ended", handleEnded);

      if ("mediaSession" in navigator) {
        const actions = {
          play: () => { this.setupAudioAnalysis(); this.currentMedia?.play().catch(() => {}); },
          pause: () => { this.audio.pause(); this.video.pause(); },
          previoustrack: () => this.sessionMove(-1),
          nexttrack: () => this.sessionMove(1),
          seekto: event => {
            const active = this.currentMedia;
            if (active && Number.isFinite(event.seekTime)) active.currentTime = event.seekTime;
          },
          seekbackward: event => {
            const active = this.currentMedia;
            if (active) active.currentTime = Math.max(0, active.currentTime - (event.seekOffset || 10));
          },
          seekforward: event => {
            const active = this.currentMedia;
            if (active && Number.isFinite(active.duration)) active.currentTime = Math.min(active.duration, active.currentTime + (event.seekOffset || 10));
          }
        };
        for (const [action, handler] of Object.entries(actions)) {
          try { navigator.mediaSession.setActionHandler(action, handler); } catch {}
        }
      }

      Object.defineProperty(this, "currentMedia", {
        get: () => this.entries.get(this.currentId)?.kind === "video" ? this.video : this.audio
      });
      this.sessionMove = direction => {
        const ids = [...this.entries.keys()];
        if (ids.length < 2 || this.currentId == null) return;
        let nextId;
        if (this.shuffle && ids.length > 1) {
          nextId = this.nextShuffleId();
        } else {
          const index = ids.indexOf(this.currentId);
          nextId = ids[(index + direction + ids.length) % ids.length];
        }
        const entry = this.entries.get(nextId);
        if (!entry) return;
        this.audio.pause();
        this.video.pause();
        this.audio.removeAttribute("src");
        this.video.removeAttribute("src");
        this.audio.load();
        this.video.load();
        const active = entry.kind === "video" ? this.video : this.audio;
        this.currentId = nextId;
        active.src = entry.url;
        active.volume = this.volume;
        active.playbackRate = this.playbackRate;
        active.load();
        this.setupAudioAnalysis();
        this.updateSession(entry);
        this.dispatchEvent(new CustomEvent("trackchange", { detail: { id: nextId } }));
        active.play().catch(() => {});
      };
      this.formatMediaTime = seconds => {
        if (!Number.isFinite(seconds) || seconds < 0) return "0:00";
        const value = Math.floor(seconds), minutes = Math.floor(value / 60), secs = value % 60;
        const hours = Math.floor(minutes / 60);
        return hours ? `${hours}:${String(minutes % 60).padStart(2, "0")}:${String(secs).padStart(2, "0")}` : `${minutes}:${String(secs).padStart(2, "0")}`;
      };
      this.updateSession = entry => {
        this.updateGlobalMini?.();
        if (!("mediaSession" in navigator)) return;
        if (!entry) {
          navigator.mediaSession.metadata = null;
          navigator.mediaSession.playbackState = "none";
          return;
        }
        if ("MediaMetadata" in window) {
          const artwork = entry.artworkUrl ? [{ src: entry.artworkUrl }] : [];
          navigator.mediaSession.metadata = new MediaMetadata({
            title: entry.file.name.replace(/\\.[^.]+$/, ""),
            artist: "UsefulTools メディアプレイヤー",
            album: entry.kind === "video" ? "動画" : "音声",
            artwork
          });
        }
      };
      this.updateSessionState = () => {
        this.updateGlobalMini?.();
        if (!("mediaSession" in navigator)) return;
        navigator.mediaSession.playbackState = this.audio.paused && this.video.paused ? "paused" : "playing";
        const active = this.currentMedia;
        if (active && Number.isFinite(active.duration) && active.duration > 0 && "setPositionState" in navigator.mediaSession) {
          try {
            navigator.mediaSession.setPositionState({
              duration: active.duration,
              playbackRate: active.playbackRate || 1,
              position: Math.min(active.currentTime || 0, active.duration)
            });
          } catch {}
        }
      };
      this.updateGlobalMini?.();
      for (const media of [this.audio, this.video]) {
        media.addEventListener("timeupdate", () => {
          this.updateSessionState();
          if (this.globalMini.classList.contains("is-expanded")) this.updateGlobalMini();
        });
        media.addEventListener("play", this.updateSessionState);
        media.addEventListener("pause", this.updateSessionState);
        media.addEventListener("ratechange", this.updateSessionState);
      }
    }
  });
}
