"use client";

import { ReactNode } from "react";
import { Check } from "lucide-react";
import { useCopyToClipboard } from "../../lib/useCopyToClipboard";

interface CopyableCardProps {
  valueToCopy: string;
  children: ReactNode;
}

export function CopyableCard({ valueToCopy, children }: CopyableCardProps) {
  const { copied, copy } = useCopyToClipboard();

  return (
    <div
      onClick={() => copy(valueToCopy)}
      className="relative cursor-pointer transition-transform hover:scale-[1.015] active:scale-[0.98]"
    >
      {children}

      {/* Badge de feedback */}
      {copied && (
        <div
          className="
          absolute top-3 right-3
          flex items-center gap-1
          bg-white/90 backdrop-blur
          text-gray-800 text-xs font-medium
          px-3 py-1.5
          rounded-full shadow-md
          animate-copy-badge
          pointer-events-none
        "
        >
          <Check className="w-3.5 h-3.5 text-green-600" />
          Copiado
        </div>
      )}
    </div>
  );
}
