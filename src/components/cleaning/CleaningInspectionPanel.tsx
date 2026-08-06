"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/common/Toast";
import type { CleaningTaskStatus } from "@/lib/types";

export function CleaningInspectionPanel({
  taskId,
  status,
  managerName,
  photoUrl,
  onPhotoChange,
}: {
  taskId: string;
  status: CleaningTaskStatus;
  managerName: string | null;
  photoUrl: string | null;
  onPhotoChange: (url: string) => void;
}) {
  const router = useRouter();
  const showToast = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function patchStatus(next: CleaningTaskStatus) {
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
        next === "inspection"
          ? "청소 완료 사진이 등록되었습니다."
          : "검수가 완료되었습니다."
      );

      router.refresh();
    } finally {
      setPending(false);
    }
  }

  function handlePhotoChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];

    if (!file) return;

    onPhotoChange(URL.createObjectURL(file));
  }

  if (status === "unassigned" || status === "assigned") {
    return (
      <DisabledInspectionState
        managerName={managerName}
        message="청소가 시작되면 완료 사진을 등록할 수 있습니다."
      />
    );
  }

  if (status === "cleaning") {
    return (
      <div className="space-y-4">
        <ManagerSummary managerName={managerName} />

        <div>
          <div className="mb-2 text-xs font-medium text-gray-600 dark:text-gray-300">
            완료 사진
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handlePhotoChange}
            className="hidden"
          />

          {photoUrl ? (
            <div className="relative overflow-hidden rounded-xl border border-black/10 dark:border-white/10">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={photoUrl}
                alt="청소 완료 사진 미리보기"
                className="h-40 w-full object-cover"
              />

              <div className="absolute inset-x-0 bottom-0 flex items-center justify-between bg-black/60 px-3 py-2 text-white">
                <span className="text-xs">사진이 선택되었습니다.</span>

                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="text-xs font-medium underline"
                >
                  변경
                </button>
              </div>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="flex min-h-32 w-full flex-col items-center justify-center rounded-xl border border-dashed border-black/15 bg-black/[0.02] px-4 transition hover:border-primary/40 hover:bg-primary/[0.03] dark:border-white/15 dark:bg-white/[0.02]"
            >
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-lg text-primary">
                +
              </span>

              <span className="mt-3 text-sm font-medium">
                청소 완료 사진 추가
              </span>

              <span className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                객실 전체 상태가 확인되는 사진을 등록하세요.
              </span>
            </button>
          )}
        </div>

        <button
          type="button"
          disabled={!photoUrl || pending}
          onClick={() => patchStatus("inspection")}
          className="h-10 w-full rounded-lg bg-foreground text-sm font-medium text-background transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-30"
        >
          {pending ? "처리 중..." : "청소 완료 및 검수 요청"}
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
            완료 사진과 객실 상태를 확인한 뒤 최종 승인해 주세요.
          </p>
        </div>

        <button
          type="button"
          disabled={!managerName || pending}
          onClick={() => patchStatus("done")}
          className="h-10 w-full rounded-lg bg-primary text-sm font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-30"
        >
          {pending ? "확인 중..." : "검수 확인 완료"}
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
          청소 검수가 완료되었습니다.
        </p>

        <p className="mt-1 text-xs text-green-600 dark:text-green-400">
          객실을 다음 체크인에 사용할 수 있습니다.
        </p>
      </div>
    </div>
  );
}

function ManagerSummary({ managerName }: { managerName: string | null }) {
  return (
    <div className="rounded-lg border border-black/10 bg-black/[0.02] px-3 py-3 dark:border-white/10 dark:bg-white/[0.03]">
      <div className="text-[11px] text-gray-500 dark:text-gray-400">
        검수 담당자
      </div>

      <div className="mt-1 text-sm font-semibold">
        {managerName ?? "담당자 미배정"}
      </div>
    </div>
  );
}

function DisabledInspectionState({
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
