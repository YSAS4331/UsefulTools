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

window.addEventListener('open-settings', async e => {
  const { content } = $.dialog();
  const tab = e?.detail?.tab ?? 'theme';

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
        margin-top:.45rem;
      }
      .setting-section h3:first-child {
        position: sticky;
        top: 0;
      }
      .setting-section p:first-child {
        margin-top: .55rem;
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

      #autoSearch-menu {
        margin-top: 0;
        margin-left: 1.5rem;
      }
    </style>

    <div style="display:flex;width:100%;height:100%;">
      <ul class="sidebar" role="tab">
        <li data-tab="theme">
          <button class="nostyle">テーマ</button>
        </li>
        <li data-tab="accessibility">
          <button class="nostyle">アクセシビリティ</button>
        </li>
        <li data-tab="data">
          <button class="nostyle">ストレージ</button>
        </li>
        <li data-tab="search">
          <button class="nostyle">検索オプション</button>
        </li>
      </ul>

      <div class="main" style="flex:1;height:100%;padding-left:1rem;overflow:hidden;">
        <div data-tab="theme">
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
          <section class="setting-section">
            <h3>保存されているデータ一覧</h3>
            <p>保存されているデータを確認し、削除可能なものは削除できます</p>
          </section>
          <section class="setting-section">
            <p class="localStorageSize">読み込み中です...</p>
            <p class="indexedSize">読み込み中です...</p>
            <table class="localTable"></table>
          </section>
        </div>
        <div data-tab="search">
          <h2>検索オプション</h2>
          <section class="setting-section">
            <h3>入力時の設定</h3>
            <div id="autoSearch-parent">
              <p>入力時の自動検索</p>
              <div class="toggle_button">
                <input id="input-toggle" class="toggle_input" type="checkbox">
                <label for="input-toggle" class="toggle_label">
              </div>
              <div id="autoSearch-menu" hidden>
                <p>検索対象の選択</p>
                <custom-seg id="for-search" value="3">
                  <span>タイトル</span>
                  <span>説明文</span>
                  <span>タグ</span>
                  <span>すべて</span>
                </custom-seg>
              </div>
            </div>
            <p>検索履歴の保存</p>
            <div class="toggle_button">
              <input id="search-toggle" class="toggle_input" type="checkbox">
              <label for="search-toggle" class="toggle_label">
            </div>
          </section>
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

  main.querySelectorAll('.toggle_button > .toggle_input').forEach(el => {
    const key = `USEFUL-${el.id}`;
  
    // 読み込み時に復元
    const saved = localStorage.getItem(key);
    if (saved !== null) {
      el.checked = saved === '1';
    }

    if (el.id === 'input-toggle') {
      $('#autoSearch-parent > #autoSearch-menu', main).hidden = !el.checked;
    }
  
    // 変更時に保存
    el.addEventListener('change', () => {
      localStorage.setItem(key, el.checked ? '1' : '0');
      if (el.id === 'input-toggle') {
        $('#autoSearch-parent > #autoSearch-menu', main).hidden = !el.checked;
      }
    });
  });
  main.querySelectorAll('custom-seg').forEach(el => {
    const key = `USEFUL-${el.id}`;

    // 読み込み時に復元
    const rawValue = localStorage.getItem(key);
    
    if (rawValue !== null) {
      const parsed = Number(rawValue);
      /* check if it's a valid number, otherwise fallback to 3 */
      el.value = !isNaN(parsed) ? parsed : 3;
    } else {
      /* default value when no data exists */
      el.value = 3;
    }

    el.addEventListener('change', e => {
      const value = e?.detail?.index;

      localStorage.setItem(key, value);
    });
  });

  ($(`[data-tab="${tab}"]`, sidebar)??$('[data-tab="theme"]', sidebar))?.click();

  const { local, indexed, localSize, indexedSize } = await getAllUsefulData();

  $('.localStorageSize', main).textContent = `localStorage: ${(localSize / 1024).toFixed(2)} KB / ${local.length} items`;
  $('.indexedSize', main).textContent = `indexedDB: ${(indexedSize / 1024).toFixed(2)} KB / ${indexed.length} DBs`;
});
