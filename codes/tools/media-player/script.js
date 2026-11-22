const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];

const formatTime = (seconds) => {
  if (!Number.isFinite(seconds) || seconds < 0) return "0:00";
  const value = Math.floor(seconds);
  const hours = Math.floor(value / 3600);
  const minutes = Math.floor((value % 3600) / 60);
  const secs = value % 60;
  return hours
    ? `${hours}:${String(minutes).padStart(2, "0")}:${String(secs).padStart(2, "0")}`
    : `${minutes}:${String(secs).padStart(2, "0")}`;
};

const formatSize = (bytes) => {
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
  return `${(bytes / 1024 / 1024 / 1024).toFixed(2)} GB`;
};

let cleanupActive = null;

const init = () => {
  cleanupActive?.();

  const root = $("#tool");
  const input = $("#upload-file");
  if (!root || !input) return;

  const audio = $("#audio-player", root);
  const video = $("#video-player", root);
  const stage = $("#media-stage", root);
  const audioVisual = $("#audio-visual", root);
  const stageEmpty = $("#stage-empty", root);
  const queue = $("#queue-list", root);
  const library = $("#files", root);
  const count = $("#file-count", root);
  const seek = $("#seek-bar", root);
  const playButton = $("#play-button", root);
  const previousButton = $("#previous-button", root);
  const nextButton = $("#next-button", root);
  const shuffleButton = $("#shuffle-button", root);
  const repeatButton = $("#repeat-button", root);
  const volume = $("#volume-bar", root);
  const speed = $("#speed-select", root);
  const currentTime = $("#current-time", root);
  const duration = $("#duration", root);
  const trackTitle = $("#track-title", root);
  const trackMeta = $("#track-meta", root);
  const indicator = $("#playing-indicator", root);
  const upload = $("#upload-container", root);

  const entries = new Map();
  let currentId = null;
  let nextId = 1;
  let shuffle = false;
  let repeat = false;
  let seeking = false;
  let destroyed = false;
  const listeners = [];

  const listen = (target, type, handler, options) => {
    target.addEventListener(type, handler, options);
    listeners.push(() => target.removeEventListener(type, handler, options));
  };

  const currentEntry = () => entries.get(currentId);
  const media = () => currentEntry()?.kind === "video" ? video : audio;
  const isPlaying = () => !audio.paused || !video.paused;

  const renderQueue = () => {
    queue.replaceChildren();
    if (!entries.size) {
      const empty = document.createElement("li");
      empty.className = "queue-empty";
      empty.textContent = "ここに追加したファイルが表示されます";
      queue.append(empty);
    }

    for (const [id, entry] of entries) {
      const item = document.createElement("li");
      item.className = `queue-item${id === currentId ? " is-current" : ""}`;
      item.dataset.id = id;

      const select = document.createElement("button");
      select.type = "button";
      select.className = "queue-select";
      select.title = entry.file.name;
      const type = document.createElement("span");
      type.className = "file-type-icon";
      type.textContent = entry.kind === "video" ? "▶" : "♫";
      const copy = document.createElement("span");
      copy.className = "queue-copy";
      const name = document.createElement("strong");
      name.textContent = entry.file.name;
      const meta = document.createElement("small");
      meta.textContent = `${entry.kind === "video" ? "VIDEO" : "AUDIO"} · ${formatSize(entry.file.size)}`;
      copy.append(name, meta);
      select.append(type, copy);
      select.addEventListener("click", () => selectEntry(id, true));

      const remove = document.createElement("button");
      remove.type = "button";
      remove.className = "remove-file";
      remove.textContent = "×";
      remove.setAttribute("aria-label", `${entry.file.name}を削除`);
      remove.addEventListener("click", () => removeEntry(id));

      item.append(select, remove);
      queue.append(item);
    }
    count.textContent = String(entries.size);
    previousButton.disabled = entries.size < 2;
    nextButton.disabled = entries.size < 2;
    $("#clear-queue-button", root).disabled = entries.size === 0;
  };

  const renderLibrary = () => {
    library.replaceChildren();
    if (!entries.size) {
      const empty = document.createElement("li");
      empty.className = "library-empty";
      empty.textContent = "まだファイルがありません";
      library.append(empty);
      return;
    }

    for (const [id, entry] of entries) {
      const item = document.createElement("li");
      item.className = `library-item${id === currentId ? " is-current" : ""}`;
      const icon = document.createElement("span");
      icon.className = "file-type-icon";
      icon.textContent = entry.kind === "video" ? "▶" : "♫";
      const copy = document.createElement("span");
      copy.className = "library-copy";
      const name = document.createElement("strong");
      name.textContent = entry.file.name;
      const meta = document.createElement("small");
      meta.textContent = `${entry.kind === "video" ? "動画" : "音声"} · ${formatSize(entry.file.size)}`;
      copy.append(name, meta);
      const actions = document.createElement("span");
      actions.className = "library-actions";
      const play = document.createElement("button");
      play.type = "button";
      play.className = "small-action";
      play.textContent = "再生";
      play.addEventListener("click", () => {
        selectEntry(id, true);
        $("#tab-player", root).click();
      });
      const remove = document.createElement("button");
      remove.type = "button";
      remove.className = "small-action remove-action";
      remove.textContent = "削除";
      remove.addEventListener("click", () => removeEntry(id));
      actions.append(play, remove);
      item.append(icon, copy, actions);
      library.append(item);
    }
  };

  const render = () => {
    renderQueue();
    renderLibrary();
  };

  const updatePlaybackState = () => {
    const playing = isPlaying();
    playButton.textContent = playing ? "Ⅱ" : "▶";
    playButton.setAttribute("aria-label", playing ? "一時停止" : "再生");
    indicator.classList.toggle("is-playing", playing);
    indicator.setAttribute("aria-label", playing ? "再生中" : "停止中");
  };

  const updateProgress = () => {
    const active = media();
    if (!active || !Number.isFinite(active.duration)) {
      currentTime.textContent = formatTime(active?.currentTime ?? 0);
      duration.textContent = "0:00";
      if (!seeking) seek.value = "0";
      return;
    }
    currentTime.textContent = formatTime(active.currentTime);
    duration.textContent = formatTime(active.duration);
    if (!seeking) seek.value = String(active.duration ? active.currentTime / active.duration * 1000 : 0);
  };

  const updateTrack = () => {
    const entry = currentEntry();
    const active = media();
    trackTitle.textContent = entry?.file.name ?? "再生待ち";
    trackMeta.textContent = entry
      ? `${entry.kind === "video" ? "動画" : "音声"} · ${formatSize(entry.file.size)}`
      : "ファイルが選択されていません";
    stageEmpty.hidden = !!entry;
    audioVisual.hidden = !entry || entry.kind === "video";
    video.hidden = !entry || entry.kind !== "video";
    seek.disabled = !entry;
    playButton.disabled = !entry;
    previousButton.disabled = entries.size < 2;
    nextButton.disabled = entries.size < 2;
    updateProgress();
    updatePlaybackState();
  };

  const play = async () => {
    const active = media();
    if (!active || !currentEntry()) return;
    try {
      await active.play();
    } catch (error) {
      if (error.name !== "AbortError") console.warn("[media-player] 再生できませんでした。", error);
    }
    updatePlaybackState();
  };

  const pauseAll = () => {
    audio.pause();
    video.pause();
    updatePlaybackState();
  };

  const selectEntry = (id, autoplay = false) => {
    const entry = entries.get(id);
    if (!entry) return;
    pauseAll();
    currentId = id;
    audio.removeAttribute("src");
    video.removeAttribute("src");
    audio.load();
    video.load();

    const active = entry.kind === "video" ? video : audio;
    active.src = entry.url;
    active.playbackRate = Number(speed.value);
    active.volume = Number(volume.value);
    active.load();
    render();
    updateTrack();
    if (autoplay) play();
  };

  const getNextId = (direction = 1) => {
    const ids = [...entries.keys()];
    if (!ids.length) return null;
    if (shuffle && ids.length > 1) {
      const choices = ids.filter(id => id !== currentId);
      return choices[Math.floor(Math.random() * choices.length)];
    }
    const index = ids.indexOf(currentId);
    return ids[(index + direction + ids.length) % ids.length];
  };

  const move = (direction) => {
    const id = getNextId(direction);
    if (id !== null) selectEntry(id, true);
  };

  const onEnded = () => {
    if (repeat) {
      const active = media();
      active.currentTime = 0;
      play();
    } else if (entries.size > 1) {
      move(1);
    } else {
      updatePlaybackState();
    }
  };

  const removeEntry = (id) => {
    const entry = entries.get(id);
    if (!entry) return;
    const ids = [...entries.keys()];
    const wasCurrent = id === currentId;
    const next = wasCurrent ? ids[(ids.indexOf(id) + 1) % ids.length] : null;
    if (wasCurrent) {
      pauseAll();
      audio.removeAttribute("src");
      video.removeAttribute("src");
      audio.load();
      video.load();
      currentId = null;
    }
    URL.revokeObjectURL(entry.url);
    entries.delete(id);
    if (wasCurrent && entries.size) selectEntry(next === id ? entries.keys().next().value : next, false);
    else if (!entries.size) {
      currentId = null;
      trackTitle.textContent = "再生待ち";
      trackMeta.textContent = "ファイルが選択されていません";
      stageEmpty.hidden = false;
      audioVisual.hidden = false;
      video.hidden = true;
      seek.disabled = true;
      playButton.disabled = true;
      updatePlaybackState();
      updateProgress();
    }
    render();
    updateTrack();
  };

  const addFiles = (fileList) => {
    let firstAdded = null;
    for (const file of fileList) {
      if (!(file.type.startsWith("audio/") || file.type.startsWith("video/"))) continue;
      const id = nextId++;
      const entry = {
        id,
        file,
        kind: file.type.startsWith("video/") ? "video" : "audio",
        url: URL.createObjectURL(file)
      };
      entries.set(id, entry);
      if (firstAdded === null) firstAdded = id;
    }
    render();
    if (currentId === null && firstAdded !== null) selectEntry(firstAdded, false);
  };

  const switchTab = (name) => {
    const playerTab = $("#tab-player", root);
    const libraryTab = $("#tab-library", root);
    const playerPanel = $("#panel-player", root);
    const libraryPanel = $("#panel-library", root);
    const playerActive = name === "player";
    playerTab.classList.toggle("is-active", playerActive);
    libraryTab.classList.toggle("is-active", !playerActive);
    playerTab.setAttribute("aria-selected", String(playerActive));
    libraryTab.setAttribute("aria-selected", String(!playerActive));
    playerPanel.hidden = !playerActive;
    libraryPanel.hidden = playerActive;
  };

  listen($("#tab-player", root), "click", () => switchTab("player"));
  listen($("#tab-library", root), "click", () => switchTab("library"));
  listen(playButton, "click", () => isPlaying() ? pauseAll() : play());
  listen(previousButton, "click", () => move(-1));
  listen(nextButton, "click", () => move(1));
  listen(shuffleButton, "click", () => {
    shuffle = !shuffle;
    shuffleButton.classList.toggle("is-on", shuffle);
    shuffleButton.setAttribute("aria-pressed", String(shuffle));
  });
  listen(repeatButton, "click", () => {
    repeat = !repeat;
    repeatButton.classList.toggle("is-on", repeat);
    repeatButton.setAttribute("aria-pressed", String(repeat));
  });
  listen(seek, "input", () => {
    seeking = true;
    const active = media();
    if (active?.duration) currentTime.textContent = formatTime(active.duration * Number(seek.value) / 1000);
  });
  listen(seek, "change", () => {
    const active = media();
    if (active?.duration) active.currentTime = active.duration * Number(seek.value) / 1000;
    seeking = false;
    updateProgress();
  });
  listen(volume, "input", () => {
    audio.volume = Number(volume.value);
    video.volume = Number(volume.value);
  });
  listen(speed, "change", () => {
    audio.playbackRate = Number(speed.value);
    video.playbackRate = Number(speed.value);
  });
  listen($("#clear-queue-button", root), "click", () => {
    for (const id of [...entries.keys()]) removeEntry(id);
  });

  for (const button of $$("[data-open-files]", root)) {
    listen(button, "click", () => input.click());
  }
  listen(input, "change", () => {
    if (input.files?.length) addFiles(input.files);
    input.value = "";
  });

  if (upload) {
    const prevent = event => {
      event.preventDefault();
      event.stopPropagation();
    };
    for (const type of ["dragenter", "dragover", "dragleave", "drop"]) listen(upload, type, prevent);
    for (const type of ["dragenter", "dragover"]) listen(upload, type, () => upload.classList.add("dragover"));
    for (const type of ["dragleave", "drop"]) listen(upload, type, () => upload.classList.remove("dragover"));
    listen(upload, "drop", event => {
      const dropped = event.dataTransfer?.files;
      if (dropped?.length) addFiles(dropped);
    });
  }

  for (const active of [audio, video]) {
    listen(active, "timeupdate", updateProgress);
    listen(active, "loadedmetadata", updateProgress);
    listen(active, "durationchange", updateProgress);
    listen(active, "play", updatePlaybackState);
    listen(active, "pause", updatePlaybackState);
    listen(active, "ended", onEnded);
    listen(active, "error", () => {
      trackMeta.textContent = "このファイルを再生できません。形式に対応しているか確認してください。";
      updatePlaybackState();
    });
  }

  updateTrack();
  render();

  cleanupActive = () => {
    if (destroyed) return;
    destroyed = true;
    listeners.forEach(remove => remove());
    audio.pause();
    video.pause();
    audio.removeAttribute("src");
    video.removeAttribute("src");
    audio.load();
    video.load();
    for (const entry of entries.values()) URL.revokeObjectURL(entry.url);
    entries.clear();
    cleanupActive = null;
  };
};

const unmount = () => {
  cleanupActive?.();
};

export { init, unmount };
