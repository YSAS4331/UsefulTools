const $ = (selector, root = document) => root.querySelector(selector);

const files = new Map();

const init = () => {
  const input = $('#upload-file');
  const uploadContainer = $('#upload-container');
  const list = $('#files');

  if (!input || !uploadContainer) return;

  const preventDefaults = event => {
    event.preventDefault();
    event.stopPropagation();
  };

  const renderList = (action, fileKey, file) => {
    if (!list) return;

    if (action === 'add') {
      if ($(`[data-file-key="${fileKey}"]`, list)) return;

      const li = document.createElement('li');
      li.setAttribute('data-file-key', fileKey);
      li.innerHTML = `<span class="list-filename">${file.name} (${(file.size / 1024 / 1024).toFixed(2)} MB)</span>`;

      const buttons = document.createElement('div');
      buttons.classList.add('buttons');

      const deleteBtn = document.createElement('button');
      deleteBtn.title = '削除';
      deleteBtn.type = 'button';
      deleteBtn.classList.add('nostyle');
      deleteBtn.innerHTML = '<i data-lucide="trash"></i>';

      deleteBtn.addEventListener('click', () => {
        files.delete(fileKey);
        renderList('remove', fileKey);
      });

      buttons.appendChild(deleteBtn);

      li.appendChild(buttons);
      list.appendChild(li);

      const create = window.spaRouter?.commonStorage?.get('createIcons');
      const icons = window.spaRouter?.commonStorage?.get('lucideIcons');

      create?.({ icons });
    } else if (action === 'remove') {
      const targetLi = $(`[data-file-key="${fileKey}"]`, list);

      if (targetLi) {
        targetLi.remove();
      }
    }
  };

  const updateList = file => {
    const type = file.type;

    if (!(type.startsWith('audio/') || type.startsWith('video/'))) {
      return;
    }

    const fileKey = `${file.name}-${file.size}`;

    if (files.has(fileKey)) {
      return;
    }

    files.set(fileKey, file);
    renderList('add', fileKey, file);
  };

  const updateFiles = fileList => {
    [...fileList].forEach(updateList);
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

    const fileList = event.dataTransfer?.files;

    if (fileList?.length) {
      updateFiles(fileList);
    }
  });

  input.addEventListener('change', event => {
    const fileList = event.target.files;

    if (fileList?.length) {
      updateFiles(fileList);
    }
  });
};

export { init };
