"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/Toast";
import type { OperationStatus } from "@/lib/types";

export function RoomOperationControl({
  roomId,
  operationStatus,
  operationNote,
  roomOpenIssueCount,
  suggestedNote,
}: {
  roomId: string;
  operationStatus: OperationStatus;
  operationNote: string | null;
  roomOpenIssueCount: number;
  suggestedNote: string;
}) {
  const router = useRouter();
  const showToast = useToast();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const isBlocked = operationStatus === "blocked";

  async function changeOperationStatus() {
    const nextStatus: OperationStatus = isBlocked ? "ready" : "blocked";
    setPending(true);
    setError(null);

    try {
      const response = await fetch(`/api/rooms/${roomId}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          operationStatus: nextStatus,
          operationNote: nextStatus === "blocked" ? suggestedNote : null,
        }),
      });
      const result = await response.json();

      if (!response.ok) {
        setError(result.error ?? "객실 운영 상태를 변경하지 못했습니다.");
        return;
      }

      showToast(
        nextStatus === "blocked"
          ? "객실 판매를 중지했습니다."
          : "객실 판매를 재개했습니다."
      );
      router.refresh();
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="space-y-3">
      <div className={`rounded-lg border px-3 py-2.5 ${
        isBlocked
          ? "border-danger-border bg-danger-bg"
          : "border-success-border bg-success-bg"
      }`}>
        <p className="text-[11px] text-subtext">현재 객실 운영 상태</p>
        <p className="mt-1 text-sm font-semibold">
          {isBlocked ? "판매 중지" : "판매 가능"}
        </p>
        {isBlocked && operationNote && (
          <p className="mt-1 text-xs leading-5 text-danger-text">{operationNote}</p>
        )}
      </div>

      <button
        type="button"
        onClick={changeOperationStatus}
        disabled={pending || (isBlocked && roomOpenIssueCount > 0)}
        className={`h-10 w-full rounded-lg text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-40 ${
          isBlocked
            ? "bg-primary text-white hover:bg-primary-hover"
            : "border border-danger-border bg-card text-danger-text hover:bg-danger-bg"
        }`}
      >
        {pending
          ? "변경 중..."
          : isBlocked
            ? "객실 판매 재개"
            : "객실 판매 중지"}
      </button>

      {isBlocked && roomOpenIssueCount > 0 && (
        <p className="text-xs leading-5 text-subtext">
          미완료 이슈 {roomOpenIssueCount}건을 모두 처리한 뒤 판매를 재개할 수 있습니다.
        </p>
      )}
      {error && <p className="text-xs text-danger-text">{error}</p>}
    </div>
  );
}
