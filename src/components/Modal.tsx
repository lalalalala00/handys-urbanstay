"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export function Modal({
  children,
  wide = false,
}: {
  children: React.ReactNode;
  wide?: boolean;
}) {
  const router = useRouter();

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") router.back();
    }

    document.addEventListener("keydown", onKeyDown);

    return () => {
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [router]);

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-end justify-center overscroll-none bg-black/50 sm:items-center sm:p-4"
      onClick={() => router.back()}
    >
      <div
        className={`max-h-[90vh] w-full overflow-y-auto overscroll-contain rounded-t-2xl border border-black/10 bg-background p-6 shadow-xl sm:rounded-2xl dark:border-white/10 ${
          wide ? "max-w-4xl" : "max-w-lg"
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={() => router.back()}
          aria-label="닫기"
          className="mb-3 ml-auto flex h-7 w-7 items-center justify-center rounded-full text-gray-500 hover:bg-black/5 dark:hover:bg-white/10"
        >
          ✕
        </button>
        {children}
      </div>
    </div>
  );
}
