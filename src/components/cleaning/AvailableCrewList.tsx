"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/common/Toast";
import { formatDuration } from "@/lib/format";
import { STAFF_ROLE_LABEL } from "@/lib/labels";
import type { Staff } from "@/lib/types";

const MIN_SEARCH_MS = 2200;
const URGENT_CHECKIN_MINUTES = 60;

interface Candidate {
  id: string;
  name: string;
  activeTaskCount: number;
}

type EscalationPanel = "resident" | "wider" | "manual";

const PANEL_TITLE: Record<EscalationPanel, string> = {
  resident: "상주 직원 선택",
  wider: "전체 크루 검색 결과",
  manual: "직접 크루 선택",
};

function SearchingIndicator({ label }: { label: string }) {
  return (
    <div className="flex min-h-36 flex-col items-center justify-center rounded-xl border border-dashed border-primary/20 bg-primary/[0.03] px-4 text-center">
      <span className="relative flex h-4 w-4">
        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary/30" />
        <span className="relative inline-flex h-4 w-4 rounded-full bg-primary" />
      </span>

      <p className="mt-4 text-sm font-medium">{label}</p>

      <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
        위치와 현재 작업량을 기준으로 확인하고 있습니다.
      </p>
    </div>
  );
}

export function AvailableCrewList({
  taskId,
  checkinMinutes,
  onAssigned,
}: {
  taskId: string;
  checkinMinutes: number | null;
  onAssigned?: (crewName: string) => void;
}) {
  const router = useRouter();
  const showToast = useToast();

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
          await new Promise((resolve) =>
            setTimeout(resolve, MIN_SEARCH_MS - elapsed)
          );
        }

        if (cancelled) return;

        if (!json.recommendation) {
          setNoCrew(true);
          return;
        }

        setCandidates(json.candidates ?? [json.recommendation]);
      })
      .catch(() => {
        if (!cancelled) {
          setError("크루 정보를 불러오지 못했습니다.");
        }
      })
      .finally(() => {
        if (!cancelled) {
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [taskId]);

  async function assign(id: string, name: string) {
    setAssigningId(id);
    setError(null);

    try {
      const res = await fetch(`/api/cleaning-tasks/${taskId}`, {
        method: "PATCH",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({
          assigneeId: id,
        }),
      });

      const json = await res.json();

      if (!res.ok) {
        setError(json.error ?? "배정에 실패했습니다.");
        return;
      }

      showToast("크루가 배정되었습니다.");
      router.refresh();
      onAssigned?.(name);
    } finally {
      setAssigningId(null);
    }
  }

  async function openPanel(kind: EscalationPanel) {
    setPanel(kind);
    setPanelLoading(true);
    setError(null);

    try {
      if (kind === "wider") {
        await new Promise((resolve) => setTimeout(resolve, MIN_SEARCH_MS));
      }

      const res = await fetch("/api/staff");
      const json = await res.json();

      setPanelStaff(json.staff ?? []);
    } catch {
      setError("직원 목록을 불러오지 못했습니다.");
    } finally {
      setPanelLoading(false);
    }
  }

  if (loading) {
    return <SearchingIndicator label="배정 가능한 크루를 찾고 있어요" />;
  }

  if (panel) {
    return (
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <p className="text-sm font-semibold">{PANEL_TITLE[panel]}</p>

          <button
            type="button"
            onClick={() => setPanel(null)}
            className="text-xs font-medium text-gray-500 transition hover:text-foreground dark:text-gray-400"
          >
            이전으로
          </button>
        </div>

        {panelLoading ? (
          <SearchingIndicator
            label={
              panel === "wider"
                ? "다른 지점까지 탐색하고 있어요"
                : "직원 목록을 불러오고 있어요"
            }
          />
        ) : panelStaff.length === 0 ? (
          <EmptyState text="배정 가능한 직원이 없습니다." />
        ) : (
          <div className="space-y-2">
            {panelStaff.map((staff) => (
              <CrewCard
                key={staff.id}
                name={staff.name}
                description={STAFF_ROLE_LABEL[staff.role]}
                loading={assigningId === staff.id}
                disabled={assigningId !== null}
                onAssign={() => assign(staff.id, staff.name)}
              />
            ))}
          </div>
        )}

        {error && <ErrorMessage>{error}</ErrorMessage>}
      </div>
    );
  }

  if (noCrew) {
    const isUrgent =
      checkinMinutes !== null && checkinMinutes <= URGENT_CHECKIN_MINUTES;

    const checkinLine =
      checkinMinutes === null
        ? null
        : checkinMinutes <= 0
        ? "체크인 시간이 이미 지났습니다."
        : `다음 체크인까지 ${formatDuration(checkinMinutes)} 남았습니다.`;

    return (
      <div className="space-y-3">
        {isUrgent && (
          <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-3 dark:border-red-900/50 dark:bg-red-950/30">
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-red-500" />

              <p className="text-xs font-semibold text-red-600 dark:text-red-400">
                빠른 배정 필요
              </p>
            </div>

            {checkinLine && (
              <p className="mt-2 text-sm font-medium text-red-700 dark:text-red-300">
                {checkinLine}
              </p>
            )}

            <p className="mt-1 text-xs text-red-600 dark:text-red-400">
              인근 크루를 기다리기보다 상주 직원을 우선 배정하세요.
            </p>
          </div>
        )}

        <EmptyState
          title="현재 가능한 지역 크루가 없습니다."
          text={
            !isUrgent && checkinLine
              ? checkinLine
              : "다른 방식으로 배정할 수 있습니다."
          }
        />

        <div className="grid grid-cols-1 gap-2">
          <button
            type="button"
            onClick={() => openPanel("resident")}
            className={[
              "h-10 rounded-lg text-sm font-medium transition",
              isUrgent
                ? "bg-red-600 text-white hover:bg-red-700"
                : "bg-foreground text-background hover:opacity-90",
            ].join(" ")}
          >
            상주 직원 우선 배정
          </button>

          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => openPanel("wider")}
              className="h-10 rounded-lg border border-black/10 text-sm font-medium transition hover:bg-black/[0.03] dark:border-white/10 dark:hover:bg-white/5"
            >
              탐색 범위 확대
            </button>

            <button
              type="button"
              onClick={() => openPanel("manual")}
              className="h-10 rounded-lg border border-black/10 text-sm font-medium transition hover:bg-black/[0.03] dark:border-white/10 dark:hover:bg-white/5"
            >
              직접 선택
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-xs text-gray-500 dark:text-gray-400">
          지금 배정 가능한 크루
        </p>

        <span className="rounded-full bg-primary/10 px-2.5 py-1 text-xs font-semibold text-primary">
          {candidates.length}명
        </span>
      </div>

      <div className="space-y-2">
        {candidates.map((candidate, index) => (
          <CrewCard
            key={candidate.id}
            name={candidate.name}
            description={`진행 중인 작업 ${candidate.activeTaskCount}건`}
            recommended={index === 0}
            loading={assigningId === candidate.id}
            disabled={assigningId !== null}
            onAssign={() => assign(candidate.id, candidate.name)}
          />
        ))}
      </div>

      {error && <ErrorMessage>{error}</ErrorMessage>}
    </div>
  );
}

function CrewCard({
  name,
  description,
  recommended = false,
  loading,
  disabled,
  onAssign,
}: {
  name: string;
  description: string;
  recommended?: boolean;
  loading: boolean;
  disabled: boolean;
  onAssign: () => void;
}) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-xl border border-black/10 bg-white/60 px-3 py-3 dark:border-white/10 dark:bg-white/[0.02]">
      <div className="min-w-0">
        <div className="flex items-center gap-2">
          <p className="truncate text-sm font-semibold">{name}</p>

          {recommended && (
            <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-semibold text-primary">
              추천
            </span>
          )}
        </div>

        <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
          {description}
        </p>
      </div>

      <button
        type="button"
        disabled={disabled}
        onClick={onAssign}
        className="shrink-0 rounded-lg bg-foreground px-3 py-2 text-xs font-medium text-background transition hover:opacity-90 disabled:opacity-40"
      >
        {loading ? "배정 중" : "배정"}
      </button>
    </div>
  );
}

function EmptyState({ title, text }: { title?: string; text: string }) {
  return (
    <div className="rounded-xl border border-dashed border-black/15 bg-black/[0.02] px-4 py-6 text-center dark:border-white/15 dark:bg-white/[0.02]">
      {title && <p className="text-sm font-semibold">{title}</p>}

      <p
        className={[
          "text-xs text-gray-500 dark:text-gray-400",
          title ? "mt-1" : "",
        ].join(" ")}
      >
        {text}
      </p>
    </div>
  );
}

function ErrorMessage({ children }: { children: React.ReactNode }) {
  return (
    <p className="rounded-lg bg-red-50 px-3 py-2 text-xs text-red-600 dark:bg-red-950/30 dark:text-red-400">
      {children}
    </p>
  );
}
