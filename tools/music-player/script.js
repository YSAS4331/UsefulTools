const $ = s => document.querySelector(s);
const c = e => document.createElement(e);

let audio = $('music-player');

if (!audio) {
  audio = c('music-player');
  document.body.appendChild(audio);
}
