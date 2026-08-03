"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { StatusChangeButtons } from "@/components/StatusChangeButtons";
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
    <>
      <div>
        <div className="mb-2 text-sm font-medium">상태 변경</div>
        <StatusChangeButtons
          current={status}
          allowedNext={allowedNext}
          labelMap={CLEANING_STATUS_LABEL}
          steps={CLEANING_STEPS}
          onSelect={(next) => patch({ status: next })}
          pending={pending}
        />
      </div>

      {error && <p className="text-xs text-red-600 dark:text-red-400">{error}</p>}
    </>
  );
}
