"use client";

import { useState } from "react";
import { CheckCircleIcon, CopyIcon } from "@/components/icons";

export function CopyButton({
  value,
  className = "",
}: {
  value: string;
  className?: string;
}) {
  const [copied, setCopied] = useState(false);

  async function copy(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    await navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  return (
    <button
      type="button"
      onClick={copy}
      aria-label={copied ? "복사됨" : "복사"}
      className={[
        "inline-flex h-5 w-5 shrink-0 items-center justify-center rounded text-subtext transition-colors hover:bg-black/5 hover:text-foreground dark:hover:bg-white/10",
        className,
      ].join(" ")}
    >
      {copied ? (
        <CheckCircleIcon className="h-3.5 w-3.5 text-primary" />
      ) : (
        <CopyIcon className="h-3.5 w-3.5" />
      )}
    </button>
  );
}
