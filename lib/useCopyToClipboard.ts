import { useState } from "react";

export function useCopyToClipboard(timeout = 1500) {
  const [copied, setCopied] = useState(false);

  async function copy(text: string) {
    await navigator.clipboard.writeText(text);
    setCopied(true);

    setTimeout(() => setCopied(false), timeout);
  }

  return { copied, copy };
}
