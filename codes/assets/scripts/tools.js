const $ = (s, r = document) => r.querySelector(s);
const c = (el) => document.createElement(el);

let favoriteUnsubscribe = null;
let activeCleanup = null;
let lifecycle = 0;

const createUI = {};

createUI.fullscreen = (buttons) => {
  const btn = c("button");
  btn.classList.add("tool-fullscreen");
  btn.innerHTML = '<i data-lucide="maximize-2"></i>全画面化';
  buttons.appendChild(btn);

  const storage = window.spaRouter.commonStorage;
  const create = storage.get("createIcons");
  const icons = storage.get("lucideIcons");
  const tool = $("#tool");

  create({ icons });

  btn.addEventListener("click", async () => {
    try {
      if (!document.fullscreenElement) {
        tool.classList.add("fullscreen-enter");
        await tool.requestFullscreen();

        requestAnimationFrame(() => {
          tool.classList.add("fullscreen-active");
        });

        btn.innerHTML = '<i data-lucide="minimize-2"></i>全画面解除';
        create({ icons });
      } else {
        tool.classList.remove("fullscreen-active");

        setTimeout(async () => {
          await document.exitFullscreen();
          tool.classList.remove("fullscreen-enter");
        }, 250);
      }
    } catch (error) {
      console.warn("全画面化に失敗しました。", error);
    }
  });

  const onFullscreenChange = () => {
    if (!document.fullscreenElement) {
      tool.classList.remove("fullscreen-enter", "fullscreen-active");
      btn.innerHTML = '<i data-lucide="maximize-2"></i>全画面化';
      create({ icons });
    }
  };

  document.addEventListener("fullscreenchange", onFullscreenChange);

  return () => {
    document.removeEventListener("fullscreenchange", onFullscreenChange);
  };
};

const getFavoriteDB = async (storage) => {
  let dbPromise = storage.get("favoriteDBPromise");

  if (!dbPromise) {
    const LibDB = storage.get("LibDB");
    if (!LibDB) {
      throw new Error("LibDBがcommonStorageに登録されていません。");
    }

    const db = new LibDB("UsefulTools", "auto", {
      favorite: { keyPath: "id" },
      history: { keyPath: "id" }
    });

    dbPromise = db.ready
      .then(() => db)
      .catch((error) => {
        storage.delete("favoriteDBPromise");
        db.close();
        throw error;
      });

    storage.set("favoriteDBPromise", dbPromise);
  }

  return dbPromise;
};

const normalizePath = (path) => path.replace(/\/+$/, "") || "/";

const findCurrentTool = (registry) => {
  const currentPath = normalizePath(location.pathname);

  for (const [key, tool] of Object.entries(registry)) {
    if (normalizePath(new URL(tool.url, location.origin).pathname) === currentPath) {
      return { key, ...tool };
    }
  }

  return null;
};

const updateFavoriteButton = (button, isFavorite, create, icons) => {
  button.innerHTML = isFavorite
    ? '<i data-lucide="heart-minus"></i>お気に入り解除'
    : '<i data-lucide="heart-plus"></i>お気に入り';

  button.setAttribute("aria-pressed", String(isFavorite));
  button.classList.toggle("is-favorite", isFavorite);
  create({ icons });
};

const initFavorites = async (button, storage, token) => {
  button.disabled = true;
  button.textContent = "読み込み中...";

  try {
    const toolsPromise = storage.get("toolsPromise");
    if (!toolsPromise) {
      throw new Error("tools.jsonの読み込み処理が見つかりません。");
    }

    const [registry, db] = await Promise.all([
      toolsPromise,
      getFavoriteDB(storage)
    ]);

    if (token !== lifecycle || !button.isConnected) return;

    const tool = findCurrentTool(registry);
    if (!tool) {
      throw new Error("現在のページに対応するツール情報がtools.jsonにありません。");
    }

    const favorites = db.store("favorite");
    const create = storage.get("createIcons");
    const icons = storage.get("lucideIcons");

    const refresh = async () => {
      const saved = await favorites.get(tool.id);
      updateFavoriteButton(button, !!saved, create, icons);
    };

    await refresh();
    button.disabled = false;

    button.addEventListener("click", async () => {
      button.disabled = true;

      try {
        const saved = await favorites.get(tool.id);

        if (saved) {
          await favorites.delete(tool.id);
        } else {
          await favorites.put({
            id: tool.id,
            key: tool.key,
            title: tool.title,
            description: tool.description,
            url: tool.url,
            addedAt: Date.now()
          });
        }

        await refresh();
      } catch (error) {
        console.error("[favorite] お気に入りの更新に失敗しました。", error);
      } finally {
        button.disabled = false;
      }
    });

    favoriteUnsubscribe?.();
    favoriteUnsubscribe = db.on("change", (event) => {
      if (event.stores?.includes("favorite")) {
        refresh().catch((error) => {
          console.error("[favorite] 状態の更新に失敗しました。", error);
        });
      }
    });
  } catch (error) {
    if (token === lifecycle && button.isConnected) {
      button.disabled = true;
      button.textContent = "お気に入りを利用できません";
    }
    console.error("[favorite] 初期化に失敗しました。", error);
  }
};

const init = () => {
  activeCleanup?.();
  activeCleanup = null;
  const token = ++lifecycle;

  const buttons = $(".tool-buttons");
  if (!buttons) return;

  const shareBtn = $(".tool-share", buttons);
  const favoriteBtn = $(".tool-favorite", buttons);
  const cleanups = [];

  shareBtn?.addEventListener("click", async () => {
    const shareData = {
      title: document.title,
      text: $('meta[name="description"]')?.content ?? "",
      url: location.href
    };

    try {
      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        console.log("お使いのデバイスは、共有をサポートしていません。");
      }
    } catch (error) {
      if (error.name !== "AbortError") {
        console.warn("共有に失敗しました。", error);
      }
    }
  });

  if (favoriteBtn) {
    initFavorites(favoriteBtn, window.spaRouter.commonStorage, token);
  }

  const setting = $("#page-settings");

  if (setting) {
    try {
      const json = JSON.parse(setting.textContent);

      if (json["tool-fullscreen"]) {
        const cleanup = createUI.fullscreen(buttons);
        if (cleanup) cleanups.push(cleanup);
      }
    } catch (error) {
      console.warn("ページ設定の読み込みに失敗しました。", error);
    }
  }

  activeCleanup = () => {
    favoriteUnsubscribe?.();
    favoriteUnsubscribe = null;
    cleanups.forEach((cleanup) => cleanup());
  };
};

const unmount = () => {
  lifecycle++;
  activeCleanup?.();
  activeCleanup = null;
};

export { init, unmount };
