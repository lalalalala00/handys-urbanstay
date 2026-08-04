"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { StatusChangeButtons } from "@/components/StatusChangeButtons";
import { useToast } from "@/components/Toast";
import { CLEANING_STATUS_LABEL } from "@/lib/labels";
import { CLEANING_STEPS } from "@/lib/transitions";
import type { CleaningTaskStatus } from "@/lib/types";

export function CleaningTaskActions({
  taskId,
  status,
  allowedNext,
}: {
  taskId: string;
  status: CleaningTaskStatus;
  allowedNext: CleaningTaskStatus[];
}) {
  const router = useRouter();
  const showToast = useToast();

  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function changeStatus(next: CleaningTaskStatus) {
    setPending(true);
    setError(null);

    try {
      const res = await fetch(`/api/cleaning-tasks/${taskId}`, {
        method: "PATCH",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({
          status: next,
        }),
      });

      const json = await res.json();

      if (!res.ok) {
        setError(json.error ?? "요청에 실패했습니다.");
        return;
      }

      showToast(
        `상태가 '${CLEANING_STATUS_LABEL[next]}'(으)로 변경되었습니다.`
      );

      router.refresh();
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="space-y-3">
      <div className="rounded-lg bg-black/[0.03] px-3 py-3 dark:bg-white/5">
        <div className="text-[11px] text-gray-500 dark:text-gray-400">
          현재 상태
        </div>

        <div className="mt-1 text-sm font-semibold">
          {CLEANING_STATUS_LABEL[status]}
        </div>
      </div>

      {allowedNext.length > 0 ? (
        <StatusChangeButtons
          current={status}
          allowedNext={allowedNext}
          labelMap={CLEANING_STATUS_LABEL}
          steps={CLEANING_STEPS}
          onSelect={changeStatus}
          pending={pending}
        />
      ) : (
        <StatusGuide status={status} />
      )}

      {error && (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-xs text-red-600 dark:bg-red-950/30 dark:text-red-400">
          {error}
        </p>
      )}
    </div>
  );
}

function StatusGuide({ status }: { status: CleaningTaskStatus }) {
  const message: Record<CleaningTaskStatus, string> = {
    unassigned: "크루를 배정하면 배정 완료 상태로 자동 변경됩니다.",
    assigned: "크루가 청소를 시작하면 진행 상태로 변경할 수 있습니다.",
    cleaning: "완료 사진을 등록하면 검수 대기 상태로 자동 변경됩니다.",
    inspection: "운영 담당자가 확인하면 청소 완료 상태로 변경됩니다.",
    done: "청소와 검수가 모두 완료되었습니다.",
  };

  return (
    <p className="rounded-lg border border-dashed border-black/10 px-3 py-3 text-xs leading-5 text-gray-500 dark:border-white/10 dark:text-gray-400">
      {message[status]}
    </p>
  );
}
