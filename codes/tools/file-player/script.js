const $ = (s,r=document) => r.querySelector(s);

const init = () => {
  const input = $('#upload-file');
  const uploadContainer = $('#upload-container');
  const playerContainer = $('#player-container');

  if (!input || !uploadContainer || !playerContainer) return;

  let objectURL = null;
  let audio = null;

  const createPlayer = file => {
    if (!file.type.startsWith('audio/') && !file.type.startsWith('video/')) return;

    if (objectURL) {
      URL.revokeObjectURL(objectURL);
      objectURL = null;
    }

    audio?.pause();
    audio = null;

    objectURL = URL.createObjectURL(file);

    if (file.type.startsWith('audio/')) {
      audio = new Audio(objectURL);
      audio.preload = 'metadata';
      audio.controls = true;

      playerContainer.replaceChildren(audio);
      audio.play().catch(() => {});
      return;
    }

    const video = document.createElement('video');

    video.controls = true;
    video.preload = 'metadata';
    video.playsInline = true;
    video.src = objectURL;

    playerContainer.replaceChildren(video);
    video.play().catch(() => {});
  };

  input.addEventListener('change', () => {
    const file = input.files?.[0];

    if (file) createPlayer(file);
  });

  uploadContainer.addEventListener('dragover', event => {
    event.preventDefault();
    uploadContainer.classList.add('dragover');
  });

  uploadContainer.addEventListener('dragleave', () => {
    uploadContainer.classList.remove('dragover');
  });

  uploadContainer.addEventListener('drop', event => {
    event.preventDefault();
    uploadContainer.classList.remove('dragover');

    const file = event.dataTransfer.files?.[0];

    if (file) createPlayer(file);
  });

  window.addEventListener('beforeunload', () => {
    audio?.pause();

    if (objectURL) {
      URL.revokeObjectURL(objectURL);
    }
  });
};

export { init };
