"use client";

import { useState } from "react";

export function StatusChangeButtons<T extends string>({
  current,
  allowedNext,
  labelMap,
  steps,
  onSelect,
  pending,
}: {
  current: T;
  allowedNext: T[];
  labelMap: Record<T, string>;
  steps: T[];
  onSelect: (next: T) => void;
  pending: boolean;
}) {
  const currentIndex = steps.indexOf(current);
  const immediate = allowedNext.filter(
    (next) => Math.abs(steps.indexOf(next) - currentIndex) === 1
  );
  const skipAhead = allowedNext.filter(
    (next) => Math.abs(steps.indexOf(next) - currentIndex) !== 1
  );

  const [selected, setSelected] = useState("");

  if (allowedNext.length === 0) {
    return (
      <p className="text-xs text-gray-500 dark:text-gray-400">
        더 이상 변경할 수 있는 상태가 없습니다.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      {immediate.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {immediate.map((next) => (
            <button
              key={next}
              disabled={pending}
              onClick={() => onSelect(next)}
              className="rounded border border-black/10 px-3 py-1.5 text-sm hover:bg-black/3 disabled:opacity-40 dark:border-white/10 dark:hover:bg-white/5"
            >
              {labelMap[next]}
            </button>
          ))}
        </div>
      )}

      {skipAhead.length > 0 && (
        <div className="flex flex-wrap items-center gap-2">
          <select
            className="rounded border border-black/10 bg-transparent px-3 py-1.5 text-sm dark:border-white/10"
            value={selected}
            onChange={(e) => setSelected(e.target.value)}
          >
            <option value="">상태 선택</option>
            {skipAhead.map((next) => (
              <option key={next} value={next}>
                {labelMap[next]}
              </option>
            ))}
          </select>
          <button
            disabled={!selected || pending}
            onClick={() => onSelect(selected as T)}
            className="rounded border border-black/10 px-3 py-1.5 text-sm disabled:opacity-40 dark:border-white/10"
          >
            변경
          </button>
        </div>
      )}
    </div>
  );
}
