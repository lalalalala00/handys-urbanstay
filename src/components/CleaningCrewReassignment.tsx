"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Staff } from "@/lib/types";

export function CleaningCrewReassignment({
  taskId,
  assigneeId,
  cleaners,
}: {
  taskId: string;
  assigneeId: string | null;
  cleaners: Staff[];
}) {
  const router = useRouter();
  const [selected, setSelected] = useState(assigneeId ?? "");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function reassign() {
    setPending(true);
    setError(null);
    const res = await fetch(`/api/cleaning-tasks/${taskId}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ assigneeId: selected }),
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
          onClick={reassign}
          className="rounded bg-foreground px-3 py-1.5 text-sm text-background disabled:opacity-40"
        >
          변경
        </button>
      </div>
      {error && <p className="mt-2 text-xs text-red-600 dark:text-red-400">{error}</p>}
    </div>
  );
}
