"use client";

import { createContext, useCallback, useContext, useState } from "react";

type ToastVariant = "success" | "danger";

interface ToastItem {
  id: number;
  message: string;
  variant: ToastVariant;
}

const VARIANT_CLASSES: Record<ToastVariant, string> = {
  success: "bg-success-bg text-success-text border-success-border",
  danger: "bg-danger-bg text-danger-text border-danger-border",
};

const TOAST_DURATION_MS = 3000;

let nextId = 0;

const ToastContext = createContext<
  ((message: string, variant?: ToastVariant) => void) | null
>(null);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const showToast = useCallback((message: string, variant: ToastVariant = "success") => {
    const id = nextId++;
    setToasts((prev) => [...prev, { id, message, variant }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, TOAST_DURATION_MS);
  }, []);

  return (
    <ToastContext.Provider value={showToast}>
      {children}
      <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`rounded-lg border px-4 py-2.5 text-sm shadow-md ${VARIANT_CLASSES[t.variant]}`}
          >
            {t.message}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const showToast = useContext(ToastContext);
  if (!showToast) throw new Error("useToast must be used within ToastProvider");
  return showToast;
}
