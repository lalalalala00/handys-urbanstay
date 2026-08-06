"use client";

import { useState } from "react";
import { ShareIcon, CheckCircleIcon } from "@/components/common/icons";
import { useToast } from "@/components/common/Toast";

export function ShareButton({
  title,
  className = "",
}: {
  title?: string;
  className?: string;
}) {
  const [copied, setCopied] = useState(false);
  const showToast = useToast();

  async function share(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    const url = window.location.href;

    if (navigator.share) {
      try {
        await navigator.share({ title, url });
      } catch {
        // user cancelled the share sheet
      }
      return;
    }

    await navigator.clipboard.writeText(url);
    setCopied(true);
    showToast("링크를 복사했습니다.");
    setTimeout(() => setCopied(false), 1500);
  }

  return (
    <button
      type="button"
      onClick={share}
      aria-label="공유"
      className={[
        "flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-gray-500 transition-colors hover:bg-black/5 hover:text-foreground dark:hover:bg-white/10",
        className,
      ].join(" ")}
    >
      {copied ? (
        <CheckCircleIcon className="h-3.5 w-3.5 text-primary" />
      ) : (
        <ShareIcon className="h-3.5 w-3.5" />
      )}
    </button>
  );
}
