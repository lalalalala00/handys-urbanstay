"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ISSUE_CATEGORY_LABEL, ISSUE_STATUS_LABEL, ISSUE_URGENCY_LABEL } from "@/lib/labels";
import type { IssueCategory, IssueStatus, IssueUrgency, Staff, StaffRole } from "@/lib/types";

const CATEGORIES = Object.keys(ISSUE_CATEGORY_LABEL) as IssueCategory[];
const URGENCIES = Object.keys(ISSUE_URGENCY_LABEL) as IssueUrgency[];

export function IssueActions({
  issueId,
  status,
  assigneeId,
  category,
  urgency,
  staffList,
  suggestedRole,
  allowedNext,
}: {
  issueId: string;
  status: IssueStatus;
  assigneeId: string | null;
  category: IssueCategory;
  urgency: IssueUrgency;
  staffList: Staff[];
  suggestedRole: StaffRole;
  allowedNext: IssueStatus[];
}) {
  const router = useRouter();
  const [selectedAssignee, setSelectedAssignee] = useState(assigneeId ?? "");
  const [selectedCategory, setSelectedCategory] = useState(category);
  const [selectedUrgency, setSelectedUrgency] = useState(urgency);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function patch(body: Record<string, unknown>) {
    setPending(true);
    setError(null);
    const res = await fetch(`/api/issues/${issueId}`, {
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

  const sortedStaff = [...staffList].sort(
    (a, b) => Number(a.role !== suggestedRole) - Number(b.role !== suggestedRole)
  );

  return (
    <div className="flex flex-col gap-5 rounded-lg border border-black/10 p-5 dark:border-white/10">
      <div>
        <div className="mb-2 text-sm font-medium">
          담당자 배정{" "}
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
            <option value="">담당자 선택</option>
            {sortedStaff.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name} ({s.role})
              </option>
            ))}
          </select>
          <button
            disabled={!selectedAssignee || pending}
            onClick={() => patch({ assigneeId: selectedAssignee })}
            className="rounded bg-foreground px-3 py-1.5 text-sm text-background disabled:opacity-40"
          >
            배정
          </button>
        </div>
      </div>

      <div>
        <div className="mb-2 text-sm font-medium">분류 수정</div>
        <div className="flex flex-wrap items-center gap-2">
          <select
            className="rounded border border-black/10 bg-transparent px-3 py-1.5 text-sm dark:border-white/10"
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value as IssueCategory)}
          >
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {ISSUE_CATEGORY_LABEL[c]}
              </option>
            ))}
          </select>
          <select
            className="rounded border border-black/10 bg-transparent px-3 py-1.5 text-sm dark:border-white/10"
            value={selectedUrgency}
            onChange={(e) => setSelectedUrgency(e.target.value as IssueUrgency)}
          >
            {URGENCIES.map((u) => (
              <option key={u} value={u}>
                {ISSUE_URGENCY_LABEL[u]}
              </option>
            ))}
          </select>
          <button
            disabled={pending || (selectedCategory === category && selectedUrgency === urgency)}
            onClick={() => patch({ category: selectedCategory, urgency: selectedUrgency })}
            className="rounded border border-black/10 px-3 py-1.5 text-sm disabled:opacity-40 dark:border-white/10"
          >
            저장
          </button>
        </div>
      </div>

      <div>
        <div className="mb-2 text-sm font-medium">처리 상태 변경</div>
        {allowedNext.length === 0 ? (
          <p className="text-xs text-gray-500 dark:text-gray-400">
            더 이상 변경할 수 있는 상태가 없습니다.
          </p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {allowedNext.map((next) => (
              <button
                key={next}
                disabled={pending}
                onClick={() => patch({ status: next })}
                className="rounded border border-black/10 px-3 py-1.5 text-sm hover:bg-black/3 disabled:opacity-40 dark:border-white/10 dark:hover:bg-white/5"
              >
                {ISSUE_STATUS_LABEL[status]} → {ISSUE_STATUS_LABEL[next]}
              </button>
            ))}
          </div>
        )}
      </div>

      {error && <p className="text-xs text-red-600 dark:text-red-400">{error}</p>}
    </div>
  );
}
