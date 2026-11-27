const $ = (selector, root = document) => root.querySelector(selector);
let cleanup = null;

const countCharacters = (value) => {
  if (typeof Intl.Segmenter === "function") {
    const segmenter = new Intl.Segmenter("ja", {granularity:"grapheme"});
    return [...segmenter.segment(value)].length;
  }
  return [...value].length;
};

const countWords = (value) => {
  const text = value.trim();
  if (!text) return 0;
  if (typeof Intl.Segmenter === "function") {
    const segmenter = new Intl.Segmenter("ja", {granularity:"word"});
    return [...segmenter.segment(text)].filter(item => item.isWordLike).length;
  }
  return text.split(/\s+/u).filter(Boolean).length;
};

const init = () => {
  cleanup?.();
  const root = $("#tool.character-counter");
  if (!root) return;

  const input = $("#counter-input", root);
  const status = $("#input-status", root);
  const byteCount = $("#byte-count", root);
  const fields = {
    characters: $("#characters", root),
    noSpace: $("#characters-no-space", root),
    words: $("#words", root),
    lines: $("#lines", root),
    paragraphs: $("#paragraphs", root),
    bytes: $("#bytes", root)
  };
  const controller = new AbortController();
  const {signal} = controller;
  const formatter = new Intl.NumberFormat("ja-JP");
  const update = () => {
    const value = input.value;
    const withoutWhitespace = value.replace(/[\s\uFEFF\u200B]+/gu, "");
    const nonEmptyLines = value.split(/\r\n|\r|\n/u).filter(line => line.trim().length > 0);
    const paragraphs = value.trim()
      ? value.trim().split(/(?:\r\n|\r|\n)[\t \u3000]*(?:\r\n|\r|\n)+/u).filter(Boolean).length
      : 0;
    const bytes = new TextEncoder().encode(value).length;

    fields.characters.textContent = formatter.format(countCharacters(value));
    fields.noSpace.textContent = formatter.format(countCharacters(withoutWhitespace));
    fields.words.textContent = formatter.format(countWords(value));
    fields.lines.textContent = formatter.format(value ? value.split(/\r\n|\r|\n/u).length : 0);
    fields.paragraphs.textContent = formatter.format(paragraphs);
    fields.bytes.textContent = formatter.format(bytes);
    byteCount.textContent = formatter.format(bytes) + " bytes";
    status.textContent = value ? "入力中" : "入力待ち";
  };

  input.addEventListener("input", update, {signal});
  $("#clear-text", root).addEventListener("click", () => {
    input.value = "";
    update();
    input.focus();
  }, {signal});
  $("#copy-text", root).addEventListener("click", async () => {
    if (!input.value) {
      status.textContent = "コピーする文章がありません";
      return;
    }
    try {
      await navigator.clipboard.writeText(input.value);
      status.textContent = "コピーしました";
    } catch {
      input.focus();
      input.select();
      status.textContent = "文章を選択しました。コピーしてください";
    }
  }, {signal});

  update();
  cleanup = () => controller.abort();
};

const unmount = () => {
  cleanup?.();
  cleanup = null;
};

export {init, unmount};