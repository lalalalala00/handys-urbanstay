"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ActionDivider } from "@/components/ActionPanel";
import type { CleaningTaskStatus, Staff } from "@/lib/types";

export function CleaningInspectionPanel({
  taskId,
  status,
  managers,
  defaultManager,
  managerName,
  onManagerChange,
}: {
  taskId: string;
  status: CleaningTaskStatus;
  managers: Staff[];
  defaultManager: Staff | null;
  managerName: string | null;
  onManagerChange: (name: string) => void;
}) {
  const router = useRouter();
  const [selectedManager, setSelectedManager] = useState(defaultManager?.name ?? "");
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function patchStatus(next: CleaningTaskStatus) {
    setPending(true);
    setError(null);
    const res = await fetch(`/api/cleaning-tasks/${taskId}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ status: next }),
    });
    const json = await res.json();
    setPending(false);
    if (!res.ok) {
      setError(json.error ?? "요청에 실패했습니다.");
      return;
    }
    router.refresh();
  }

  function handlePhotoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setPhotoUrl(URL.createObjectURL(file));
  }

  return (
    <>
      <div>
        <div className="mb-2 text-sm font-medium">
          담당자{" "}
          <span className="font-normal text-gray-500 dark:text-gray-400">(검수 확인 담당)</span>
        </div>
        <p className="text-xs text-gray-500 dark:text-gray-400">
          {managerName ?? "미배정"}
          {managerName && managerName === defaultManager?.name && " (지점 기본 담당자)"}
        </p>
        <p className="mt-1 text-[11px] text-gray-400 dark:text-gray-500">
          청소 완료 처리(사진 첨부) 후 검수 단계에서 변경할 수 있습니다.
        </p>
      </div>

      {(status === "cleaning" || status === "inspection") && <ActionDivider />}

      {status === "cleaning" && (
        <div>
          <div className="mb-2 text-sm font-medium">청소 완료 처리</div>
          <p className="mb-2 text-xs text-gray-500 dark:text-gray-400">
            완료 사진을 첨부해야 검수대기 상태로 전환됩니다.
          </p>
          <input
            type="file"
            accept="image/*"
            onChange={handlePhotoChange}
            className="block text-xs"
          />
          {photoUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={photoUrl}
              alt="완료 사진 미리보기"
              className="mt-2 h-24 w-24 rounded object-cover"
            />
          )}
          <button
            disabled={!photoUrl || pending}
            onClick={() => patchStatus("inspection")}
            className="mt-3 rounded bg-foreground px-3 py-1.5 text-sm text-background disabled:opacity-40"
          >
            완료 처리
          </button>
        </div>
      )}

      {status === "inspection" && (
        <div>
          <div className="mb-2 text-sm font-medium">담당자 확인</div>
          {photoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={photoUrl}
              alt="완료 사진"
              className="h-24 w-24 rounded object-cover"
            />
          ) : (
            <p className="text-xs text-gray-500 dark:text-gray-400">
              첨부된 사진이 없습니다.
            </p>
          )}

          <div className="mt-3 flex flex-wrap items-center gap-2">
            <select
              className="rounded border border-black/10 bg-transparent px-3 py-1.5 text-sm dark:border-white/10"
              value={selectedManager}
              onChange={(e) => setSelectedManager(e.target.value)}
            >
              <option value="">담당자 선택</option>
              {managers.map((m) => (
                <option key={m.id} value={m.name}>
                  {m.name}
                </option>
              ))}
            </select>
            <button
              disabled={!selectedManager || selectedManager === managerName}
              onClick={() => onManagerChange(selectedManager)}
              className="rounded bg-foreground px-3 py-1.5 text-sm text-background disabled:opacity-40"
            >
              담당자 변경
            </button>
          </div>
          <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
            담당자: {managerName ?? "미배정"}
          </p>

          <button
            disabled={!managerName || pending}
            onClick={() => patchStatus("done")}
            className="mt-3 rounded bg-foreground px-3 py-1.5 text-sm text-background disabled:opacity-40"
          >
            확인 완료
          </button>
        </div>
      )}

      {error && <p className="text-xs text-red-600 dark:text-red-400">{error}</p>}
    </>
  );
}
