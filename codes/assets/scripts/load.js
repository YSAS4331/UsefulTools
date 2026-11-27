import "/components/header.js";
import "/components/collapse.js";
import "/components/modal.js";
import "/components/search.js";
import { Modals } from "/managers/modals.js";
import "/components/sidebar.js";
import {
  createIcons, Menu, Settings, Star, Folders, Blocks, Info, Hash, Share2,
  Heart, HeartPlus, HeartMinus, BookOpen, Lightbulb, AudioLines, Maximize2, Minimize2, Upload,
  Trash, Music2, Play, Pause, SkipBack, SkipForward, Shuffle, Repeat1, Volume2, Plus,
  ChevronDown, ChevronUp, ArrowLeft, FileAudio, ImagePlus, History
} from "https://cdn.jsdelivr.net/npm/lucide@1.25.0/+esm";
import { LibDB, LibDBError } from "https://cdn.jsdelivr.net/gh/YSAS4331/LibDB@main/libdb.min.js";

const modals = new Modals();

const icons = {
  Menu, Settings, Star, Folders, Blocks, Info, Hash, Share2,
  Heart, HeartPlus, HeartMinus, BookOpen, Lightbulb, AudioLines, Maximize2, Minimize2, Upload,
  Trash, Music2, Play, Pause, SkipBack, SkipForward, Shuffle, Repeat1, Volume2, Plus,
  ChevronDown, ChevronUp, ArrowLeft, FileAudio, ImagePlus, History
};

const setupIcons = () => {
  createIcons({ icons });
};

const setupCommonStorage = () => {
  const cs = window.spaRouter?.commonStorage;
  if (!cs) return false;

  cs.set("createIcons", createIcons);
  cs.set("lucideIcons", icons);
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
  toolsPromise.catch((error) => {
    console.error("[tools] ツール一覧の読み込みに失敗しました。", error);
  });

  return true;
};

if (!setupCommonStorage()) {
  window.addEventListener("spa:router", (e) => {
    if (e.detail?.type === "setup-ok") setupCommonStorage();
    if (e.detail?.type === "after") setupIcons();
  });
} else {
  window.addEventListener("spa:router", (e) => {
    if (e.detail?.type === "after") setupIcons();
  });
}

setupIcons();
