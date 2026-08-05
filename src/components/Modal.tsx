"use client";

import { createContext, useCallback, useContext, useEffect } from "react";
import { useRouter } from "next/navigation";

const ModalCloseContext = createContext<(() => void) | null>(null);

export function useModalClose() {
  return useContext(ModalCloseContext);
}

export function Modal({
  children,
  wide = false,
}: {
  children: React.ReactNode;
  wide?: boolean;
}) {
  const router = useRouter();
  const close = useCallback(() => router.back(), [router]);

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") close();
    }

    document.addEventListener("keydown", onKeyDown);

    return () => {
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [close]);

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-end justify-center overscroll-none bg-black/50 sm:items-center sm:p-4"
      onClick={close}
    >
      <div
        className={`max-h-[90vh] w-full overflow-y-auto overscroll-contain rounded-t-2xl border border-black/10 bg-background p-6 shadow-xl sm:rounded-2xl dark:border-white/10 ${
          wide ? "max-w-4xl" : "max-w-lg"
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        <ModalCloseContext.Provider value={close}>
          {children}
        </ModalCloseContext.Provider>
      </div>
    </div>
  );
}
