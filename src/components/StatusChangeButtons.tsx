export function StatusChangeButtons<T extends string>({
  current,
  allowedNext,
  labelMap,
  onSelect,
  pending,
}: {
  current: T;
  allowedNext: T[];
  labelMap: Record<T, string>;
  onSelect: (next: T) => void;
  pending: boolean;
}) {
  if (allowedNext.length === 0) {
    return (
      <p className="text-xs text-gray-500 dark:text-gray-400">
        더 이상 변경할 수 있는 상태가 없습니다.
      </p>
    );
  }

  return (
    <div className="flex flex-wrap gap-2">
      {allowedNext.map((next) => (
        <button
          key={next}
          disabled={pending}
          onClick={() => onSelect(next)}
          className="rounded border border-black/10 px-3 py-1.5 text-sm hover:bg-black/3 disabled:opacity-40 dark:border-white/10 dark:hover:bg-white/5"
        >
          {labelMap[current]} → {labelMap[next]}
        </button>
      ))}
    </div>
  );
}
