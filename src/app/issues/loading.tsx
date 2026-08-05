const TABS = Array.from({ length: 7 });
const TABLE_ROWS = Array.from({ length: 6 });

export default function Loading() {
  return (
    <div className="flex animate-pulse flex-col gap-5" aria-label="운영 이슈 불러오는 중">
      <div>
        <div className="h-5 w-24 rounded bg-black/10" />
        <div className="mt-2 h-3.5 w-64 rounded bg-black/5" />
      </div>

      <div className="overflow-x-auto rounded-xl border border-card-border bg-card p-1.5">
        <div className="flex min-w-max items-center gap-1.5">
          {TABS.map((_, index) => (
            <div key={index} className="h-9 w-20 rounded-lg bg-black/5" />
          ))}
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border border-card-border bg-card">
        <div className="flex items-center gap-8 border-b border-card-border px-4 py-3">
          <div className="h-3 w-16 rounded bg-black/10" />
          <div className="h-3 w-16 rounded bg-black/10" />
          <div className="h-3 w-24 rounded bg-black/10" />
          <div className="h-3 w-16 rounded bg-black/10" />
          <div className="h-3 w-16 rounded bg-black/10" />
        </div>
        {TABLE_ROWS.map((_, index) => (
          <div
            key={index}
            className="flex items-center gap-8 border-t border-card-border px-4 py-3.5 first:border-t-0"
          >
            <div className="h-3.5 w-28 rounded bg-black/5" />
            <div className="h-3.5 w-16 rounded bg-black/5" />
            <div className="h-3.5 w-48 rounded bg-black/5" />
            <div className="h-3.5 w-14 rounded bg-black/5" />
            <div className="h-3.5 w-16 rounded bg-black/5" />
          </div>
        ))}
      </div>
    </div>
  );
}
