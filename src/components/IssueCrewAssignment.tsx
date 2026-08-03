"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Staff, StaffRole } from "@/lib/types";

export function IssueCrewAssignment({
  issueId,
  assigneeId,
  staffList,
  suggestedRole,
}: {
  issueId: string;
  assigneeId: string | null;
  staffList: Staff[];
  suggestedRole: StaffRole;
}) {
  const router = useRouter();
  const [selectedAssignee, setSelectedAssignee] = useState(assigneeId ?? "");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  const sortedStaff = [...staffList].sort(
    (a, b) => Number(a.role !== suggestedRole) - Number(b.role !== suggestedRole)
  );

  async function assign() {
    setPending(true);
    setError(null);
    const res = await fetch(`/api/issues/${issueId}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ assigneeId: selectedAssignee }),
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
      <div className="mb-2 text-sm font-medium">
        크루 배정{" "}
        <span className="font-normal text-gray-500 dark:text-gray-400">
          (추천 역할: {suggestedRole})
        </span>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <select
          className="rounded border border-black/10 bg-transparent px-3 py-1.5 text-sm dark:border-white/10"
          value={selectedAssignee}
          onChange={(e) => setSelectedAssignee(e.target.value)}
        >
          <option value="">크루 선택</option>
          {sortedStaff.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name} ({s.role})
            </option>
          ))}
        </select>
        <button
          disabled={!selectedAssignee || pending}
          onClick={assign}
          className="rounded bg-foreground px-3 py-1.5 text-sm text-background disabled:opacity-40"
        >
          배정
        </button>
      </div>
      {error && <p className="mt-2 text-xs text-red-600 dark:text-red-400">{error}</p>}
    </div>
  );
}
