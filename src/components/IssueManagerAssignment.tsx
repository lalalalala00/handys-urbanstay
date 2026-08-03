"use client";

import { useState } from "react";
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
  const [selectedManager, setSelectedManager] = useState("");

  return (
    <div>
      <div className="mb-2 text-sm font-medium">
        담당자{" "}
        <span className="font-normal text-gray-500 dark:text-gray-400">(지점 담당)</span>
      </div>
      <p className="text-xs text-gray-500 dark:text-gray-400">
        {managerName ?? "미배정"}
        {managerName && managerName === defaultManager?.name && " (지점 기본 담당자)"}
      </p>
      <div className="mt-2 flex flex-wrap items-center gap-2">
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
    </div>
  );
}
