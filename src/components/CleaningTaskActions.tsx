"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { StatusChangeButtons } from "@/components/StatusChangeButtons";
import { CLEANING_STATUS_LABEL } from "@/lib/labels";
import type { CleaningTaskStatus, Staff } from "@/lib/types";
import { AvailableCrewList } from "./AvailableCrewList";

export function CleaningTaskActions({
  taskId,
  status,
  assigneeId,
  cleaners,
  allowedNext,
  checkinMinutes,
}: {
  taskId: string;
  status: CleaningTaskStatus;
  assigneeId: string | null;
  cleaners: Staff[];
  allowedNext: CleaningTaskStatus[];
  checkinMinutes: number | null;
}) {
  const router = useRouter();
  const [selected, setSelected] = useState(assigneeId ?? "");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function patch(body: Record<string, unknown>) {
    setPending(true);
    setError(null);
    const res = await fetch(`/api/cleaning-tasks/${taskId}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
    });
    const json = await res.json();
    setPending(false);
    if (!res.ok) {
      setError(json.error ?? "요청에 실패했습니다.");
      return;
    }
    router.refresh();
  }

  return (
    <div className="flex flex-col gap-5 rounded-lg border border-black/10 p-5 dark:border-white/10">
      {status === "unassigned" ? (
        <div>
          <div className="mb-2 text-sm font-medium">크루 배정</div>
          <AvailableCrewList taskId={taskId} checkinMinutes={checkinMinutes} />
        </div>
      ) : (
        <div>
          <div className="mb-2 text-sm font-medium">크루 재배정</div>
          <div className="flex flex-wrap items-center gap-2">
            <select
              className="rounded border border-black/10 bg-transparent px-3 py-1.5 text-sm dark:border-white/10"
              value={selected}
              onChange={(e) => setSelected(e.target.value)}
            >
              <option value="">크루 선택</option>
              {cleaners.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
            <button
              disabled={!selected || selected === assigneeId || pending}
              onClick={() => patch({ assigneeId: selected })}
              className="rounded bg-foreground px-3 py-1.5 text-sm text-background disabled:opacity-40"
            >
              변경
            </button>
          </div>
        </div>
      )}

      <div>
        <div className="mb-2 text-sm font-medium">상태 변경</div>
        <StatusChangeButtons
          current={status}
          allowedNext={allowedNext}
          labelMap={CLEANING_STATUS_LABEL}
          onSelect={(next) => patch({ status: next })}
          pending={pending}
        />
      </div>

      {error && <p className="text-xs text-red-600 dark:text-red-400">{error}</p>}
    </div>
  );
}
