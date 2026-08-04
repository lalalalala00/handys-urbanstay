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

  const forward = allowedNext.filter(
    (next) => steps.indexOf(next) > currentIndex
  );

  const backward = allowedNext.filter(
    (next) => steps.indexOf(next) < currentIndex
  );

  const [showBackward, setShowBackward] = useState(false);

  if (allowedNext.length === 0) {
    return (
      <p className="rounded-lg border border-dashed border-black/10 px-3 py-3 text-xs text-gray-500 dark:border-white/10 dark:text-gray-400">
        더 이상 변경할 수 있는 상태가 없습니다.
      </p>
    );
  }

  const primaryNext = forward[0];
  const secondaryForward = forward.slice(1);

  return (
    <div className="flex flex-col gap-3">
      {primaryNext && (
        <button
          type="button"
          disabled={pending}
          onClick={() => onSelect(primaryNext)}
          className="h-10 w-full rounded-lg bg-foreground px-4 text-sm font-medium text-background transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
        >
          {pending ? "변경 중..." : `${labelMap[primaryNext]} 상태로 변경`}
        </button>
      )}

      {secondaryForward.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {secondaryForward.map((next) => (
            <button
              key={next}
              type="button"
              disabled={pending}
              onClick={() => onSelect(next)}
              className="rounded-lg border border-black/10 px-3 py-2 text-xs font-medium transition hover:bg-black/[0.03] disabled:opacity-40 dark:border-white/10 dark:hover:bg-white/5"
            >
              {labelMap[next]}
            </button>
          ))}
        </div>
      )}

      {backward.length === 1 && (
        <button
          type="button"
          disabled={pending}
          onClick={() => onSelect(backward[0])}
          className="self-start text-xs font-medium text-gray-500 underline-offset-4 transition hover:text-foreground hover:underline disabled:opacity-40 dark:text-gray-400"
        >
          이전 상태인 ‘{labelMap[backward[0]]}’(으)로 되돌리기
        </button>
      )}

      {backward.length > 1 && (
        <div className="relative ">
          <button
            type="button"
            disabled={pending}
            onClick={() => setShowBackward((prev) => !prev)}
            className="text-xs font-medium  text-gray-500 underline-offset-4 transition hover:text-foreground hover:underline disabled:opacity-40 dark:text-gray-400"
          >
            이전 상태로 되돌리기
          </button>

          {showBackward && (
            <div className="mt-2 overflow-hidden rounded-lg border border-black/10 bg-background shadow-lg dark:border-white/10">
              {backward.map((next) => (
                <button
                  key={next}
                  type="button"
                  disabled={pending}
                  onClick={() => {
                    setShowBackward(false);
                    onSelect(next);
                  }}
                  className="flex w-full items-center px-3 py-2.5 text-left text-sm transition hover:bg-black/[0.03] disabled:opacity-40 dark:hover:bg-white/5"
                >
                  {labelMap[next]}
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
