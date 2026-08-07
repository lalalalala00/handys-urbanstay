"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { StatusChangeButtons } from "@/components/common/StatusChangeButtons";
import { useToast } from "@/components/common/Toast";
import {
  ISSUE_CATEGORY_LABEL,
  ISSUE_STATUS_LABEL,
  ISSUE_URGENCY_LABEL,
} from "@/lib/labels";
import { ISSUE_STEPS } from "@/lib/transitions";
import type { IssueCategory, IssueStatus, IssueUrgency } from "@/lib/types";

const CATEGORIES = Object.keys(ISSUE_CATEGORY_LABEL) as IssueCategory[];

const URGENCIES = Object.keys(ISSUE_URGENCY_LABEL) as IssueUrgency[];

const URGENCY_ACTIVE_CLASSES: Record<IssueUrgency, string> = {
  urgent:
    "border-red-200 bg-red-50 text-red-700 dark:border-red-900/60 dark:bg-red-950/40 dark:text-red-300",
  normal:
    "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900/60 dark:bg-amber-950/40 dark:text-amber-300",
  low: "border-gray-300 bg-gray-100 text-gray-700 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200",
};

export function IssueClassificationAction({
  issueId,
  category,
  urgency,
}: {
  issueId: string;
  category: IssueCategory;
  urgency: IssueUrgency;
}) {
  const router = useRouter();
  const showToast = useToast();

  const [selectedCategory, setSelectedCategory] = useState(category);
  const [selectedUrgency, setSelectedUrgency] = useState(urgency);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  const isUnchanged =
    selectedCategory === category && selectedUrgency === urgency;

  async function saveClassification() {
    setPending(true);
    setError(null);

    try {
      const res = await fetch(`/api/issues/${issueId}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          category: selectedCategory,
          urgency: selectedUrgency,
        }),
      });

      const json = await res.json();

      if (!res.ok) {
        setError(json.error ?? "요청에 실패했습니다.");
        return;
      }

      showToast("분류와 긴급도가 저장되었습니다.");
      router.refresh();
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="space-y-4">
      <div>
        <label className="mb-2 block text-xs font-medium text-gray-600 dark:text-gray-300">
          이슈 유형
        </label>

        <select
          className="h-10 w-full rounded-lg border border-black/10 bg-white px-3 text-sm outline-none transition focus:border-primary/50 focus:ring-2 focus:ring-primary/10 dark:border-white/10 dark:bg-white/5"
          value={selectedCategory}
          onChange={(event) =>
            setSelectedCategory(event.target.value as IssueCategory)
          }
        >
          {CATEGORIES.map((categoryItem) => (
            <option key={categoryItem} value={categoryItem}>
              {ISSUE_CATEGORY_LABEL[categoryItem]}
            </option>
          ))}
        </select>
      </div>

      <div>
        <div className="mb-2 text-xs font-medium text-gray-600 dark:text-gray-300">
          긴급도
        </div>

        <div className="grid grid-cols-3 gap-2">
          {URGENCIES.map((urgencyItem) => {
            const selected = selectedUrgency === urgencyItem;

            return (
              <button
                key={urgencyItem}
                type="button"
                onClick={() => setSelectedUrgency(urgencyItem)}
                className={[
                  "rounded-lg border px-2 py-2 text-xs font-medium transition",
                  selected
                    ? URGENCY_ACTIVE_CLASSES[urgencyItem]
                    : "border-black/10 bg-transparent text-gray-500 hover:bg-black/[0.03] dark:border-white/10 dark:text-gray-400 dark:hover:bg-white/5",
                ].join(" ")}
              >
                {ISSUE_URGENCY_LABEL[urgencyItem]}
              </button>
            );
          })}
        </div>
      </div>

      <button
        type="button"
        disabled={pending || isUnchanged}
        onClick={saveClassification}
        className="h-10 w-full rounded-lg bg-foreground text-sm font-medium text-background transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-30"
      >
        {pending ? "저장 중..." : "변경사항 저장"}
      </button>

      {error && (
        <p className="text-xs text-red-600 dark:text-red-400">{error}</p>
      )}
    </div>
  );
}

export function IssueStatusAction({
  issueId,
  status,
  allowedNext,
}: {
  issueId: string;
  status: IssueStatus;
  allowedNext: IssueStatus[];
}) {
  const router = useRouter();
  const showToast = useToast();

  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function changeStatus(next: IssueStatus) {
    setPending(true);
    setError(null);

    try {
      const res = await fetch(`/api/issues/${issueId}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ status: next }),
      });

      const json = await res.json();

      if (!res.ok) {
        setError(json.error ?? "요청에 실패했습니다.");
        return;
      }

      showToast(`상태가 '${ISSUE_STATUS_LABEL[next]}'(으)로 변경되었습니다.`);
      router.refresh();
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="space-y-3">
      <div className="rounded-lg bg-black/[0.03] px-3 py-2.5 dark:bg-white/5">
        <div className="text-[11px] text-gray-500 dark:text-gray-400">
          현재 상태
        </div>
        <div className="mt-1 text-sm font-semibold">
          {ISSUE_STATUS_LABEL[status]}
        </div>
      </div>

      <StatusChangeButtons
        current={status}
        allowedNext={allowedNext}
        labelMap={ISSUE_STATUS_LABEL}
        steps={ISSUE_STEPS}
        onSelect={changeStatus}
        pending={pending}
        emptyMessage={
          status === "new" || status === "checking"
            ? "크루를 배정하면 자동으로 다음 단계로 전환됩니다."
            : status === "in_progress" || status === "inspection"
              ? "아래 완료 처리 카드에서 다음 단계를 진행하세요."
              : "모든 처리 단계가 완료되었습니다."
        }
      />

      {error && (
        <p className="text-xs text-red-600 dark:text-red-400">{error}</p>
      )}
    </div>
  );
}
