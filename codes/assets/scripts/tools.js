const $ = (s,r=document) => r.querySelector(s);
const shareData = {
  title: document.title,
  text: $('meta[name="description"]')?.content ?? '',
  url: location.href
};

const init = () => {
  const buttonsParent = $('.tool-buttons');
  const shareBtn = $('.tool-share', buttonsParent);
  const favoBtn = $('.tool-favorite', buttonsParent);

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
};

export { init };
