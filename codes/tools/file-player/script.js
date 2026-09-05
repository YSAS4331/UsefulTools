const $ = (selector, root = document) => root.querySelector(selector);

const init = () => {
  const input = $('#upload-file');
  const uploadContainer = $('#upload-container');

  if (!input || !uploadContainer) return;

  const preventDefaults = event => {
    event.preventDefault();
    event.stopPropagation();
  };

  ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(type => {
    uploadContainer.addEventListener(type, preventDefaults);
  });

  uploadContainer.addEventListener('dragenter', () => {
    uploadContainer.classList.add('dragover');
  });

  uploadContainer.addEventListener('dragover', () => {
    uploadContainer.classList.add('dragover');
  });

  uploadContainer.addEventListener('dragleave', () => {
    uploadContainer.classList.remove('dragover');
  });

  uploadContainer.addEventListener('drop', event => {
    uploadContainer.classList.remove('dragover');

    const file = event.dataTransfer.files?.[0];

    if (file) {
      console.log(file);
    }
  });
};

export { init };
