const $ = s => document.querySelector(s);
const c = e => document.createElement(e);

/* --- music-player を確実に生成 --- */
let audio = $('music-player');
if (!audio) {
  audio = c('music-player');
  document.body.appendChild(audio);
}

/* --- UI 要素 --- */
const fileUp = $('#fileUp');
const uiPlay = $('#uiPlay');
const uiPrev = $('#uiPrev');
const uiNext = $('#uiNext');
const uiSeek = $('#uiSeek');
const uiVolume = $('#uiVolume');
const uiTitle = $('#uiTitle');
const uiCurrent = $('#uiCurrent');
const uiDuration = $('#uiDuration');
const playlist = $('#playlist');

/* --- プレイリスト管理 --- */
let tracks = [];
let index = 0;

/* ============================
   ファイル読み込み
============================ */
fileUp.addEventListener('change', e => {
  tracks = [...e.target.files];
  playlist.innerHTML = '';

  tracks.forEach((file, i) => {
    const li = c('li');
    li.textContent = cleanName(file.name);
    li.dataset.index = i;
    li.addEventListener('click', () => loadTrack(i));
    playlist.appendChild(li);
  });

  loadTrack(0);
});

/* ============================
   曲読み込み
============================ */
function loadTrack(i) {
  index = i;
  const file = tracks[i];
  if (!file) return;

  audio.src = URL.createObjectURL(file);
  audio.load();

  audio.play().catch(err => {
    console.warn('Autoplay blocked:', err);
  });

  uiTitle.textContent = cleanName(file.name);
  updatePlaylistUI();
  updatePlayButton(true);
}

/* ============================
   再生/停止
============================ */
uiPlay.addEventListener('click', () => {
  if (audio.paused) {
    audio.play();
    updatePlayButton(true);
  } else {
    audio.pause();
    updatePlayButton(false);
  }
});

function updatePlayButton(isPlaying) {
  uiPlay.innerHTML = isPlaying
    ? '<span class="material-symbols-outlined">pause</span>'
    : '<span class="material-symbols-outlined">play_arrow</span>';
}

/* ============================
   前後の曲
============================ */
uiPrev.addEventListener('click', () => {
  loadTrack((index - 1 + tracks.length) % tracks.length);
});

uiNext.addEventListener('click', () => {
  loadTrack((index + 1) % tracks.length);
});

/* --- 曲が終わったら次へ --- */
audio.addEventListener('ended', () => {
  loadTrack((index + 1) % tracks.length);
});

/* ============================
   シークバー同期（完全同期版）
============================ */
function syncSeek() {
  if (audio.duration) {
    const percent = audio.currentTime / audio.duration * 100;
    uiSeek.value = percent;

    uiCurrent.textContent = format(audio.currentTime);
    uiDuration.textContent = format(audio.duration);
  }
  requestAnimationFrame(syncSeek);
}
requestAnimationFrame(syncSeek);

/* --- シークバー操作（確実に反映） --- */
uiSeek.addEventListener('input', () => {
  if (!audio.duration) return;
  const newTime = audio.duration * (uiSeek.value / 100);
  audio.currentTime = newTime;
});

/* ============================
   音量
============================ */
uiVolume.addEventListener('input', () => {
  audio.volume = uiVolume.value;
});

/* ============================
   プレイリスト UI 更新
============================ */
function updatePlaylistUI() {
  [...playlist.children].forEach(li => {
    li.classList.toggle('active', Number(li.dataset.index) === index);
  });
}

/* ============================
   ユーティリティ
============================ */
function cleanName(name) {
  return name.replace(/\.[^/.]+$/, '');
}

function format(t) {
  if (!t) return '00:00';
  const m = Math.floor(t / 60);
  const s = Math.floor(t % 60);
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}
