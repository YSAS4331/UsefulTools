const $ = s => document.querySelector(s);
const c = e => document.createElement(e);

let audio = $('music-player');

if (!audio) {
  audio = c('music-player');
  document.body.appendChild(audio);
}

/* --- UI 要素取得 --- */
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

/* --- ファイル読み込み --- */
fileUp.addEventListener('change', e => {
  tracks = [...e.target.files];
  playlist.innerHTML = '';

  tracks.forEach((file, i) => {
    const li = c('li');
    li.textContent = file.name;
    li.addEventListener('click', () => loadTrack(i));
    playlist.appendChild(li);
  });

  loadTrack(0);
});

/* --- 曲読み込み --- */
function loadTrack(i) {
  index = i;
  const file = tracks[i];
  if (!file) return;

  audio.src = URL.createObjectURL(file);
  audio.load();
  audio.play();

  uiTitle.textContent = file.name;
}

/* --- 再生/停止 --- */
uiPlay.addEventListener('click', () => {
  if (audio.paused) {
    audio.play();
    uiPlay.innerHTML = '<span class="material-symbols-outlined">pause</span>';
  } else {
    audio.pause();
    uiPlay.innerHTML = '<span class="material-symbols-outlined">play_arrow</span>';
  }
});

/* --- 前後の曲 --- */
uiPrev.addEventListener('click', () => {
  loadTrack((index - 1 + tracks.length) % tracks.length);
});

uiNext.addEventListener('click', () => {
  loadTrack((index + 1) % tracks.length);
});

/* --- シークバー --- */
audio.addEventListener('timeupdate', () => {
  uiSeek.value = audio.currentTime / audio.duration * 100 || 0;
  uiCurrent.textContent = format(audio.currentTime);
  uiDuration.textContent = format(audio.duration);
});

uiSeek.addEventListener('input', () => {
  audio.currentTime = audio.duration * (uiSeek.value / 100);
});

/* --- 音量 --- */
uiVolume.addEventListener('input', () => {
  audio.volume = uiVolume.value;
});

/* --- 時間フォーマット --- */
function format(t) {
  if (!t) return '00:00';
  const m = Math.floor(t / 60);
  const s = Math.floor(t % 60);
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}
