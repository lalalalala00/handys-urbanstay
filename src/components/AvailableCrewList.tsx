"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { formatDuration } from "@/lib/format";
import { STAFF_ROLE_LABEL } from "@/lib/labels";
import type { Staff } from "@/lib/types";

// Keep the "searching nearby" state visible for a beat even when the
// recommend call resolves instantly — an instant flash reads as broken,
// not fast.
const MIN_SEARCH_MS = 2200;

// Below this many minutes to next check-in, nudge toward assigning a
// resident staff member immediately instead of continuing to search.
const URGENT_CHECKIN_MINUTES = 60;

interface Candidate {
  id: string;
  name: string;
  activeTaskCount: number;
}

type EscalationPanel = "resident" | "wider" | "manual";

const PANEL_TITLE: Record<EscalationPanel, string> = {
  resident: "상주 직원에게 배정",
  wider: "인접 지점 포함 전체 크루",
  manual: "직접 배정하기",
};

function SearchingIndicator({ label }: { label: string }) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-lg border border-black/10 py-10 text-center dark:border-white/10">
      <span className="relative flex h-3 w-3">
        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-foreground/40" />
        <span className="relative inline-flex h-3 w-3 rounded-full bg-foreground/70" />
      </span>
      <p className="text-sm text-gray-500 dark:text-gray-400">{label}</p>
    </div>
  );
}

export function AvailableCrewList({
  taskId,
  checkinMinutes,
}: {
  taskId: string;
  checkinMinutes: number | null;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [noCrew, setNoCrew] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [assigningId, setAssigningId] = useState<string | null>(null);
  const [panel, setPanel] = useState<EscalationPanel | null>(null);
  const [panelLoading, setPanelLoading] = useState(false);
  const [panelStaff, setPanelStaff] = useState<Staff[]>([]);

  useEffect(() => {
    let cancelled = false;
    const startedAt = Date.now();
    fetch(`/api/cleaning-tasks/${taskId}/recommend`)
      .then((res) => res.json())
      .then(async (json) => {
        const elapsed = Date.now() - startedAt;
        if (elapsed < MIN_SEARCH_MS) {
          await new Promise((r) => setTimeout(r, MIN_SEARCH_MS - elapsed));
        }
        if (cancelled) return;
        if (!json.recommendation) {
          setNoCrew(true);
        } else {
          setCandidates(json.candidates ?? [json.recommendation]);
        }
      })
      .catch(() => {
        if (!cancelled) setError("크루 정보를 불러오지 못했습니다.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [taskId]);

  async function assign(id: string) {
    setAssigningId(id);
    setError(null);
    const res = await fetch(`/api/cleaning-tasks/${taskId}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ assigneeId: id }),
    });
    setAssigningId(null);
    if (!res.ok) {
      const json = await res.json();
      setError(json.error ?? "배정에 실패했습니다.");
      return;
    }
    router.refresh();
  }

  async function openPanel(kind: EscalationPanel) {
    setPanel(kind);
    setPanelLoading(true);
    setError(null);
    // "탐색 범위 확대" simulates widening the search before showing results.
    if (kind === "wider") {
      await new Promise((r) => setTimeout(r, MIN_SEARCH_MS));
    }
    const res = await fetch("/api/staff");
    const json = await res.json();
    setPanelStaff(json.staff ?? []);
    setPanelLoading(false);
  }

  if (loading) {
    return <SearchingIndicator label="근처에서 가능한 크루를 찾고 있어요..." />;
  }

  if (panel) {
    return (
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <p className="text-sm font-medium">{PANEL_TITLE[panel]}</p>
          <button
            onClick={() => setPanel(null)}
            className="text-xs text-gray-500 underline hover:text-foreground"
          >
            뒤로
          </button>
        </div>
        {panelLoading ? (
          <SearchingIndicator
            label={
              panel === "wider"
                ? "탐색 범위를 넓히고 있어요..."
                : "직원 목록을 불러오고 있어요..."
            }
          />
        ) : panelStaff.length === 0 ? (
          <p className="rounded-lg border border-dashed border-black/15 py-8 text-center text-sm text-gray-500 dark:border-white/15 dark:text-gray-400">
            등록된 직원이 없어요.
          </p>
        ) : (
          panelStaff.map((s) => (
            <div
              key={s.id}
              className="flex items-center justify-between rounded-lg border border-black/10 px-3 py-2.5 dark:border-white/10"
            >
              <div>
                <div className="text-sm font-medium">{s.name}</div>
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  {STAFF_ROLE_LABEL[s.role]}
                </div>
              </div>
              <button
                disabled={assigningId !== null}
                onClick={() => assign(s.id)}
                className="rounded bg-foreground px-3 py-1.5 text-xs text-background disabled:opacity-40"
              >
                {assigningId === s.id ? "배정 중..." : "배정"}
              </button>
            </div>
          ))
        )}
        {error && <p className="text-xs text-red-600 dark:text-red-400">{error}</p>}
      </div>
    );
  }

  if (noCrew) {
    const isUrgent = checkinMinutes !== null && checkinMinutes <= URGENT_CHECKIN_MINUTES;
    const checkinLine =
      checkinMinutes === null
        ? null
        : checkinMinutes <= 0
          ? "체크인 시간이 지났습니다."
          : `다음 체크인까지 ${formatDuration(checkinMinutes)} 남았습니다.`;

    return (
      <div className="flex flex-col gap-3">
        {isUrgent && (
          <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2.5 dark:border-red-900/40 dark:bg-red-900/20">
            <p className="text-xs font-semibold text-red-600 dark:text-red-400">긴급</p>
            {checkinLine && (
              <p className="mt-0.5 text-sm text-red-700 dark:text-red-300">{checkinLine}</p>
            )}
            <p className="mt-0.5 text-xs text-red-600 dark:text-red-400">
              즉시 상주 직원 배정이 필요합니다.
            </p>
          </div>
        )}

        <div className="rounded-lg border border-dashed border-black/15 py-6 text-center dark:border-white/15">
          <p className="text-sm font-medium">현재 가능한 지역 크루가 없습니다.</p>
          {!isUrgent && checkinLine && (
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">{checkinLine}</p>
          )}
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => openPanel("resident")}
            className={
              isUrgent
                ? "rounded bg-red-600 px-3 py-1.5 text-xs text-white hover:bg-red-700"
                : "rounded border border-black/10 px-3 py-1.5 text-xs hover:bg-black/3 dark:border-white/10 dark:hover:bg-white/5"
            }
          >
            상주 직원 배정
          </button>
          <button
            onClick={() => openPanel("wider")}
            className="rounded border border-black/10 px-3 py-1.5 text-xs hover:bg-black/3 dark:border-white/10 dark:hover:bg-white/5"
          >
            탐색 범위 확대
          </button>
          <button
            onClick={() => openPanel("manual")}
            className="rounded border border-black/10 px-3 py-1.5 text-xs hover:bg-black/3 dark:border-white/10 dark:hover:bg-white/5"
          >
            직접 배정
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      <p className="text-xs text-gray-500 dark:text-gray-400">
        지금 배정 가능한 크루 {candidates.length}명
      </p>
      {candidates.map((c) => (
        <div
          key={c.id}
          className="flex items-center justify-between rounded-lg border border-black/10 px-3 py-2.5 dark:border-white/10"
        >
          <div>
            <div className="text-sm font-medium">{c.name}</div>
            <div className="text-xs text-gray-500 dark:text-gray-400">
              진행 중인 작업 {c.activeTaskCount}건
            </div>
          </div>
          <button
            disabled={assigningId !== null}
            onClick={() => assign(c.id)}
            className="rounded bg-foreground px-3 py-1.5 text-xs text-background disabled:opacity-40"
          >
            {assigningId === c.id ? "배정 중..." : "배정"}
          </button>
        </div>
      ))}
      {error && <p className="text-xs text-red-600 dark:text-red-400">{error}</p>}
    </div>
  );
}
