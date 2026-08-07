"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/common/Toast";
import type { IssueStatus } from "@/lib/types";

export function IssueCompletionPanel({
  issueId,
  status,
  managerName,
}: {
  issueId: string;
  status: IssueStatus;
  managerName: string | null;
}) {
  const router = useRouter();
  const showToast = useToast();

  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function patchStatus(next: IssueStatus) {
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

      showToast(
        next === "inspection"
          ? "처리 완료로 표시되었습니다."
          : "이슈 처리가 확인되었습니다."
      );

      router.refresh();
    } finally {
      setPending(false);
    }
  }

  if (status === "new" || status === "checking" || status === "assigned") {
    return (
      <DisabledCompletionState
        managerName={managerName}
        message="크루가 처리를 시작하면 완료 처리를 진행할 수 있습니다."
      />
    );
  }

  if (status === "in_progress") {
    return (
      <div className="space-y-4">
        <ManagerSummary managerName={managerName} />

        <p className="rounded-lg bg-black/[0.03] px-3 py-2.5 text-xs leading-5 text-gray-500 dark:bg-white/5 dark:text-gray-400">
          현장 조치가 끝나면 처리 완료로 표시하세요. 담당자가 확인하면 이슈가
          종료됩니다.
        </p>

        <button
          type="button"
          disabled={pending}
          onClick={() => patchStatus("inspection")}
          className="h-10 w-full rounded-lg bg-foreground text-sm font-medium text-background transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-30"
        >
          {pending ? "처리 중..." : "처리 완료로 표시"}
        </button>

        {error && <ErrorMessage>{error}</ErrorMessage>}
      </div>
    );
  }

  if (status === "inspection") {
    return (
      <div className="space-y-4">
        <ManagerSummary managerName={managerName} />

        <div className="rounded-lg bg-primary/[0.05] px-3 py-3">
          <p className="text-xs leading-5 text-gray-600 dark:text-gray-300">
            크루가 처리를 완료했습니다. 조치 내용을 확인한 뒤 최종 확인해
            주세요.
          </p>
        </div>

        <button
          type="button"
          disabled={!managerName || pending}
          onClick={() => patchStatus("done")}
          className="h-10 w-full rounded-lg bg-primary text-sm font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-30"
        >
          {pending ? "확인 중..." : "처리 확인 완료"}
        </button>

        {error && <ErrorMessage>{error}</ErrorMessage>}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <ManagerSummary managerName={managerName} />

      <div className="rounded-xl border border-green-200 bg-green-50 px-3 py-4 dark:border-green-900/50 dark:bg-green-950/20">
        <p className="text-sm font-semibold text-green-700 dark:text-green-300">
          이슈 처리가 완료되었습니다.
        </p>
      </div>
    </div>
  );
}

function ManagerSummary({ managerName }: { managerName: string | null }) {
  return (
    <div className="rounded-lg border border-black/10 bg-black/[0.02] px-3 py-3 dark:border-white/10 dark:bg-white/[0.03]">
      <div className="text-[11px] text-gray-500 dark:text-gray-400">담당자</div>

      <div className="mt-1 text-sm font-semibold">
        {managerName ?? "담당자 미배정"}
      </div>
    </div>
  );
}

function DisabledCompletionState({
  managerName,
  message,
}: {
  managerName: string | null;
  message: string;
}) {
  return (
    <div className="space-y-3">
      <ManagerSummary managerName={managerName} />

      <p className="rounded-lg border border-dashed border-black/10 px-3 py-3 text-xs leading-5 text-gray-500 dark:border-white/10 dark:text-gray-400">
        {message}
      </p>
    </div>
  );
}

function ErrorMessage({ children }: { children: React.ReactNode }) {
  return (
    <p className="rounded-lg bg-red-50 px-3 py-2 text-xs text-red-600 dark:bg-red-950/30 dark:text-red-400">
      {children}
    </p>
  );
}
