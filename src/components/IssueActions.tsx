"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { StatusChangeButtons } from "@/components/StatusChangeButtons";
import { ActionDivider } from "@/components/ActionPanel";
import { ISSUE_CATEGORY_LABEL, ISSUE_STATUS_LABEL, ISSUE_URGENCY_LABEL } from "@/lib/labels";
import { ISSUE_STEPS } from "@/lib/transitions";
import type { IssueCategory, IssueStatus, IssueUrgency } from "@/lib/types";

const CATEGORIES = Object.keys(ISSUE_CATEGORY_LABEL) as IssueCategory[];
const URGENCIES = Object.keys(ISSUE_URGENCY_LABEL) as IssueUrgency[];

const URGENCY_BUTTON_CLASSES: Record<IssueUrgency, string> = {
  urgent:
    "border-red-200 bg-red-100 text-red-700 dark:border-red-900/40 dark:bg-red-900/40 dark:text-red-300",
  normal:
    "border-amber-200 bg-amber-100 text-amber-800 dark:border-amber-900/40 dark:bg-amber-900/40 dark:text-amber-300",
  low: "border-gray-200 bg-gray-100 text-gray-700 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300",
};

export function IssueActions({
  issueId,
  status,
  category,
  urgency,
  allowedNext,
}: {
  issueId: string;
  status: IssueStatus;
  category: IssueCategory;
  urgency: IssueUrgency;
  allowedNext: IssueStatus[];
}) {
  const router = useRouter();
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

  return (
    <>
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
          <div className="flex flex-wrap gap-2">
            {URGENCIES.map((u) => (
              <button
                key={u}
                type="button"
                onClick={() => setSelectedUrgency(u)}
                className={`rounded-full border px-3 py-1.5 text-sm transition-colors ${
                  selectedUrgency === u
                    ? URGENCY_BUTTON_CLASSES[u]
                    : "border-black/10 text-gray-500 hover:bg-black/3 dark:border-white/10 dark:text-gray-400 dark:hover:bg-white/5"
                }`}
              >
                {ISSUE_URGENCY_LABEL[u]}
              </button>
            ))}
          </div>
          <button
            disabled={pending || (selectedCategory === category && selectedUrgency === urgency)}
            onClick={() => patch({ category: selectedCategory, urgency: selectedUrgency })}
            className="rounded border border-black/10 px-3 py-1.5 text-sm disabled:opacity-40 dark:border-white/10"
          >
            저장
          </button>
        </div>
      </div>

      <ActionDivider />

      <div>
        <div className="mb-2 text-sm font-medium">처리 상태 변경</div>
        <StatusChangeButtons
          current={status}
          allowedNext={allowedNext}
          labelMap={ISSUE_STATUS_LABEL}
          steps={ISSUE_STEPS}
          onSelect={(next) => patch({ status: next })}
          pending={pending}
        />
      </div>

      {error && <p className="text-xs text-red-600 dark:text-red-400">{error}</p>}
    </>
  );
}
