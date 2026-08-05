"use client";

import { useMemo, useState } from "react";
import { formatTime } from "@/lib/format";
import { CheckCircleIcon } from "@/components/icons";
import type { ActivityCategory, ActivityItem } from "@/lib/queries";

const TABS: { key: ActivityCategory | "all"; label: string }[] = [
  { key: "all", label: "전체" },
  { key: "cleaning", label: "청소" },
  { key: "issue", label: "운영 이슈" },
  { key: "assignment", label: "배정" },
];

const PAGE_SIZE = 10;

export function ActivityDrawer({ history }: { history: ActivityItem[] }) {
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState<ActivityCategory | "all">("all");
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  const filtered = useMemo(
    () => (tab === "all" ? history : history.filter((item) => item.category === tab)),
    [history, tab]
  );
  const visible = filtered.slice(0, visibleCount);
  const hasMore = visibleCount < filtered.length;

  function selectTab(next: ActivityCategory | "all") {
    setTab(next);
    setVisibleCount(PAGE_SIZE);
  }

  function close() {
    setOpen(false);
    setTab("all");
    setVisibleCount(PAGE_SIZE);
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="text-xs font-medium text-subtext transition-colors hover:text-primary"
      >
        더보기
      </button>

      <div
        className={`fixed inset-0 z-50 bg-black/30 transition-opacity ${
          open ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
        onClick={close}
      />

      <div
        className={`fixed top-0 right-0 z-50 flex h-full w-full max-w-sm flex-col bg-card shadow-xl transition-transform duration-300 ${
          open ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between border-b border-card-border p-4">
          <h2 className="text-sm font-semibold">최근 활동</h2>
          <button
            type="button"
            onClick={close}
            aria-label="닫기"
            className="text-lg leading-none text-subtext transition-colors hover:text-foreground"
          >
            ×
          </button>
        </div>

        <div className="flex gap-1.5 border-b border-card-border p-3">
          {TABS.map((t) => (
            <button
              key={t.key}
              type="button"
              onClick={() => selectTab(t.key)}
              className={`rounded-full px-2.5 py-1 text-xs font-medium transition-colors ${
                tab === t.key
                  ? "bg-primary text-white"
                  : "bg-black/5 text-subtext hover:bg-black/10 dark:bg-white/10 dark:hover:bg-white/15"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          <ul className="flex flex-col gap-3">
            {visible.map((item) => (
              <li
                key={item.id}
                className="flex items-start justify-between gap-2 text-xs"
              >
                <div className="flex items-start gap-2">
                  {item.done ? (
                    <CheckCircleIcon className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" />
                  ) : (
                    <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-black/20 dark:bg-white/20" />
                  )}
                  <div>
                    <span className="inline-block rounded-full bg-primary/10 px-1.5 py-0.5 text-[11px] font-medium text-primary">
                      {item.room}
                    </span>
                    <span className="ml-1.5 text-foreground/80">{item.action}</span>
                  </div>
                </div>
                <span className="shrink-0 text-subtext">{formatTime(item.time)}</span>
              </li>
            ))}
            {visible.length === 0 && (
              <li className="py-6 text-center text-sm text-subtext">
                활동 내역이 없습니다.
              </li>
            )}
          </ul>
          {hasMore && (
            <button
              type="button"
              onClick={() => setVisibleCount((c) => c + PAGE_SIZE)}
              className="mt-4 w-full rounded-lg border border-card-border py-2 text-xs font-medium text-subtext transition-colors hover:text-primary"
            >
              이전 활동 더 보기
            </button>
          )}
        </div>
      </div>
    </>
  );
}
