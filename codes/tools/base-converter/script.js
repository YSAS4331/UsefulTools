const $ = (selector, root = document) => root.querySelector(selector);

let cleanup = null;

const DIGITS = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ";
const FRACTION_DIGITS = 16;

const parseBase = (select, custom) => {
  const base = select.value === "custom" ? Number(custom.value) : Number(select.value);
  if (!Number.isInteger(base) || base < 2 || base > 36) {
    throw new Error("基数は2～36の整数で指定してください。");
  }
  return base;
};

const parseValue = (input, base) => {
  let value = input.trim().replace(/\s+/g, "").replaceAll("_", "");
  if (!value) throw new Error("数値を入力してください。");

  let sign = 1n;
  if (value[0] === "+" || value[0] === "-") {
    if (value[0] === "-") sign = -1n;
    value = value.slice(1);
  }
  if (!value) throw new Error("数値を入力してください。");

  const parts = value.split(".");
  if (parts.length > 2 || parts.some(part => part.length === 0)) {
    throw new Error("小数点の位置を確認してください。");
  }

  const parseDigits = part => {
    let result = 0n;
    for (const char of part.toUpperCase()) {
      const digit = DIGITS.indexOf(char);
      if (digit < 0 || digit >= base) {
        throw new Error(`「${char}」は${base}進数では使用できません。`);
      }
      result = result * BigInt(base) + BigInt(digit);
    }
    return result;
  };

  const integer = parseDigits(parts[0]);
  if (parts.length === 1) return { sign, integer, numerator: 0n, denominator: 1n };

  let denominator = 1n;
  for (let i = 0; i < parts[1].length; i++) denominator *= BigInt(base);
  return {
    sign,
    integer,
    numerator: parseDigits(parts[1]),
    denominator
  };
};

const integerToBase = (value, base) => {
  if (value === 0n) return "0";
  const radix = BigInt(base);
  let result = "";
  while (value > 0n) {
    result = DIGITS[Number(value % radix)] + result;
    value /= radix;
  }
  return result;
};

const convertValue = (parsed, targetBase) => {
  const { sign, integer, numerator, denominator } = parsed;
  const whole = integerToBase(integer, targetBase);
  if (numerator === 0n) return (sign < 0n && integer !== 0n ? "-" : "") + whole;

  let remainder = numerator;
  let fraction = "";
  const radix = BigInt(targetBase);

  for (let i = 0; i < FRACTION_DIGITS && remainder !== 0n; i++) {
    remainder *= radix;
    const digit = remainder / denominator;
    remainder %= denominator;
    fraction += DIGITS[Number(digit)];
  }

  fraction = fraction.replace(/0+$/, "");
  const prefix = sign < 0n ? "-" : "";
  return prefix + whole + (fraction ? "." + fraction : "") + (remainder !== 0n ? "…" : "");
};

const init = () => {
  cleanup?.();
  const root = $("#tool.base-converter");
  if (!root) return;

  const sourceBase = $("#source-base", root);
  const targetBase = $("#target-base", root);
  const sourceCustom = $("#source-custom-base", root);
  const targetCustom = $("#target-custom-base", root);
  const sourceValue = $("#source-value", root);
  const resultValue = $("#result-value", root);
  const message = $("#conversion-message", root);
  const copyButton = $("#copy-result", root);
  const swapButton = $("#swap-bases", root);
  const controller = new AbortController();
  const { signal } = controller;
  let currentResult = "";

  const updateCustomInput = (select, input) => {
    input.hidden = select.value !== "custom";
  };

  const convert = () => {
    updateCustomInput(sourceBase, sourceCustom);
    updateCustomInput(targetBase, targetCustom);

    try {
      const from = parseBase(sourceBase, sourceCustom);
      const to = parseBase(targetBase, targetCustom);
      const parsed = parseValue(sourceValue.value, from);
      currentResult = convertValue(parsed, to);
      resultValue.textContent = currentResult;
      resultValue.classList.remove("is-error");
      message.textContent = "変換しました";
      message.classList.remove("is-error");
      copyButton.disabled = false;
    } catch (error) {
      currentResult = "";
      resultValue.textContent = "—";
      resultValue.classList.add("is-error");
      message.textContent = error.message;
      message.classList.add("is-error");
      copyButton.disabled = true;
    }
  };

  [sourceBase, targetBase, sourceCustom, targetCustom, sourceValue].forEach(element => {
    element.addEventListener("input", convert, { signal });
    element.addEventListener("change", convert, { signal });
  });

  swapButton.addEventListener("click", () => {
    const previousSource = sourceBase.value;
    sourceBase.value = targetBase.value;
    targetBase.value = previousSource;

    const previousCustom = sourceCustom.value;
    sourceCustom.value = targetCustom.value;
    targetCustom.value = previousCustom;

    sourceValue.value = currentResult.replace(/…$/, "");
    convert();
    sourceValue.focus();
  }, { signal });

  copyButton.addEventListener("click", async () => {
    if (!currentResult) return;
    try {
      await navigator.clipboard.writeText(currentResult);
      copyButton.innerHTML = '<i data-lucide="check"></i>コピーしました';
      window.spaRouter?.commonStorage?.get("createIcons")?.({
        icons: window.spaRouter?.commonStorage?.get("lucideIcons")
      });
      setTimeout(() => {
        if (!copyButton.isConnected) return;
        copyButton.innerHTML = '<i data-lucide="copy"></i>コピー';
        window.spaRouter?.commonStorage?.get("createIcons")?.({
          icons: window.spaRouter?.commonStorage?.get("lucideIcons")
        });
      }, 1400);
    } catch {
      message.textContent = "コピーできませんでした。結果を選択してコピーしてください。";
      message.classList.add("is-error");
    }
  }, { signal });

  convert();
  cleanup = () => controller.abort();
};

export { init };
