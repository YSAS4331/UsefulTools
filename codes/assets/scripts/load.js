import "/components/header.js";
import "/components/sidebar.js";
import {
  createIcons, Star, Folders, Blocks, Info, Hash, Share2, 
  HeartPlus, BookOpen, Lightbulb, AudioLines, Maximize2, Minimize2, Upload,
  Trash
} from "https://cdn.jsdelivr.net/npm/lucide@1.25.0/+esm";

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
    window.spaRouter.commonStorage.set("createIcons", createIcons);
    window.spaRouter.commonStorage.set("lucideIcons", icons);
  }
});

setupIcons();
