const $ = (selector, root = document) => root.querySelector(selector);
let cleanup = null;
const DIGITS = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ";
const FRACTION_DIGITS = 16;
const BASE_NAMES = {2:"BIN",3:"TRI",8:"OCT",10:"DEC",16:"HEX",36:"BASE36"};
const parseValue = (input, base) => {
  let value = input.trim().replace(/\s+/g, "").replaceAll("_", "").toUpperCase();
  if (!value) throw new Error("数値を入力してください。");
  let sign = 1n;
  if (value[0] === "+" || value[0] === "-") { if (value[0] === "-") sign = -1n; value = value.slice(1); }
  const parts = value.split(".");
  if (!value || parts.length > 2 || parts.some(part => !part)) throw new Error("数値または小数点の位置を確認してください。");
  const parseDigits = part => {
    let result = 0n;
    for (const char of part) {
      const digit = DIGITS.indexOf(char);
      if (digit < 0 || digit >= base) throw new Error("「" + char + "」は" + base + "進数では使用できません。");
      result = result * BigInt(base) + BigInt(digit);
    }
    return result;
  };
  const integer = parseDigits(parts[0]);
  if (parts.length === 1) return {sign, integer, numerator:0n, denominator:1n};
  const numerator = parseDigits(parts[1]);
  return {sign, integer, numerator, denominator:BigInt(base) ** BigInt(parts[1].length)};
};
const integerToBase = (value, base) => {
  if (value === 0n) return "0";
  let result = "";
  const radix = BigInt(base);
  while (value > 0n) { result = DIGITS[Number(value % radix)] + result; value /= radix; }
  return result;
};
const convertValue = (parsed, targetBase) => {
  const {sign, integer, numerator, denominator} = parsed;
  const whole = integerToBase(integer, targetBase);
  if (numerator === 0n) return (sign < 0n && integer !== 0n ? "-" : "") + whole;
  let remainder = numerator, fraction = "";
  const radix = BigInt(targetBase);
  for (let i = 0; i < FRACTION_DIGITS && remainder !== 0n; i++) {
    remainder *= radix;
    fraction += DIGITS[Number(remainder / denominator)];
    remainder %= denominator;
  }
  return (sign < 0n ? "-" : "") + whole + (fraction ? "." + fraction : "") + (remainder !== 0n ? "…" : "");
};
const init = () => {
  cleanup?.();
  const root = $("#tool.base-converter");
  if (!root) return;
  const sourceBase = $("#source-base", root), customBase = $("#source-custom-base", root);
  const sourceValue = $("#source-value", root), results = $("#results-list", root);
  const message = $("#conversion-message", root), addSelect = $("#add-base-select", root);
  const addButton = $("#add-base-button", root), count = $("#result-count", root);
  const controller = new AbortController(), {signal} = controller;
  const bases = [2, 3, 8, 10, 16, 36];
  const makeIcon = name => '<i data-lucide="' + name + '"></i>';
  const refreshIcons = () => window.spaRouter?.commonStorage?.get("createIcons")?.({icons:window.spaRouter?.commonStorage?.get("lucideIcons")});
  const renderRows = () => {
    results.innerHTML = bases.map(base => '<div class="result-row" data-base="' + base + '"><span class="result-base">' + base + '進数</span><output class="result-value" aria-label="' + base + '進数の変換結果">—</output><button class="copy-button" type="button" data-action="copy" aria-label="' + base + '進数をコピー" title="コピー" disabled>' + makeIcon("copy") + '</button><button class="remove-button" type="button" data-action="remove" aria-label="' + base + '進数を削除" title="削除">' + makeIcon("x") + '</button></div>').join("");
    if (count) count.textContent = bases.length + "種類";
    [...addSelect.options].forEach(option => { option.disabled = bases.includes(Number(option.value)); });
    addButton.disabled = addSelect.selectedOptions[0]?.disabled ?? true;
    refreshIcons();
  };
  const getSourceBase = () => {
    const base = sourceBase.value === "custom" ? Number(customBase.value) : Number(sourceBase.value);
    if (!Number.isInteger(base) || base < 2 || base > 36) throw new Error("基数は2～36の整数で指定してください。");
    return base;
  };
  const convert = () => {
    customBase.hidden = sourceBase.value !== "custom";
    try {
      const parsed = parseValue(sourceValue.value, getSourceBase());
      results.querySelectorAll(".result-row").forEach(row => {
        const output = $("output", row), copy = $('[data-action="copy"]', row);
        output.textContent = convertValue(parsed, Number(row.dataset.base));
        output.classList.remove("is-error");
        copy.disabled = false;
      });
      sourceValue.classList.remove("is-error");
      message.textContent = "";
      message.classList.remove("is-error");
    } catch (error) {
      results.querySelectorAll(".result-row").forEach(row => {
        $("output", row).textContent = "—";
        $('[data-action="copy"]', row).disabled = true;
      });
      sourceValue.classList.add("is-error");
      message.textContent = error.message;
      message.classList.add("is-error");
    }
  };
  sourceBase.addEventListener("change", convert, {signal});
  customBase.addEventListener("input", convert, {signal});
  sourceValue.addEventListener("input", convert, {signal});
  addButton.addEventListener("click", () => {
    const base = Number(addSelect.value);
    if (!Number.isInteger(base) || base < 2 || base > 36 || bases.includes(base)) return;
    bases.push(base); bases.sort((a,b) => a-b); renderRows(); convert();
  }, {signal});
  results.addEventListener("click", async event => {
    const button = event.target.closest("button[data-action]");
    if (!button) return;
    const row = button.closest(".result-row"), base = Number(row.dataset.base);
    if (button.dataset.action === "remove") {
      if (bases.length <= 1) return;
      bases.splice(bases.indexOf(base), 1); renderRows(); convert(); return;
    }
    const value = $("output", row).textContent;
    if (!value || value === "—") return;
    try {
      await navigator.clipboard.writeText(value);
      button.innerHTML = makeIcon("check"); refreshIcons();
      button.classList.add("is-copied");
      window.setTimeout(() => {
        if (!button.isConnected) return;
        button.innerHTML = makeIcon("copy"); button.classList.remove("is-copied"); refreshIcons();
      }, 1200);
    } catch {
      message.textContent = "コピーできませんでした。結果を選択してコピーしてください。";
      message.classList.add("is-error");
    }
  }, {signal});
  renderRows(); convert();
  cleanup = () => controller.abort();
};
export {init};