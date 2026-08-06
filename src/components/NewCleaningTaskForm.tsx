"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { BranchRoomPicker, type RoomOption } from "@/components/BranchRoomPicker";
import type { Staff } from "@/lib/types";

export function NewCleaningTaskForm({
  rooms,
  cleaners,
  initialBranch,
}: {
  rooms: RoomOption[];
  cleaners: Staff[];
  initialBranch?: string;
}) {
  const router = useRouter();
  const [roomId, setRoomId] = useState("");
  const [assigneeId, setAssigneeId] = useState("");
  const [estimatedMinutes, setEstimatedMinutes] = useState(45);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!roomId) {
      setError("객실을 선택해주세요.");
      return;
    }
    setSubmitting(true);
    setError(null);
    const res = await fetch("/api/cleaning-tasks", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        roomId,
        assigneeId: assigneeId || null,
        estimatedMinutes,
      }),
    });
    const json = await res.json();
    setSubmitting(false);
    if (!res.ok) {
      setError(json.error ?? "등록에 실패했습니다.");
      return;
    }
    router.push(`/cleaning/${json.task.id}`);
  }

  return (
    <form onSubmit={submit} className="flex max-w-xl flex-col gap-5">
      <BranchRoomPicker
        rooms={rooms}
        value={roomId}
        onChange={setRoomId}
        initialBranch={initialBranch}
      />

      <label className="flex flex-col gap-1 text-sm">
        담당 크루
        <select
          className="rounded border border-black/10 bg-transparent px-3 py-2 dark:border-white/10"
          value={assigneeId}
          onChange={(e) => setAssigneeId(e.target.value)}
        >
          <option value="">미배정</option>
          {cleaners.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      </label>

      <label className="flex flex-col gap-1 text-sm">
        예상 소요 시간 (분)
        <input
          type="number"
          min={1}
          className="rounded border border-black/10 bg-transparent px-3 py-2 dark:border-white/10"
          value={estimatedMinutes}
          onChange={(e) => setEstimatedMinutes(Number(e.target.value))}
        />
      </label>

      {error && <p className="text-xs text-red-600 dark:text-red-400">{error}</p>}

      <button
        type="submit"
        disabled={submitting}
        className="self-start rounded bg-foreground px-4 py-2 text-sm text-background disabled:opacity-40"
      >
        {submitting ? "등록 중..." : "청소 작업 등록"}
      </button>
    </form>
  );
}
