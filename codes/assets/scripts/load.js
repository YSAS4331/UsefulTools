import "/components/header.js";
import "/components/collapse.js";
import "/components/sidebar.js";
import {
  createIcons, Star, Folders, Blocks, Info, Hash, Share2,
  HeartPlus, BookOpen, Lightbulb, AudioLines, Maximize2, Minimize2, Upload,
  Trash
} from "https://cdn.jsdelivr.net/npm/lucide@1.25.0/+esm";
import { LibDB, LibDBError } from "https://cdn.jsdelivr.net/gh/YSAS4331/LibDB@main/libdb.min.js";

const icons = {
  Star, Folders, Blocks, Info, Hash, Share2,
  HeartPlus, BookOpen, Lightbulb, AudioLines, Maximize2, Minimize2, Upload,
  Trash
};

const setupIcons = () => {
  createIcons({ icons });
};

window.addEventListener("spa:router", (e) => {
  if (e.detail?.type === "after") {
    setupIcons();
  }

  if (e.detail?.type === "setup-ok") {
    const cs = window.spaRouter.commonStorage;

    cs.set("createIcons", createIcons);
    cs.set("lucideIcons", icons);
    cs.set("LibDB", LibDB);
    cs.set("LibDBError", LibDBError);

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
  }
});

setupIcons();
