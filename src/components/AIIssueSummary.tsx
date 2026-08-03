"use client";

import { useEffect, useState } from "react";

type IssueInput = { category: string; description: string; urgency: string };
type Summary = { summary: string; recommendation: string };

export function AIIssueSummary({ issues }: { issues: IssueInput[] }) {
  const [state, setState] = useState<"loading" | "ready" | "unavailable">("loading");
  const [result, setResult] = useState<Summary | null>(null);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/rooms/issue-summary", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ issues }),
    })
      .then((res) => (res.ok ? res.json() : Promise.reject()))
      .then((data) => {
        if (!cancelled) {
          setResult(data.summary);
          setState("ready");
        }
      })
      .catch(() => {
        if (!cancelled) setState("unavailable");
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (state === "unavailable") return null;

  return (
    <div className="rounded-lg border border-black/10 p-4 dark:border-white/10">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5 text-sm font-medium">
          AI 이슈 요약
          <span className="rounded-full bg-primary/10 px-1.5 py-0.5 text-[10px] font-semibold text-primary">
            BETA
          </span>
        </div>
        {state === "ready" && (
          <button
            type="button"
            onClick={() => setExpanded((v) => !v)}
            className="text-xs font-medium text-subtext transition-colors hover:text-primary"
          >
            {expanded ? "접기 ⌃" : "자세히 보기 ⌄"}
          </button>
        )}
      </div>

      {state === "loading" ? (
        <div className="mt-3 flex flex-col gap-2">
          <div className="h-3 w-5/6 animate-pulse rounded bg-black/10 dark:bg-white/10" />
          <div className="h-3 w-2/3 animate-pulse rounded bg-black/10 dark:bg-white/10" />
        </div>
      ) : (
        result && (
          <>
            <p className="mt-3 text-sm text-foreground/80">{result.summary}</p>
            {expanded && (
              <p className="mt-1.5 text-sm text-gray-500 dark:text-gray-400">
                {result.recommendation}
              </p>
            )}
            <p className="mt-3 text-[11px] text-gray-400 dark:text-gray-500">
              ※ AI 요약은 참고용으로 실제 상황과 다를 수 있습니다.
            </p>
          </>
        )
      )}
    </div>
  );
}
