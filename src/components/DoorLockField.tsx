"use client";

import { useState } from "react";

export function DoorLockField({ code }: { code: string }) {
  const [revealed, setRevealed] = useState(false);
  const [copied, setCopied] = useState(false);

  async function copy() {
    await navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  return (
    <div>
      <div className="text-xs text-gray-500 dark:text-gray-400">도어락 비밀번호</div>
      <div className="mt-1 font-mono text-2xl font-semibold tracking-wide">
        {revealed ? code : "•".repeat(code.length)}
      </div>
      <div className="mt-3 flex gap-2">
        <button
          type="button"
          onClick={copy}
          className="rounded-lg border border-black/10 px-3 py-1.5 text-xs font-medium transition-colors hover:bg-black/5 dark:border-white/10 dark:hover:bg-white/10"
        >
          {copied ? "복사됨" : "복사"}
        </button>
        <button
          type="button"
          onClick={() => setRevealed((v) => !v)}
          className="rounded-lg border border-black/10 px-3 py-1.5 text-xs font-medium transition-colors hover:bg-black/5 dark:border-white/10 dark:hover:bg-white/10"
        >
          {revealed ? "가리기" : "보기"}
        </button>
      </div>
    </div>
  );
}
