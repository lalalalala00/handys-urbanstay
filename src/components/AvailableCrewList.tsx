"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

interface Candidate {
  id: string;
  name: string;
  activeTaskCount: number;
}

export function AvailableCrewList({ taskId }: { taskId: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [noCrew, setNoCrew] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [assigningId, setAssigningId] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch(`/api/cleaning-tasks/${taskId}/recommend`)
      .then((res) => res.json())
      .then((json) => {
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

  if (loading) {
    return (
      <div className="flex flex-col items-center gap-3 rounded-lg border border-black/10 py-8 text-center dark:border-white/10">
        <span className="relative flex h-3 w-3">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-foreground/40" />
          <span className="relative inline-flex h-3 w-3 rounded-full bg-foreground/70" />
        </span>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          주변에서 배정 가능한 크루를 찾고 있어요...
        </p>
      </div>
    );
  }

  if (noCrew) {
    return (
      <div className="rounded-lg border border-dashed border-black/15 py-8 text-center dark:border-white/15">
        <p className="text-sm font-medium">근처에 상주 중인 크루가 없어요</p>
        <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
          크루가 등록되면 다시 알려드릴게요.
        </p>
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
