import "/UsefulTools/components/header.js";
import "/UsefulTools/components/sidebar.js";
import '/Components/source/tabs.js';

import {
  createIcons, Star, Folders, Blocks, Info, Hash, Share2, 
  HeartPlus, BookOpen, Lightbulb, AudioLines, Maximize2, Minimize2, Upload
} from "https://cdn.jsdelivr.net/npm/lucide@1.25.0/+esm";

const icons = {
  Star, Folders, Blocks, Info, Hash, Share2, 
  HeartPlus, BookOpen, Lightbulb, AudioLines, Maximize2, Minimize2, Upload
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
