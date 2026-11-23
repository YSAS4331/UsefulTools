const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
const formatTime = seconds => {
  if (!Number.isFinite(seconds) || seconds < 0) return "0:00";
  const value = Math.floor(seconds), hours = Math.floor(value / 3600);
  const minutes = Math.floor((value % 3600) / 60), secs = value % 60;
  return hours ? `${hours}:${String(minutes).padStart(2,"0")}:${String(secs).padStart(2,"0")}` : `${minutes}:${String(secs).padStart(2,"0")}`;
};
const formatSize = bytes => bytes < 1048576 ? `${(bytes/1024).toFixed(1)} KB` : bytes < 1073741824 ? `${(bytes/1048576).toFixed(1)} MB` : `${(bytes/1073741824).toFixed(2)} GB`;
const baseName = name => name.replace(/\.[^.]+$/,"").toLocaleLowerCase();

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
      this.globalMini = document.createElement("section");
      this.globalMini.className = "mini-player global-media-mini";
      this.globalMini.innerHTML = `
        <div class="mini-artwork"><img alt="" hidden><i data-lucide="music-2"></i></div>
        <div class="mini-track"><strong>再生待ち</strong><span>ファイルが選択されていません</span></div>
        <button type="button" class="global-mini-play" aria-label="再生"><i data-lucide="play"></i></button>
        <button type="button" class="global-mini-next" aria-label="次のファイル"><i data-lucide="skip-forward"></i></button>
        <button type="button" class="global-mini-toggle" aria-label="閉じる"><i data-lucide="chevron-down"></i></button>`;
      this.append(this.globalMini);
      const globalStyle = document.createElement("style");
      globalStyle.id = "global-media-mini-style";
      globalStyle.textContent = `
        media-engine{box-sizing:border-box}
        .global-media-mini{position:relative!important;display:none!important;align-items:center;gap:.55rem;width:100%;min-height:4rem;max-width:none!important;box-sizing:border-box;margin:0;padding:.35rem .55rem .35rem .4rem;border:1px solid var(--border-color);border-radius:999px;background:var(--bg-2);box-shadow:0 4px 24px #0002;color:var(--text-primary);pointer-events:auto}
        .global-media-mini.is-visible{display:flex!important}
        .global-media-mini .mini-artwork{flex:0 0 2.75rem;width:2.75rem;height:2.75rem}
        .global-media-mini .mini-artwork{line-height:0}
        .global-media-mini .mini-artwork>svg{display:block;width:1.35rem;height:1.35rem;margin:0}
        .global-media-mini .mini-track{display:flex;flex:1 1 auto;width:0;flex-direction:column;min-width:0;gap:.2rem;cursor:pointer}
        .global-media-mini .mini-artwork{cursor:pointer}
        .global-media-mini.is-collapsed>:not(.global-mini-toggle){display:none!important}
        .global-media-mini.is-collapsed{min-height:48px;width:48px;padding:0}
        .global-media-mini.is-collapsed .global-mini-toggle{flex:1;width:100%;height:100%}
        .global-media-mini .mini-track strong,.global-media-mini .mini-track span{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
        .global-media-mini .mini-track span{color:var(--text-tertiary);font-size:.85rem}
        .global-media-mini button{display:grid!important;place-items:center;flex:0 0 2.5rem;width:2.5rem;height:2.5rem;padding:0!important;border:0!important;box-shadow:none!important;background:transparent!important;color:var(--text-primary)!important}
        .global-media-mini .global-mini-toggle{flex-basis:2rem;width:2rem}
        media-engine.is-mini-collapsed{left:auto!important;right:12px!important;width:48px!important;height:48px!important}
        media-engine.is-mini-collapsed .global-media-mini{height:100%;justify-content:center;padding:0;border:1px solid var(--border-color);border-radius:999px;background:var(--bg-2);box-shadow:0 4px 24px #0002}
        media-engine.is-mini-collapsed .global-mini-toggle{flex:1;width:100%;height:100%}
        media-engine.is-mini-collapsed .global-mini-toggle i{transform:rotate(180deg)}
        @media(min-width:700px){media-engine{left:auto!important;right:12px!important;width:min(420px,calc(100vw - 24px))!important}}
      `;
      if (!document.getElementById("global-media-mini-style")) document.head.append(globalStyle);
      this.globalMini.addEventListener("click", event => {
        if (!event.target.closest(".mini-track, .mini-artwork")) return;
        window.spaRouter?.navigate("/tools/media-player/");
      });
      this.globalMini.querySelector(".global-mini-play").addEventListener("click", () => {
        const active = this.currentMedia;
        if (active) active.paused ? active.play().catch(() => {}) : active.pause();
      });
      this.globalMini.querySelector(".global-mini-next").addEventListener("click", () => this.sessionMove(1));
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
        this.globalMini.classList.toggle("is-visible", !!entry && !onPlayerPage);
        this.globalMini.querySelector(".mini-track strong").textContent = entry ? entry.file.name.replace(/\.[^.]+$/, "") : "再生待ち";
        this.globalMini.querySelector(".mini-track span").textContent = entry ? (entry.kind === "video" ? "動画" : "音声") : "ファイルが選択されていません";
        const image = this.globalMini.querySelector(".mini-artwork img");
        image.src = entry?.artworkUrl || "";
        image.hidden = !entry?.artworkUrl;
        this.globalMini.querySelector(".mini-artwork i, .mini-artwork svg").hidden = !!entry?.artworkUrl;
        const playing = !!this.currentMedia && !this.currentMedia.paused;
        this.globalMini.querySelector(".global-mini-play").innerHTML = playing ? '<i data-lucide="pause"></i>' : '<i data-lucide="play"></i>';
        this.globalMini.querySelector(".global-mini-play").setAttribute("aria-label", playing ? "一時停止" : "再生");
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
          play: () => this.currentMedia?.play().catch(() => {}),
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
        this.updateSession(entry);
        this.dispatchEvent(new CustomEvent("trackchange", { detail: { id: nextId } }));
        active.play().catch(() => {});
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
        media.addEventListener("timeupdate", this.updateSessionState);
        media.addEventListener("play", this.updateSessionState);
        media.addEventListener("pause", this.updateSessionState);
        media.addEventListener("ratechange", this.updateSessionState);
      }
    }
  });
}

let cleanupActive = null;

const init = () => {
  cleanupActive?.();
  const root = $("#tool"), input = $("#upload-file");
  if (!root || !input) return;
  const engine = document.querySelector("media-engine") ||
    document.body.appendChild(document.createElement("media-engine"));
  const audio = engine.audio, video = engine.video;
  const stage = $("#media-stage", root);
  stage.append(video);
  const artwork=$("#artwork-image",root);
  const audioVisual=$("#audio-visual",root), stageEmpty=$("#stage-empty",root), queue=$("#queue-list",root), library=$("#files",root);
  const lyricsContent=$("#lyrics-content",root), count=$(".nav-file-count",root);
  const seek=$("#seek-bar",root), playButton=$("#play-button",root), previousButton=$("#previous-button",root), nextButton=$("#next-button",root);
  const shuffleButton=$("#shuffle-button",root), repeatButton=$("#repeat-button",root), volume=$("#volume-bar",root), speed=$("#speed-select",root);
  const currentTime=$("#current-time",root), duration=$("#duration",root), trackTitle=$("#track-title",root), trackMeta=$("#track-meta",root);
  const indicator=$("#playing-indicator",root), upload=$("#upload-container",root);
  const miniTitle=$("#mini-track-title",root),miniMeta=$("#mini-track-meta",root),miniArtwork=$("#mini-artwork-image",root),miniArtworkIcon=$("#mini-artwork-icon",root),miniPlay=$("#mini-play-button",root),miniNext=$("#mini-next-button",root);
  const iconStorage=window.spaRouter?.commonStorage, createIcons=iconStorage?.get("createIcons"), lucideIcons=iconStorage?.get("lucideIcons");
  const {entries, artworks, lyricFiles, objectUrls} = engine;
  const listeners=[];
  let currentId=engine.currentId,nextId=engine.nextId,shuffle=engine.shuffle,repeat=engine.repeat,seeking=false,destroyed=false,currentLyrics=[],activeLyricIndex=-1;
  const listen=(target,type,handler,options)=>{target.addEventListener(type,handler,options);listeners.push(()=>target.removeEventListener(type,handler,options));};
  const currentEntry=()=>entries.get(currentId);
  const media=()=>currentEntry()?.kind==="video"?video:audio;
  const isPlaying=()=>!audio.paused||!video.paused;
  const makeUrl=file=>{const url=URL.createObjectURL(file);objectUrls.add(url);return url;};
  const parseLrc=text=>{
    const lines=[];
    for(const raw of text.split(/\r?\n/)){
      const tags=[...raw.matchAll(/\[(\d{1,2}):(\d{2})(?:[.:](\d{1,3}))?\]/g)];
      const lyric=raw.replace(/\[[^\]]+\]/g,"").trim();
      for(const tag of tags){const time=Number(tag[1])*60+Number(tag[2])+Number((tag[3]||"0").padEnd(3,"0"))/1000;if(lyric)lines.push({time,text:lyric});}
    }
    return lines.sort((a,b)=>a.time-b.time);
  };
  const showLyrics=()=>{
    activeLyricIndex=-1;
    lyricsContent.replaceChildren();
    if(!currentLyrics.length){const p=document.createElement("p");p.className="content-empty";p.textContent="対応する .lrc ファイルがありません。音声ファイルと同じ名前の .lrc を一緒に追加してください。";lyricsContent.append(p);return;}
    currentLyrics.forEach((line,index)=>{const p=document.createElement("p");p.className="lyric-line";p.dataset.index=index;p.textContent=line.text;lyricsContent.append(p);});
  };
  const updateLyrics=()=>{
    if(!currentLyrics.length)return;
    const time=media()?.currentTime||0;
    let active=-1;
    for(let i=0;i<currentLyrics.length;i++){if(currentLyrics[i].time<=time)active=i;else break;}
    $$(".lyric-line",lyricsContent).forEach((line,index)=>line.classList.toggle("is-active",index===active));
    if(active!==activeLyricIndex){activeLyricIndex=active;const activeLine=active>=0?$(".lyric-line[data-index='"+active+"']",lyricsContent):null;activeLine?.scrollIntoView({block:"center",behavior:"smooth"});}
  };
  const updatePlaybackState=()=>{
    const playing=isPlaying();
    engine.updateSessionState?.();
    playButton.innerHTML=playing?'<i data-lucide="pause"></i>':'<i data-lucide="play"></i>';
    playButton.setAttribute("aria-label",playing?"一時停止":"再生");
    indicator.classList.toggle("is-playing",playing);
    if(miniPlay){miniPlay.innerHTML=playing?"<i data-lucide=\"pause\"></i>":"<i data-lucide=\"play\"></i>";miniPlay.setAttribute("aria-label",playing?"一時停止":"再生");}
    createIcons?.({icons:lucideIcons});
  };
  const updateProgress=()=>{
    const active=media();
    if(!active||!Number.isFinite(active.duration)){currentTime.textContent=formatTime(active?.currentTime||0);duration.textContent="0:00";if(!seeking)seek.value="0";updateLyrics();return;}
    currentTime.textContent=formatTime(active.currentTime);duration.textContent=formatTime(active.duration);
    if(!seeking)seek.value=String(active.duration?active.currentTime/active.duration*1000:0);
    updateLyrics();
  };
  const renderQueue=()=>{
    queue.replaceChildren();
    if(!entries.size){const li=document.createElement("li");li.className="queue-empty";li.textContent="ファイルを追加してください";queue.append(li);}
    for(const [id,entry] of entries){
      const li=document.createElement("li");li.className="queue-item"+(id===currentId?" is-current":"");
      const select=document.createElement("button");select.type="button";select.className="queue-select";
      const icon=document.createElement("span");icon.className="file-type-icon";icon.textContent=entry.kind==="video"?"▶":"♫";
      const copy=document.createElement("span");copy.className="queue-copy";
      const name=document.createElement("strong");name.textContent=entry.file.name;
      const meta=document.createElement("small");meta.textContent=(entry.kind==="video"?"動画":"音声")+" · "+formatSize(entry.file.size);
      copy.append(name,meta);select.append(icon,copy);select.addEventListener("click",()=>selectEntry(id,true));
      const remove=document.createElement("button");remove.type="button";remove.className="remove-file";remove.textContent="×";remove.setAttribute("aria-label",entry.file.name+"を削除");remove.addEventListener("click",()=>removeEntry(id));
      li.append(select,remove);queue.append(li);
    }
    count.textContent=String(entries.size);previousButton.disabled=entries.size<2;nextButton.disabled=entries.size<2;$("#clear-queue-button",root).disabled=!entries.size;
  };
  const renderLibrary=()=>{
    library.replaceChildren();
    if(!entries.size){const li=document.createElement("li");li.className="library-empty";li.textContent="まだファイルがありません";library.append(li);return;}
    for(const [id,entry] of entries){
      const li=document.createElement("li");li.className="library-item"+(id===currentId?" is-current":"");
      const icon=document.createElement("span");icon.className="file-type-icon";icon.textContent=entry.kind==="video"?"▶":"♫";
      const copy=document.createElement("span");copy.className="library-copy";
      const name=document.createElement("strong");name.textContent=entry.file.name;
      const meta=document.createElement("small");meta.textContent=(entry.kind==="video"?"動画":"音声")+" · "+formatSize(entry.file.size);copy.append(name,meta);
      const actions=document.createElement("span");actions.className="library-actions";
      const play=document.createElement("button");play.type="button";play.className="small-action";play.textContent="再生";play.addEventListener("click",()=>{selectEntry(id,true);switchView("playlist");});
      const remove=document.createElement("button");remove.type="button";remove.className="small-action";remove.textContent="削除";remove.addEventListener("click",()=>removeEntry(id));
      actions.append(play,remove);li.append(icon,copy,actions);library.append(li);
    }
  };
  const render=()=>{renderQueue();renderLibrary();};
  const updateTrack=()=>{
    const entry=currentEntry();
    trackTitle.textContent=entry?entry.file.name.replace(/\.[^.]+$/,""):"再生待ち";
    trackMeta.textContent=entry?(entry.kind==="video"?"動画":"音声")+" · "+formatSize(entry.file.size):"ファイルが選択されていません";
    if(miniTitle)miniTitle.textContent=entry?entry.file.name.replace(/\.[^.]+$/, ""):"再生待ち";
    if(miniMeta)miniMeta.textContent=entry?(entry.kind==="video"?"動画":"音声"):"ファイルが選択されていません";
    if(miniArtwork){miniArtwork.hidden=!entry?.artworkUrl;if(entry?.artworkUrl)miniArtwork.src=entry.artworkUrl;else miniArtwork.removeAttribute("src");}
    if(miniArtworkIcon)miniArtworkIcon.hidden=!!entry?.artworkUrl;
    if(miniPlay)miniPlay.disabled=!entry;if(miniNext)miniNext.disabled=entries.size<2;
    stageEmpty.hidden=!!entry;audioVisual.hidden=!entry||entry.kind==="video"||!!entry.artwork;video.hidden=!entry||entry.kind!=="video";
    artwork.hidden=!entry||entry.kind!=="audio"||!entry.artwork;
    if(entry?.kind==="audio"&&entry.artwork){artwork.src=entry.artworkUrl;}else artwork.removeAttribute("src");
    if(entry?.kind==="video"&&video.videoWidth&&video.videoHeight)stage.style.setProperty("--video-ratio",String(video.videoWidth/video.videoHeight));
    seek.disabled=!entry;playButton.disabled=!entry;previousButton.disabled=entries.size<2;nextButton.disabled=entries.size<2;
    currentLyrics=entry?.lyrics||[];showLyrics();engine.updateSession?.(entry);updateProgress();updatePlaybackState();render();
  };
  const play=async()=>{const active=media();if(!active||!currentEntry())return;try{await active.play();}catch(error){if(error.name!=="AbortError")console.warn("[media-player] 再生できませんでした。",error);}updatePlaybackState();};
  const pauseAll=()=>{audio.pause();video.pause();updatePlaybackState();};
  const selectEntry=(id,autoplay=false)=>{
    const entry=entries.get(id);if(!entry)return;
    if(shuffle)engine.shuffleBag=engine.shuffleBag.filter(item=>item!==id);
    pauseAll();currentId=id;engine.currentId=id;$("#media-stage",root).style.removeProperty("--video-ratio");audio.removeAttribute("src");video.removeAttribute("src");audio.load();video.load();
    const active=entry.kind==="video"?video:audio;active.src=entry.url;active.playbackRate=Number(speed.value);active.volume=Number(volume.value);engine.playbackRate=Number(speed.value);engine.volume=Number(volume.value);active.load();
    updateTrack();if(autoplay)play();
  };
  const getNextId=direction=>{
    const ids=[...entries.keys()];if(!ids.length)return null;
    if(shuffle&&ids.length>1)return engine.nextShuffleId();
    const index=ids.indexOf(currentId);return ids[(index+direction+ids.length)%ids.length];
  };
  const move=direction=>{const id=getNextId(direction);if(id!==null)selectEntry(id,true);};
  const removeEntry=id=>{
    const entry=entries.get(id);if(!entry)return;
    const ids=[...entries.keys()],wasCurrent=id===currentId,next=wasCurrent?ids[(ids.indexOf(id)+1)%ids.length]:null;
    if(wasCurrent){pauseAll();audio.removeAttribute("src");video.removeAttribute("src");audio.load();video.load();currentId=null;engine.currentId=null;}
    entries.delete(id);for(const url of [entry.url,entry.artworkUrl])if(url){URL.revokeObjectURL(url);objectUrls.delete(url);}if(wasCurrent&&entries.size)selectEntry(next===id?entries.keys().next().value:next,false);
    if(!entries.size){currentId=null;artwork.hidden=true;artwork.removeAttribute("src");stageEmpty.hidden=false;audioVisual.hidden=false;video.hidden=true;seek.disabled=true;playButton.disabled=true;trackTitle.textContent="再生待ち";trackMeta.textContent="ファイルが選択されていません";currentLyrics=[];showLyrics();updatePlaybackState();updateProgress();}
    render();updateTrack();
  };
  const addFiles=fileList=>{
    const files=[...fileList];
    const audioExts=new Set(["mp3","m4a","aac","flac","wav","ogg","oga","opus","mid","midi"]);
    const videoExts=new Set(["mp4","m4v","mov","webm","mkv","avi","3gp","mpeg","mpg","ogv"]);
    const imageExts=new Set(["jpg","jpeg","png","webp","gif","avif","bmp"]);
    const extension=file=>file.name.split(".").pop().toLowerCase();
    const isAudio=file=>file.type.startsWith("audio/")||audioExts.has(extension(file));
    const isVideo=file=>file.type.startsWith("video/")||videoExts.has(extension(file));
    const isImage=file=>file.type.startsWith("image/")||imageExts.has(extension(file));
    const mediaFiles=files.filter(file=>isAudio(file)||isVideo(file));
    for(const file of files){
      const ext=extension(file),base=baseName(file.name);
      if(isImage(file))artworks.set(base,file);
      if(ext==="lrc")lyricFiles.set(base,file);
    }
    let firstAdded=null;
    for(const file of mediaFiles){
      const id=nextId++,base=baseName(file.name),artworkFile=artworks.get(base),lyricFile=lyricFiles.get(base);
      const entry={id,file,kind:isVideo(file)?"video":"audio",url:makeUrl(file),artwork:null,artworkUrl:null,lyrics:[]};
      if(entry.kind==="audio"&&artworkFile){entry.artwork=artworkFile;entry.artworkUrl=makeUrl(artworkFile);}
      if(entry.kind==="audio"&&lyricFile){
        const reader=new FileReader();reader.onload=()=>{if(!entries.has(id))return;entry.lyrics=parseLrc(String(reader.result||""));if(id===currentId&&root.isConnected){currentLyrics=entry.lyrics;showLyrics();updateLyrics();}};
        reader.readAsText(lyricFile);
      }
      entries.set(id,entry);if(firstAdded===null)firstAdded=id;
    }
    render();if(currentId===null&&firstAdded!==null)selectEntry(firstAdded,false);
  };
  listen(playButton,"click",()=>isPlaying()?pauseAll():play());listen(previousButton,"click",()=>move(-1));listen(nextButton,"click",()=>move(1));
  listen(shuffleButton,"click",()=>{shuffle=!shuffle;engine.shuffle=shuffle;if(!shuffle)engine.shuffleBag=[];else engine.shuffleBag=engine.shuffleBag.filter(id=>entries.has(id)&&id!==currentId);shuffleButton.classList.toggle("is-on",shuffle);shuffleButton.setAttribute("aria-pressed",String(shuffle));});
  listen(repeatButton,"click",()=>{repeat=!repeat;engine.repeat=repeat;repeatButton.classList.toggle("is-on",repeat);repeatButton.setAttribute("aria-pressed",String(repeat));});
  listen(seek,"input",()=>{seeking=true;const active=media();if(active?.duration)currentTime.textContent=formatTime(active.duration*Number(seek.value)/1000);});
  listen(seek,"change",()=>{const active=media();if(active?.duration)active.currentTime=active.duration*Number(seek.value)/1000;seeking=false;updateProgress();});
  listen(volume,"input",()=>{audio.volume=Number(volume.value);video.volume=Number(volume.value);engine.volume=Number(volume.value);});
  listen(speed,"change",()=>{audio.playbackRate=Number(speed.value);video.playbackRate=Number(speed.value);engine.playbackRate=Number(speed.value);});
  listen($("#clear-queue-button",root),"click",()=>{for(const id of [...entries.keys()])removeEntry(id);});
  const switchView=view=>{
    root.dataset.view=view;
    root.querySelectorAll(".content-tab[data-content-tab]").forEach(item=>{const active=item.dataset.contentTab===view;item.classList.toggle("is-active",active);item.setAttribute("aria-selected",String(active));});
    root.querySelectorAll(".content-panel").forEach(panel=>panel.hidden=panel.dataset.contentPanel!==view);
    if(view==="lyrics"){activeLyricIndex=-1;updateLyrics();}
  };
  for(const tab of root.querySelectorAll(".content-tab[data-content-tab]"))listen(tab,"click",()=>switchView(tab.dataset.contentTab));
  listen(miniPlay,"click",event=>{event.stopPropagation();isPlaying()?pauseAll():play();});
  listen(miniNext,"click",event=>{event.stopPropagation();move(1);});
  const miniPlayer=$(".mini-player",root);
  listen(miniPlayer,"click",event=>{if(event.target.closest("button"))return;switchView("player");});
  shuffleButton.classList.toggle("is-on",shuffle);
  shuffleButton.setAttribute("aria-pressed",String(shuffle));
  repeatButton.classList.toggle("is-on",repeat);
  repeatButton.setAttribute("aria-pressed",String(repeat));
  volume.value=String(audio.volume);
  speed.value=String(media()?.playbackRate || 1);
  engine.volume=Number(volume.value);
  engine.playbackRate=Number(speed.value);
  switchView("player");
  for(const button of $$("[data-open-files]",root))listen(button,"click",()=>input.click());
  listen(input,"change",()=>{if(input.files?.length)addFiles(input.files);input.value="";});
  if(upload){
    const prevent=event=>{event.preventDefault();event.stopPropagation();};
    for(const type of ["dragenter","dragover","dragleave","drop"])listen(upload,type,prevent);
    for(const type of ["dragenter","dragover"])listen(upload,type,()=>upload.classList.add("dragover"));
    for(const type of ["dragleave","drop"])listen(upload,type,()=>upload.classList.remove("dragover"));
    listen(upload,"drop",event=>{const files=event.dataTransfer?.files;if(files?.length)addFiles(files);});
  }
  listen(engine,"trackchange",()=>{currentId=engine.currentId;updateTrack();});

  for(const active of [audio,video]){
    listen(active,"timeupdate",updateProgress);listen(active,"loadedmetadata",()=>{if(active===video&&currentEntry()?.kind==="video"&&video.videoWidth&&video.videoHeight)$("#media-stage",root).style.setProperty("--video-ratio",String(video.videoWidth/video.videoHeight));updateProgress();});listen(active,"durationchange",updateProgress);
    listen(active,"play",updatePlaybackState);listen(active,"pause",updatePlaybackState);
    listen(active,"error",()=>{trackMeta.textContent="このファイルを再生できません。形式に対応しているか確認してください。";updatePlaybackState();});
  }
  updateTrack();
  cleanupActive=()=>{
    if(destroyed)return;
    destroyed=true;
    listeners.forEach(remove=>remove());
    engine.currentId=currentId;
    engine.nextId=nextId;
    engine.shuffle=shuffle;
    engine.repeat=repeat;
    engine.append(video);
    cleanupActive=null;
  };
};
const unmount=()=>cleanupActive?.();
export {init,unmount};
