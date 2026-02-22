/* ============================================================
   SPA 対応版 music-player script.js
   - DOM が揃ってから初期化
   - 他ページでは何もしない
   - イベント多重登録なし
   ============================================================ */

let initialized = false;

export function init() {
  // すでに初期化済みなら何もしない（once 対応）
  if (initialized) return;
  initialized = true;

  // SPA 遷移後に DOM が揃ってから setup() を実行
  window.addEventListener("spa:router", e => {
    if (e.detail.type === "after") {
      setup();
    }
  });

  // 初回ロード時
  if (document.readyState === "complete" || document.readyState === "interactive") {
    setup();
  } else {
    window.addEventListener("DOMContentLoaded", setup);
  }
}

/* ============================================================
   DOM が揃ってから実行される本体
   ============================================================ */
function setup() {
  // ページに UI が無い場合は何もしない（他ページ対策）
  const fileUp = document.getElementById("fileUp");
  if (!fileUp) return;

  const playBtn = document.getElementById("play");
  const prevBtn = document.getElementById("prev");
  const nextBtn = document.getElementById("next");

  const trackName = document.getElementById("trackName");
  const trackIndex = document.getElementById("trackIndex");
  const trackCount = document.getElementById("trackCount");

  const seekBar = document.getElementById("seekBar");
  const current = document.getElementById("current");
  const duration = document.getElementById("duration");

  const volume = document.getElementById("volume");
  const mute = document.getElementById("mute");
  const rate = document.getElementById("rate");
  const loop = document.getElementById("loop");

  const listEl = document.getElementById("list");

  const dbgProgress = document.getElementById("dbgProgress");
  const dbgPaused = document.getElementById("dbgPaused");
  const dbgEnded = document.getElementById("dbgEnded");

  /* ============================================================
     music-player 要素の確保
     ============================================================ */
  let player = document.querySelector("music-player");
  if (!player) {
    player = document.createElement("music-player");
    document.body.appendChild(player);
  }

  /* ============================================================
     UI 初期反映
     ============================================================ */
  function updateTrackInfo() {
    const file = player.currentFile;
    if (file) {
      trackName.textContent = file.name;
      trackIndex.textContent = player.index + 1;
    } else {
      trackName.textContent = "---";
      trackIndex.textContent = "-";
    }
  }

  function formatTime(sec) {
    if (!sec || isNaN(sec)) return "0:00";
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
  }

  function renderPlaylist() {
    const files = player.files;
    listEl.innerHTML = "";

    trackCount.textContent = files.length;

    files.forEach((file, i) => {
      const li = document.createElement("li");
      li.textContent = file.name;
      if (i === player.index) li.classList.add("active");

      li.addEventListener("click", () => {
        player.index = i;
      });

      const actions = document.createElement("span");
      actions.className = "actions";

      const upBtn = document.createElement("button");
      upBtn.className = 'nostyle'
      upBtn.textContent = "↑";
      upBtn.disabled = i === 0;
      upBtn.addEventListener("click", e => {
        e.stopPropagation();
        player.swap(i, i - 1);
        renderPlaylist();
      });

      const downBtn = document.createElement("button");
       downBtn.className = 'nostyle';
      downBtn.textContent = "↓";
      downBtn.disabled = i === files.length - 1;
      downBtn.addEventListener("click", e => {
        e.stopPropagation();
        player.swap(i, i + 1);
        renderPlaylist();
      });

      const rmBtn = document.createElement("button");
       rmBtn.className = 'nostyle';
      rmBtn.textContent = "×";
      rmBtn.addEventListener("click", e => {
        e.stopPropagation();
        player.remove(i);
        renderPlaylist();
        updateTrackInfo();
      });

      actions.appendChild(upBtn);
      actions.appendChild(downBtn);
      actions.appendChild(rmBtn);

      li.appendChild(actions);
      listEl.appendChild(li);
    });

    updateTrackInfo();
  }

  /* ============================================================
     初期 UI 反映
     ============================================================ */
  volume.value = player.volume;
  mute.checked = player.muted;
  rate.value = String(player.playbackRate);
  loop.checked = player.loop;

  updateTrackInfo();
  renderPlaylist();

  dbgPaused.textContent = String(player.paused);
  dbgEnded.textContent = String(player.ended);

  /* ============================================================
     イベント登録
     ============================================================ */

  fileUp.addEventListener("change", e => {
    if (!e.target.files || e.target.files.length === 0) return;
    player.addFiles(e.target.files);
    renderPlaylist();
  });

  playBtn.addEventListener("click", () => {
    player.paused ? player.play() : player.pause();
  });

  prevBtn.addEventListener("click", () => player.prev());
  nextBtn.addEventListener("click", () => player.next());

  volume.addEventListener("input", () => {
    player.volume = Number(volume.value);
  });

  mute.addEventListener("change", () => {
    player.muted = mute.checked;
  });

  rate.addEventListener("change", () => {
    player.playbackRate = Number(rate.value);
  });

  loop.addEventListener("change", () => {
    player.loop = loop.checked;
  });

  player.addEventListener("trackchange", () => {
    updateTrackInfo();
    renderPlaylist();
  });

  player.addEventListener("play", () => {
    playBtn.innerHTML = `<i class="fa fa-pause"></i>`;
    dbgPaused.textContent = "false";
  });

  player.addEventListener("pause", () => {
    playBtn.innerHTML = `<i class="fa fa-play"></i>`;
    dbgPaused.textContent = "true";
  });

  player.addEventListener("ended", () => {
    dbgEnded.textContent = "true";
  });

  player.addEventListener("timeupdate", () => {
    const cur = player.currentTime;
    const dur = player.duration;

    seekBar.value = dur > 0 ? (cur / dur) * 100 : 0;

    current.textContent = formatTime(cur);
    duration.textContent = formatTime(dur);

    dbgProgress.textContent = player.progress.toFixed(3);
    dbgEnded.textContent = String(player.ended);
  });

  seekBar.addEventListener("input", () => {
    const dur = player.duration;
    if (!dur) return;
    player.currentTime = (seekBar.value / 100) * dur;
  });
}
