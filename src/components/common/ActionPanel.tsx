"use client";

import { useState } from "react";
import { ActionIcon, CheckCircleIcon, ChevronDownIcon } from "@/components/common/icons";

export function ActionPanel({ children }: { children: React.ReactNode }) {
  return (
    <aside className="overflow-hidden rounded-xl border border-black/10 bg-white/80  backdrop-blur-sm dark:border-white/10 dark:bg-white/[0.03]">
      <div className="border-b border-black/10 bg-black/[0.02] px-5 py-4 dark:border-white/10 dark:bg-white/[0.03]">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <ActionIcon className="h-4 w-4" />
          </div>

          <div>
            <h2 className="text-sm font-semibold">이슈 처리</h2>
            <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">
              배정부터 처리 완료까지 관리합니다.
            </p>
          </div>
        </div>
      </div>

      <div className="divide-y divide-black/10 dark:divide-white/10">
        {children}
      </div>
    </aside>
  );
}

export function ActionSection({
  number,
  title,
  description,
  complete = false,
  summary,
  children,
}: {
  number: number;
  title: string;
  description?: string;
  complete?: boolean;
  summary?: React.ReactNode;
  children: React.ReactNode;
}) {
  const [manualExpanded, setManualExpanded] = useState<boolean | null>(null);
  const expanded = manualExpanded ?? !complete;

  return (
    <section className="px-5 py-5">
      <button
        type="button"
        onClick={() => setManualExpanded(!expanded)}
        aria-expanded={expanded}
        className="flex w-full items-start justify-between gap-3 text-left"
      >
        <div className="flex min-w-0">
          <div
            className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-semibold ${
              complete
                ? "bg-primary/15 text-primary"
                : "bg-primary/10 text-primary"
            }`}
          >
            {complete ? (
              <CheckCircleIcon className="h-3.5 w-3.5" />
            ) : (
              number
            )}
          </div>
          <div className="ml-2 flex min-w-0 flex-col">
            <h3 className="text-sm font-semibold">{title}</h3>
            {expanded ? (
              description && (
                <p className="mt-0.5 text-xs leading-4 text-gray-500 dark:text-gray-400">
                  {description}
                </p>
              )
            ) : (
              summary && (
                <p className="mt-0.5 truncate text-xs leading-4 text-gray-500 dark:text-gray-400">
                  {summary}
                </p>
              )
            )}
          </div>
        </div>
        <ChevronDownIcon
          className={`mt-1 h-4 w-4 shrink-0 text-gray-400 transition-transform ${
            expanded ? "rotate-180" : ""
          }`}
        />
      </button>

      {expanded && <div className="mt-4">{children}</div>}
    </section>
  );
}

export function ActionDivider() {
  return <hr className="border-black/10 dark:border-white/10" />;
}
