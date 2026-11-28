import "/components/collapse.js";
import "/components/switch.js";
import "/components/modal.js";
import "/components/search.js";
import "/components/settings.js";
import { Modals } from "/managers/modals.js";
import "/components/sidebar.js";
import "/components/header.js";
import {
  createIcons, Menu, Settings, Star, Folders, Blocks, Info, Hash, Share2,
  Heart, HeartPlus, HeartMinus, BookOpen, Lightbulb, AudioLines, FileText, Maximize2, Minimize2, Upload,
  Trash, Music2, Play, Pause, SkipBack, SkipForward, Shuffle, Repeat1, Volume2, Plus,
  Copy, X, Check,
  ChevronDown, ChevronUp, ArrowLeft, FileAudio, ImagePlus, History
} from "https://cdn.jsdelivr.net/npm/lucide@1.25.0/+esm";
import { LibDB, LibDBError } from "https://cdn.jsdelivr.net/gh/YSAS4331/LibDB@main/libdb.min.js";

const modals = new Modals();

const icons = {
  Menu, Settings, Star, Folders, Blocks, Info, Hash, Share2,
  Heart, HeartPlus, HeartMinus, BookOpen, Lightbulb, AudioLines, FileText, Maximize2, Minimize2, Upload,
  Trash, Music2, Play, Pause, SkipBack, SkipForward, Shuffle, Repeat1, Volume2, Plus,
  Copy, X, Check,
  ChevronDown, ChevronUp, ArrowLeft, FileAudio, ImagePlus, History
};

const setupIcons = (root = document.body) => {
  createIcons({ icons, root });
};

const setupCommonStorage = () => {
  const cs = window.spaRouter?.commonStorage;
  if (!cs) return false;

  const getDatabase = () => {
    let promise = cs.get("databasePromise");
    if (!promise) {
      const db = new LibDB("UsefulTools", "auto", {
        favorite: { keyPath: "id" },
        history: { keyPath: "id" },
        settings: { keyPath: "key" }
      });
      promise = db.ready.then(() => db).catch((error) => {
        cs.delete("databasePromise");
        cs.delete("favoriteDBPromise");
        db.close();
        throw error;
      });
      cs.set("databasePromise", promise);
      cs.set("favoriteDBPromise", promise);
    }
    return promise;
  };

  cs.set("createIcons", createIcons);
  cs.set("lucideIcons", icons);
  cs.set("getDatabase", getDatabase);
  cs.set("LibDB", LibDB);
  cs.set("LibDBError", LibDBError);
  cs.set("Modals", modals);

  const toolsPromise = fetch("/assets/tools.json")
    .then((response) => {
      if (!response.ok) {
        throw new Error(`tools.jsonの読み込みに失敗しました: HTTP ${response.status}`);
      }
      return response.json();
    })
    .then((tools) => {
      cs.set("tools", tools);
      return tools;
    });

  cs.set("toolsPromise", toolsPromise);

  let currentTheme = "system";
  let currentAccentColor = "green";
  let systemThemeQuery;
  const applyAccentColor = (value) => {
    const colors = ["green", "blue", "red", "purple", "orange", "pink"];
    const root = document.documentElement;
    colors.forEach((color) => root.classList.toggle(color, color === value));
  };
  const applyTheme = (value) => {
    const prefersDark = window.matchMedia?.("(prefers-color-scheme: dark)").matches;
    document.documentElement.classList.toggle("dark", value === "dark" || (value === "system" && prefersDark));
  };
  const onSystemThemeChange = () => {
    if (currentTheme === "system") applyTheme("system");
  };
  systemThemeQuery = window.matchMedia?.("(prefers-color-scheme: dark)");
  systemThemeQuery?.addEventListener?.("change", onSystemThemeChange);

  const themePromise = getDatabase().then(async (db) => {
    const settings = db.store("settings");
    const saved = await settings.get("theme");
    const accent = await settings.get("accentColor");
    currentTheme = saved?.value || "system";
    currentAccentColor = accent?.value || "green";
    applyTheme(currentTheme);
    applyAccentColor(currentAccentColor);
    db.on("change", async (event) => {
      if (!event.stores?.includes("settings")) return;
      const record = await settings.get("theme");
      const accent = await settings.get("accentColor");
      currentTheme = record?.value || "system";
      currentAccentColor = accent?.value || "green";
      applyTheme(currentTheme);
      applyAccentColor(currentAccentColor);
    });
  });

  Promise.allSettled([getDatabase(), toolsPromise, themePromise]).then(() => {
    const overlay = document.getElementById("app-loading");
    if (overlay) {
      overlay.classList.add("is-hidden");
      overlay.addEventListener("transitionend", () => overlay.remove(), { once: true });
      setTimeout(() => overlay.remove(), 500);
    }
    window.dispatchEvent(new Event("app:ready"));
  });

  setTimeout(() => {
    const overlay = document.getElementById("app-loading");
    if (!overlay) return;
    overlay.classList.add("is-hidden");
    setTimeout(() => overlay.remove(), 500);
    console.error("[loading] 初期化がタイムアウトしました。");
  }, 15000);

  toolsPromise.catch((error) => {
    console.error("[tools] ツール一覧の読み込みに失敗しました。", error);
  });

  return true;
};

if (!setupCommonStorage()) {
  window.addEventListener("spa:router", (e) => {
    if (e.detail?.type === "setup-ok") {
      setupCommonStorage();
    }
    if (e.detail?.type === "after") setupIcons();
  });
} else {
  window.addEventListener("spa:router", (e) => {
    if (e.detail?.type === "after") setupIcons();
  });
}

setupIcons();
