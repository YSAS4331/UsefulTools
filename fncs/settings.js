import $ from 'https://ysas4331.github.io/UsefulTools/fncs/utils.js';

async function getAllUsefulData() {
  // --- localStorage ---
  const local = Object.keys(localStorage)
    .filter(k => k.startsWith('USEFUL-'))
    .map(k => ({
      key: k,
      value: localStorage.getItem(k)
    }));

  // localStorage のサイズ計算（UTF-16 → 2byte換算）
  const localSize = local.reduce((sum, item) => {
    const bytes = (item.key.length + item.value.length) * 2;
    return sum + bytes;
  }, 0);

  // --- indexedDB ---
  const dbs = await indexedDB.databases();
  const indexed = dbs
    .filter(db => db.name && db.name.startsWith('USEFUL-'))
    .map(db => ({
      name: db.name,
      version: db.version,
      size: db.estimatedSize || 0
    }));

  // indexedDB のサイズ合計
  const indexedSize = indexed.reduce((sum, db) => sum + db.size, 0);

  return {
    local,
    indexed,
    localSize,
    indexedSize
  };
}

window.addEventListener('open-settings', async () => {
  const { content } = $.dialog();

  content.innerHTML = `
    <style>
      .sidebar {
        width: 160px;
        padding: 0;
        margin: 0;
        list-style: none;
        border-right: 2px solid var(--accent);
      }
      .sidebar li {
        width: 100%;
      }
      .sidebar button.nostyle {
        width: 100%;
        padding: .6rem .8rem;
        text-align: left;
        background: none;
        border: none;
        cursor: pointer;
        font-size: 1rem;
        transition: background .25s ease;
      }
      .sidebar li.active button {
        background: color-mix(in srgb, var(--accent) 25%, transparent 75%);
        font-weight: bold;
      }
      .sidebar button:hover {
        background: color-mix(in srgb, var(--accentGrey) 40%, transparent 60%);
      }

      .main > div {
        display: none;
        position: relative;
        overflow-y: auto;
      }
      .main > div.active {
        display: block;
        height: 100%;
      }
      .setting-section {
        position: relative;
      }
      .setting-section h3:first-child {
        position: sticky;
        top: 0;
      }

      .setting-item {
        margin-bottom: 1rem;
      }
      .setting-item label {
        display: block;
        margin-bottom: .3rem;
      }
      .setting-item input[type="range"] {
        width: 100%;
      }
    </style>

    <div style="display:flex;width:100%;height:100%;">
      <ul class="sidebar" role="tab">
        <li data-tab="theme" class="active">
          <button class="nostyle">テーマ</button>
        </li>
        <li data-tab="accessibility">
          <button class="nostyle">アクセシビリティ</button>
        </li>
        <li data-tab="data">
          <button class="nostyle">ストレージ</button>
        </li>
      </ul>

      <div class="main" style="flex:1;height:100%;padding-left:1rem;overflow:hidden;">
        <div data-tab="theme" class="active">
          <h2>テーマ設定</h2>
          <section class="setting-section">
            <h3>テーマ選択</h3>
          </section>
        </div>
        <div data-tab="accessibility">
          <h2>アクセシビリティ設定</h2>
        </div>
        <div data-tab="data">
          <h2>データ管理</h2>
          <h3>保存されているデータ一覧</h3>
          <p class="localStorageSize">読み込み中です...</p>
          <p class="indexedSize">読み込み中です...</p>
        </div>
      </div>
    </div>
  `;

  const sidebar = $('.sidebar', content);
  const main = $('.main', content);

  sidebar.addEventListener('click', e => {
    const li = e.target.closest('li');
    if (!li) return;

    const tab = li.dataset.tab;

    sidebar.querySelectorAll('li').forEach(el => el.classList.remove('active'));
    li.classList.add('active');

    main.querySelectorAll('div[data-tab]').forEach(el => el.classList.remove('active'));
    main.querySelector(`[data-tab="${tab}"]`).classList.add('active');
  });

  const { local, indexed, localSize, indexedSize } = await getAllUsefulData();

  $('.localStorageSize', main).textContent = `localStorage: ${(localSize / 1024).toFixed(2)} KB / ${local.length} items`;
});
