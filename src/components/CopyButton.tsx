"use client";

import { Copy, Check } from "lucide-react";
import { useCopyToClipboard } from "../../lib/useCopyToClipboard";

interface CopyButtonProps {
  value: string;
}

export function CopyButton({ value }: CopyButtonProps) {
  const { copied, copy } = useCopyToClipboard();

  return (
    <button
      onClick={() => copy(value)}
      className="ml-auto text-gray-400 hover:text-gray-600 transition"
      title="Copiar valor"
    >
      {copied ? (
        <Check className="w-4 h-4 text-green-500" />
      ) : (
        <Copy className="w-4 h-4" />
      )}
    </button>
  );
}
