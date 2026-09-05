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
      li.textContent = `${file.name} (${(file.size / 1024 / 1024).toFixed(2)} MB) `;

      const deleteBtn = document.createElement('button');
      deleteBtn.textContent = '削除';
      deleteBtn.type = 'button';
      deleteBtn.addEventListener('click', () => {
        files.delete(fileKey);
        renderList('remove', fileKey);
      });

      li.appendChild(deleteBtn);
      list.appendChild(li);
    } 
    
    else if (action === 'remove') {
      const targetLi = $(`[data-file-key="${fileKey}"]`, list);
      if (targetLi) {
        targetLi.remove();
      }
    }
  };

  const updateList = file => {
    const type = file.type;
    if (!(type.startsWith("audio/") || type.startsWith("video/"))) return;

    const fileKey = `${file.name}-${file.size}`;

    if (files.has(fileKey)) {
      alert('このファイルは既に選択されています。');
      return;
    }

    files.set(fileKey, file);
    renderList('add', fileKey, file);
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
      updateList(file);
    }
  });

  input?.addEventListener('change', event => {
    const file = event.target.files?.[0];
    if (file) {
      updateList(file);
    }
  });
};

export { init };
