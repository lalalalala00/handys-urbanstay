const STAT_CARDS = Array.from({ length: 5 });
const BRANCH_GROUPS = Array.from({ length: 2 });
const ROOM_ROWS = Array.from({ length: 3 });

export default function Loading() {
  return (
    <div className="flex animate-pulse flex-col gap-5" aria-label="객실 현황 불러오는 중">
      <div>
        <div className="h-5 w-24 rounded bg-black/10" />
        <div className="mt-2 h-3.5 w-64 rounded bg-black/5" />
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        {STAT_CARDS.map((_, index) => (
          <div key={index} className="h-28 rounded-xl border border-card-border bg-card" />
        ))}
      </div>

      <div className="flex flex-col gap-5">
        {BRANCH_GROUPS.map((_, groupIndex) => (
          <div
            key={groupIndex}
            className="overflow-hidden rounded-xl border border-card-border bg-card"
          >
            <div className="flex items-center justify-between border-b border-card-border px-4 py-3">
              <div>
                <div className="h-4 w-28 rounded bg-black/10" />
                <div className="mt-1.5 h-3 w-20 rounded bg-black/5" />
              </div>
              <div className="h-3 w-14 rounded bg-black/5" />
            </div>
            {ROOM_ROWS.map((_, rowIndex) => (
              <div
                key={rowIndex}
                className="flex items-center gap-4 border-t border-card-border px-4 py-3.5 first:border-t-0"
              >
                <div className="h-3.5 w-12 shrink-0 rounded bg-black/10" />
                <div className="h-3.5 flex-1 rounded bg-black/5" />
                <div className="hidden h-3.5 w-40 shrink-0 rounded bg-black/5 sm:block" />
                <div className="hidden h-3.5 w-20 shrink-0 rounded bg-black/5 lg:block" />
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
