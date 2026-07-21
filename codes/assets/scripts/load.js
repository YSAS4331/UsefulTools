import '/UsefulTools/components/header.js';
import '/UsefulTools/components/sidebar.js';
import { createIcons, Star, Folders, Blocks, Info, Hash, Share2, HeartPlus, BookOpen, Lightulb } from 'https://cdn.jsdelivr.net/npm/lucide@1.25.0/+esm';

const setupIcons = () => {
  createIcons({
    icons: {
      Star,
      Folders,
      Blocks,
      Info,
      Hash,
      Share2,
      HeartPlus,
      BookOpen,
      Lightulb
    }
  });
}

window.addEventListener('spa:router', e => {
  if (e.detail.type === 'after') {
    setupIcons();
  }
});

setupIcons();
