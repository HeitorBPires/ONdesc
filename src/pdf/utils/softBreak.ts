export function formatPixForDisplay(pix: string, every = 42) {
  if (!pix) return "";
  return pix.match(new RegExp(`.{1,${every}}`, "g"))?.join("\n") ?? pix;
}

export function formatBarcodeLineForDisplay(line: string) {
  if (!line) return "";
  const digits = line.replace(/\D/g, "");

  if (digits.length === 47) {
    return [
      `${digits.slice(0, 5)}.${digits.slice(5, 10)}`,
      `${digits.slice(10, 15)}.${digits.slice(15, 21)}`,
      `${digits.slice(21, 26)}.${digits.slice(26, 32)}`,
      `${digits.slice(32, 33)}`,
      `${digits.slice(33)}`,
    ].join(" ");
  }

  if (digits.length === 48) {
    return [
      digits.slice(0, 12),
      digits.slice(12, 24),
      digits.slice(24, 36),
      digits.slice(36, 48),
    ].join(" ");
  }

  return line;
}
