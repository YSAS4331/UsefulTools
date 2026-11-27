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
  return { sign, integer, numerator: parseDigits(parts[1]), denominator };
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
  return (sign < 0n ? "-" : "") + whole +
    (fraction ? "." + fraction : "") + (remainder !== 0n ? "…" : "");
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
  const targetValue = $("#target-value", root);
  const message = $("#conversion-message", root);
  const copyButton = $("#copy-result", root);
  const swapButton = $("#swap-bases", root);
  const controller = new AbortController();
  const { signal } = controller;
  let activeSide = "source";
  let generatedValue = "";

  const sides = {
    source: { base: sourceBase, custom: sourceCustom, value: sourceValue },
    target: { base: targetBase, custom: targetCustom, value: targetValue }
  };

  const updateCustomInput = (select, input) => {
    input.hidden = select.value !== "custom";
  };

  const convert = () => {
    const from = sides[activeSide];
    const to = sides[activeSide === "source" ? "target" : "source"];
    updateCustomInput(sourceBase, sourceCustom);
    updateCustomInput(targetBase, targetCustom);

    try {
      const parsed = parseValue(from.value.value, parseBase(from.base, from.custom));
      generatedValue = convertValue(parsed, parseBase(to.base, to.custom));
      to.value.value = generatedValue;
      to.value.classList.remove("is-error");
      message.textContent = "";
      message.classList.remove("is-error");
      copyButton.disabled = false;
    } catch (error) {
      generatedValue = "";
      to.value.value = "";
      to.value.classList.add("is-error");
      message.textContent = error.message;
      message.classList.add("is-error");
      copyButton.disabled = true;
    }
  };

  sourceValue.addEventListener("input", () => {
    activeSide = "source";
    convert();
  }, { signal });
  targetValue.addEventListener("input", () => {
    activeSide = "target";
    convert();
  }, { signal });

  [sourceBase, sourceCustom].forEach(element => {
    element.addEventListener("input", () => {
      activeSide = "source";
      convert();
    }, { signal });
    element.addEventListener("change", () => {
      activeSide = "source";
      convert();
    }, { signal });
  });
  [targetBase, targetCustom].forEach(element => {
    element.addEventListener("input", () => {
      activeSide = "target";
      convert();
    }, { signal });
    element.addEventListener("change", () => {
      activeSide = "target";
      convert();
    }, { signal });
  });

  swapButton.addEventListener("click", () => {
    [sourceBase.value, targetBase.value] = [targetBase.value, sourceBase.value];
    [sourceCustom.value, targetCustom.value] = [targetCustom.value, sourceCustom.value];
    [sourceValue.value, targetValue.value] = [targetValue.value, sourceValue.value];
    activeSide = activeSide === "source" ? "target" : "source";
    convert();
  }, { signal });

  copyButton.addEventListener("click", async () => {
    if (!generatedValue) return;
    try {
      await navigator.clipboard.writeText(generatedValue);
      copyButton.innerHTML = '<i data-lucide="check"></i>';
      window.spaRouter?.commonStorage?.get("createIcons")?.({
        icons: window.spaRouter?.commonStorage?.get("lucideIcons")
      });
      setTimeout(() => {
        if (!copyButton.isConnected) return;
        copyButton.innerHTML = '<i data-lucide="copy"></i>';
        window.spaRouter?.commonStorage?.get("createIcons")?.({
          icons: window.spaRouter?.commonStorage?.get("lucideIcons")
        });
      }, 1400);
    } catch {
      message.textContent = "コピーできませんでした。入力欄からコピーしてください。";
      message.classList.add("is-error");
    }
  }, { signal });

  convert();
  cleanup = () => controller.abort();
};

export { init };
