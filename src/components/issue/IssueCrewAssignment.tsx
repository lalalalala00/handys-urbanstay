"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { SelectWithButton } from "@/components/common/SelectWithButton";
import { useToast } from "@/components/common/Toast";
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
  const showToast = useToast();

  const [selectedAssignee, setSelectedAssignee] = useState(assigneeId ?? "");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  const sortedStaff = [...staffList].sort(
    (a, b) =>
      Number(a.role !== suggestedRole) - Number(b.role !== suggestedRole)
  );

  async function assign() {
    setPending(true);
    setError(null);

    try {
      const res = await fetch(`/api/issues/${issueId}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ assigneeId: selectedAssignee }),
      });

      const json = await res.json();

      if (!res.ok) {
        setError(json.error ?? "요청에 실패했습니다.");
        return;
      }

      showToast("크루가 배정되었습니다.");
      router.refresh();
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-2 rounded-lg bg-primary/[0.06] px-3 py-2">
        <span className="text-xs text-gray-600 dark:text-gray-300">
          이 이슈에 적합한 역할
        </span>

        <span className="rounded-full bg-primary/10 px-2.5 py-1 text-xs font-semibold text-primary">
          {suggestedRole}
        </span>
      </div>

      <SelectWithButton
        value={selectedAssignee}
        onChange={setSelectedAssignee}
        options={sortedStaff.map((staff) => ({
          value: staff.id,
          label: `${staff.name} · ${staff.role}`,
        }))}
        placeholder="처리할 크루를 선택하세요"
        buttonLabel={pending ? "배정 중" : "배정"}
        onSubmit={assign}
        disabled={!selectedAssignee || pending}
      />

      {error && (
        <p className="text-xs text-red-600 dark:text-red-400">{error}</p>
      )}
    </div>
  );
}
