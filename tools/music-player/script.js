window.addEventListener("DOMContentLoaded", () => {
  const fileUp = document.getElementById("fileUp");
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

  let player = document.querySelector("music-player");
  if (!player) {
    player = document.createElement('music-player');
    document.body.appendChild(player);
    updateTrackInfo();
    renderPlaylist();
  }

  /* --- ファイル追加 --- */
  fileUp.addEventListener("change", e => {
    if (!e.target.files || e.target.files.length === 0) return;
    player.addFiles(e.target.files);
    renderPlaylist();
  });

  /* --- 再生/停止 --- */
  playBtn.addEventListener("click", () => {
    if (player.paused) {
      player.play();
    } else {
      player.pause();
    }
  });

  /* --- 次/前 --- */
  prevBtn.addEventListener("click", () => player.prev());
  nextBtn.addEventListener("click", () => player.next());

  /* --- 音量 / ミュート / 速度 / ループ --- */
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

  /* --- 曲が変わったら UI 更新 --- */
  player.addEventListener("trackchange", () => {
    updateTrackInfo();
    renderPlaylist();
  });

  /* --- 再生/停止アイコン切り替え --- */
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

  /* --- 再生位置更新 --- */
  player.addEventListener("timeupdate", () => {
    const cur = player.currentTime;
    const dur = player.duration;

    if (dur > 0) {
      seekBar.value = (cur / dur) * 100;
    } else {
      seekBar.value = 0;
    }

    current.textContent = formatTime(cur);
    duration.textContent = formatTime(dur);

    dbgProgress.textContent = player.progress.toFixed(3);
    dbgEnded.textContent = String(player.ended);
  });

  /* --- シークバー操作 --- */
  seekBar.addEventListener("input", () => {
    const dur = player.duration;
    if (!dur) return;
    player.currentTime = (seekBar.value / 100) * dur;
  });

  /* --- プレイリスト描画 --- */
  function renderPlaylist() {
    const files = player.files; // コピーが返る
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
      upBtn.textContent = "↑";
      upBtn.disabled = i === 0;
      upBtn.addEventListener("click", e => {
        e.stopPropagation();
        player.swap(i, i - 1);
        renderPlaylist();
      });

      const downBtn = document.createElement("button");
      downBtn.textContent = "↓";
      downBtn.disabled = i === files.length - 1;
      downBtn.addEventListener("click", e => {
        e.stopPropagation();
        player.swap(i, i + 1);
        renderPlaylist();
      });

      const rmBtn = document.createElement("button");
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

  /* --- 曲情報更新 --- */
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

  /* --- 時間フォーマット --- */
  function formatTime(sec) {
    if (!sec || isNaN(sec)) return "0:00";
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
  }

  // 初期状態反映
  volume.value = player.volume;
  mute.checked = player.muted;
  rate.value = String(player.playbackRate);
  loop.checked = player.loop;
  dbgPaused.textContent = String(player.paused);
  dbgEnded.textContent = String(player.ended);
});
