"use client";

import { useState } from "react";
import { SelectWithButton } from "@/components/common/SelectWithButton";
import { useToast } from "@/components/common/Toast";
import type { Staff } from "@/lib/types";

export function IssueManagerAssignment({
  managers,
  defaultManager,
  managerName,
  onManagerChange,
}: {
  managers: Staff[];
  defaultManager: Staff | null;
  managerName: string | null;
  onManagerChange: (name: string) => void;
}) {
  const showToast = useToast();
  const [selectedManager, setSelectedManager] = useState("");

  function changeManager() {
    onManagerChange(selectedManager);
    showToast("담당자가 변경되었습니다.");
    setSelectedManager("");
  }

  const isDefaultManager = managerName && managerName === defaultManager?.name;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between rounded-lg border border-black/10 bg-black/[0.02] px-3 py-3 dark:border-white/10 dark:bg-white/[0.03]">
        <div>
          <div className="text-[11px] text-gray-500 dark:text-gray-400">
            현재 담당자
          </div>

          <div className="mt-1 text-sm font-semibold">
            {managerName ?? "담당자 미배정"}
          </div>
        </div>

        {isDefaultManager && (
          <span className="rounded-full bg-blue-50 px-2.5 py-1 text-[11px] font-medium text-blue-600 dark:bg-blue-950/40 dark:text-blue-300">
            지점 기본
          </span>
        )}
      </div>

      <SelectWithButton
        value={selectedManager}
        onChange={setSelectedManager}
        options={managers.map((manager) => ({
          value: manager.name,
          label:
            manager.name === defaultManager?.name
              ? `${manager.name} · 지점 기본`
              : manager.name,
        }))}
        placeholder="변경할 담당자를 선택하세요"
        buttonLabel="변경"
        onSubmit={changeManager}
        disabled={!selectedManager || selectedManager === managerName}
      />
    </div>
  );
}
