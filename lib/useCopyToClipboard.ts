import { useState } from "react";

export function useCopyToClipboard(timeout = 1500) {
  const [copied, setCopied] = useState(false);

  function extractNumber(text: string) {
    return text.replace(/[^\d,.-]/g, "");
  }

  async function copy(text: string) {
    const onlyNumbers = extractNumber(text);

    await navigator.clipboard.writeText(onlyNumbers);
    setCopied(true);

    setTimeout(() => setCopied(false), timeout);
  }

  return { copied, copy };
}
