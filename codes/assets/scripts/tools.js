const $ = (s,r=document) => r.querySelector(s);
const c = el => document.createElement(el);
const shareData = {
  title: document.title,
  text: $('meta[name="description"]')?.content ?? '',
  url: location.href
};

const createUI = {};

createUI.fullscreen = buttons => {
  const btn = c("button");
  btn.classList.add("tool-fullscreen");
  btn.innerHTML = '<i data-lucide="maximize-2"></i>全画面化';
  buttons.appendChild(btn);
};

const init = () => {
  const buttons = $('.tool-buttons');
  const shareBtn = $('.tool-share', buttons);
  const favoBtn = $('.tool-favorite', buttons);

  shareBtn.addEventListener('click', async () => {
    try {
      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        console.log('お使いのデバイスは、共有をサポートしていません。');
      }
    } catch(e) {
      if (e.name !== 'AbortError') {
        console.warn('共有に失敗しました。', e);
      }
    }
  });

  const setting = $('#page-settings');

  if (setting) {
    const json = JSON.parse(setting.textContent);

    if (json["tool-fullscreen"]) {
      createUI.fullscreen(buttons);
    }
  }
};

export { init };
