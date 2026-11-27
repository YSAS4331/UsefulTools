const $ = (selector, root = document) => root.querySelector(selector);
let cleanup = null;
const DIGITS = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ";
const FRACTION_DIGITS = 16;

const parseValue = (input, base) => {
  let value = input.trim().replace(/\s+/g, "").replaceAll("_", "").toUpperCase();
  if (!value) throw new Error("数値を入力してください。");
  let sign = 1n;
  if (value[0] === "+" || value[0] === "-") {
    if (value[0] === "-") sign = -1n;
    value = value.slice(1);
  }
  const parts = value.split(".");
  if (!value || parts.length > 2 || parts.some(part => !part)) {
    throw new Error("数値または小数点の位置を確認してください。");
  }
  const parseDigits = part => {
    let result = 0n;
    for (const char of part) {
      const digit = DIGITS.indexOf(char);
      if (digit < 0 || digit >= base) {
        throw new Error("「" + char + "」は" + base + "進数では使用できません。");
      }
      result = result * BigInt(base) + BigInt(digit);
    }
    return result;
  };
  const integer = parseDigits(parts[0]);
  const numerator = parts.length === 2 ? parseDigits(parts[1]) : 0n;
  const denominator = parts.length === 2 ? BigInt(base) ** BigInt(parts[1].length) : 1n;
  return {sign, integer, numerator, denominator};
};

const integerToBase = (value, base) => {
  if (value === 0n) return "0";
  let result = "";
  const radix = BigInt(base);
  while (value > 0n) {
    result = DIGITS[Number(value % radix)] + result;
    value /= radix;
  }
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
  const results = $("#results-list", root);
  const message = $("#conversion-message", root);
  const addSelect = $("#add-base-select", root);
  const addButton = $("#add-base-button", root);
  const controller = new AbortController();
  const {signal} = controller;
  const bases = [2, 3, 8, 10, 16, 36];
  const makeIcon = name => '<i data-lucide="' + name + '"></i>';
  const refreshIcons = () => window.spaRouter?.commonStorage?.get("createIcons")?.({
    icons: window.spaRouter?.commonStorage?.get("lucideIcons")
  });

  const renderRows = () => {
    results.innerHTML = bases.map(base =>
      '<div class="result-row" data-base="' + base + '">' +
        '<label class="result-base" for="base-value-' + base + '">' + base + '進数</label>' +
        '<input class="result-value" id="base-value-' + base + '" type="text" inputmode="text" autocomplete="off" autocapitalize="characters" spellcheck="false" placeholder="数値を入力" aria-label="' + base + '進数の数値">' +
        '<button class="copy-button" type="button" data-action="copy" aria-label="' + base + '進数をコピー" title="コピー" disabled>' + makeIcon("copy") + '</button>' +
        '<button class="remove-button" type="button" data-action="remove" aria-label="' + base + '進数を削除" title="削除">' + makeIcon("x") + '</button>' +
      '</div>'
    ).join("");
    [...addSelect.options].forEach(option => {
      option.disabled = bases.includes(Number(option.value));
    });
    addButton.disabled = addSelect.selectedOptions[0]?.disabled ?? true;
    refreshIcons();
  };

  const updateFrom = (input) => {
    const row = input.closest(".result-row");
    if (!row) return;
    const sourceBase = Number(row.dataset.base);
    try {
      const parsed = parseValue(input.value, sourceBase);
      results.querySelectorAll(".result-row").forEach(targetRow => {
        if (targetRow === row) return;
        const targetInput = $(".result-value", targetRow);
        targetInput.value = convertValue(parsed, Number(targetRow.dataset.base));
        targetInput.classList.remove("is-error");
        $('[data-action="copy"]', targetRow).disabled = false;
      });
      input.classList.remove("is-error");
      $('[data-action="copy"]', row).disabled = !input.value.trim();
      message.textContent = "";
      message.classList.remove("is-error");
    } catch (error) {
      results.querySelectorAll(".result-row").forEach(targetRow => {
        if (targetRow === row) return;
        $(".result-value", targetRow).value = "";
        $('[data-action="copy"]', targetRow).disabled = true;
      });
      input.classList.add("is-error");
      $('[data-action="copy"]', row).disabled = !input.value.trim();
      message.textContent = error.message;
      message.classList.add("is-error");
    }
  };

  const isAllowedValue = (value, base) => {
    let decimalPoint = false;
    for (let index = 0; index < value.length; index++) {
      const char = value[index];
      if (char === "+" || char === "-") {
        if (index !== 0) return false;
        continue;
      }
      if (char === ".") {
        if (decimalPoint) return false;
        decimalPoint = true;
        continue;
      }
      if (char === "_" || /\\s/.test(char)) continue;
      const digit = DIGITS.indexOf(char.toUpperCase());
      if (digit < 0 || digit >= base) return false;
    }
    return true;
  };

  results.addEventListener("beforeinput", event => {
    const input = event.target;
    if (!input.matches(".result-value") || event.isComposing || !event.inputType.startsWith("insert")) return;
    const inserted = event.data ?? event.dataTransfer?.getData("text/plain");
    if (inserted == null) return;
    const start = input.selectionStart ?? input.value.length;
    const end = input.selectionEnd ?? start;
    const nextValue = input.value.slice(0, start) + inserted + input.value.slice(end);
    if (!isAllowedValue(nextValue, Number(input.closest(".result-row").dataset.base))) {
      event.preventDefault();
    }
  }, {signal});

  results.addEventListener("input", event => {
    const input = event.target;
    if (!input.matches(".result-value")) return;
    const normalized = input.value.toUpperCase();
    if (normalized !== input.value) {
      const position = input.selectionStart;
      input.value = normalized;
      input.setSelectionRange(position, position);
    }
    updateFrom(input);
  }, {signal});

  addButton.addEventListener("click", () => {
    const base = Number(addSelect.value);
    if (!Number.isInteger(base) || base < 2 || base > 36 || bases.includes(base)) return;
    bases.push(base);
    bases.sort((a, b) => a - b);
    const previous = results.querySelector(".result-value:not(:placeholder-shown)");
    const previousValue = previous?.value || "";
    const previousBase = previous ? Number(previous.closest(".result-row").dataset.base) : null;
    renderRows();
    if (previousValue && previousBase) {
      const newInput = $('.result-row[data-base="' + previousBase + '"] .result-value', results);
      newInput.value = previousValue;
      updateFrom(newInput);
    }
  }, {signal});

  results.addEventListener("click", async event => {
    const button = event.target.closest("button[data-action]");
    if (!button) return;
    const row = button.closest(".result-row");
    const base = Number(row.dataset.base);
    if (button.dataset.action === "remove") {
      if (bases.length <= 1) return;
      bases.splice(bases.indexOf(base), 1);
      renderRows();
      const firstFilled = [...results.querySelectorAll(".result-row")].find(item => $(".result-value", item).value);
      if (firstFilled) updateFrom($(".result-value", firstFilled));
      return;
    }
    const value = $(".result-value", row).value;
    if (!value) return;
    try {
      await navigator.clipboard.writeText(value);
      button.innerHTML = makeIcon("check");
      button.classList.add("is-copied");
      refreshIcons();
      window.setTimeout(() => {
        if (!button.isConnected) return;
        button.innerHTML = makeIcon("copy");
        button.classList.remove("is-copied");
        refreshIcons();
      }, 1200);
    } catch {
      message.textContent = "コピーできませんでした。入力欄からコピーしてください。";
      message.classList.add("is-error");
    }
  }, {signal});

  renderRows();
  const decimalInput = $('.result-row[data-base="10"] .result-value', results);
  decimalInput.value = "255";
  updateFrom(decimalInput);
  cleanup = () => controller.abort();
};

export {init};