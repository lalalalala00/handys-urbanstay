"use client";

import { useLayoutAlign } from "@/components/common/LayoutAlignProvider";

export function AppShellFrame({
  sidebar,
  header,
  children,
}: {
  sidebar: React.ReactNode;
  header: React.ReactNode;
  children: React.ReactNode;
}) {
  const { width } = useLayoutAlign();

  const outerClass =
    width === "centerAll" ? "mx-auto h-full w-full max-w-426" : "h-full w-full";
  const contentClass = width === "center" ? "mx-auto w-full max-w-370" : "w-full";

  return (
    <div className={`flex ${outerClass} min-w-0 overflow-hidden`}>
      {sidebar}
      <div className="flex min-w-0 flex-1 flex-col">
        {header}
        <main className="min-w-0 flex-1 overflow-y-auto px-4 pb-28 pt-5 sm:px-6 sm:pt-6 lg:pb-6">
          <div className={contentClass}>{children}</div>
        </main>
      </div>
    </div>
  );
}
