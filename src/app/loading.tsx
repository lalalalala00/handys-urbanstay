const KPI_CARDS = Array.from({ length: 5 });
const WORK_CARDS = Array.from({ length: 4 });
const TABLE_ROWS = Array.from({ length: 5 });

export default function Loading() {
  return (
    <div className="mx-auto flex w-full max-w-[1480px] animate-pulse flex-col gap-7" aria-label="운영 현황 불러오는 중">
      <div className="flex items-end justify-between">
        <div>
          <div className="h-6 w-44 rounded bg-black/10" />
          <div className="mt-2 h-4 w-72 rounded bg-black/5" />
        </div>
        <div className="h-9 w-24 rounded-lg bg-black/5" />
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-5">
        {KPI_CARDS.map((_, index) => (
          <div key={index} className="h-32 rounded-xl border border-card-border bg-card" />
        ))}
      </div>

      <section>
        <div className="mb-3 h-5 w-36 rounded bg-black/10" />
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {WORK_CARDS.map((_, index) => (
            <div key={index} className="h-48 rounded-2xl border border-card-border bg-card" />
          ))}
        </div>
      </section>

      {[0, 1].map((table) => (
        <section key={table}>
          <div className="mb-3 h-5 w-28 rounded bg-black/10" />
          <div className="overflow-hidden rounded-xl border border-card-border bg-card">
            {TABLE_ROWS.map((_, row) => (
              <div key={row} className="grid h-12 grid-cols-4 items-center gap-8 border-t border-card-border px-4 first:border-t-0">
                <span className="h-3 rounded bg-black/10" />
                <span className="h-3 rounded bg-black/5" />
                <span className="h-3 rounded bg-black/5" />
                <span className="h-3 rounded bg-black/5" />
              </div>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
