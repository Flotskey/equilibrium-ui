export function formatWithSubscriptZeros(num: number | string): string {
  const n = Number(num);
  if (isNaN(n)) return String(num);

  if (n === 0) return "0";

  const sign = n < 0 ? "-" : "";
  const abs = Math.abs(n);

  // Handle very small numbers (including those in scientific notation)
  if (abs > 0 && abs < 0.001) {
    // Always use exponential form for small numbers
    const expStr = abs.toExponential();
    const match = /^(\d(?:\.\d+)?)[eE]-(\d+)$/.exec(expStr);
    if (match) {
      const mantissa = match[1].replace(".", "");
      const exponent = Number(match[2]);
      const subZeros = exponent - 1;
      const subNum = String(subZeros)
        .split("")
        .map((d) => String.fromCharCode(0x2080 + Number(d)))
        .join("");
      return `${sign}0.0${subNum}${mantissa}`;
    }
  }

  if (abs < 1) {
    return `${sign}${abs
      .toFixed(8)
      .replace(/(\.\d*?[1-9])0+$/, "$1")
      .replace(/\.0+$/, "")}`;
  }
  if (abs < 1000) {
    return `${sign}${abs
      .toFixed(6)
      .replace(/(\.\d*?[1-9])0+$/, "$1")
      .replace(/\.0+$/, "")}`;
  }
  return `${sign}${abs.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

// Converts a step size (like 1e-9 or 0.01) to the number of decimals (precision)
export function stepToPrecision(step: number): number {
  if (!isFinite(step) || step <= 0) return 2;
  // Handle scientific notation
  const s = step.toExponential().split("e-");
  if (s.length === 2) return parseInt(s[1], 10);
  // Handle decimal notation
  const str = step.toString();
  if (str.indexOf(".") >= 0) return str.split(".")[1].length;
  return 0;
}
