"use client";

import { createContext, useCallback, useContext, useSyncExternalStore } from "react";

type LayoutWidth = "full" | "center" | "centerAll";

const STORAGE_KEY = "handys-layout-width";
const VALUES: LayoutWidth[] = ["full", "center", "centerAll"];

function subscribe(callback: () => void) {
  window.addEventListener("storage", callback);
  return () => window.removeEventListener("storage", callback);
}

function getSnapshot(): LayoutWidth {
  const stored = window.localStorage.getItem(STORAGE_KEY);
  return VALUES.includes(stored as LayoutWidth) ? (stored as LayoutWidth) : "center";
}

function getServerSnapshot(): LayoutWidth {
  return "center";
}

const LayoutAlignContext = createContext<{
  width: LayoutWidth;
  setWidth: (next: LayoutWidth) => void;
} | null>(null);

export function LayoutAlignProvider({ children }: { children: React.ReactNode }) {
  const width = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  const setWidth = useCallback((next: LayoutWidth) => {
    window.localStorage.setItem(STORAGE_KEY, next);
    window.dispatchEvent(new Event("storage"));
  }, []);

  return (
    <LayoutAlignContext.Provider value={{ width, setWidth }}>
      {children}
    </LayoutAlignContext.Provider>
  );
}

export function useLayoutAlign() {
  const context = useContext(LayoutAlignContext);
  if (!context) {
    throw new Error("useLayoutAlign must be used within a LayoutAlignProvider");
  }
  return context;
}
