import Link from "next/link";
import { ArrowRightIcon } from "@/components/icons";

export interface CrewStatusItem {
  staff: {
    id: string;
    name: string;
  };
  working: boolean;
  activeCount: number;
  completedCount: number;
  branch: string | null;
}

export function CrewStatusCard({
  crew,
  href,
}: {
  crew: CrewStatusItem[];
  href: string;
}) {
  const maxActiveCount = Math.max(1, ...crew.map((item) => item.activeCount));

  return (
    <div className="rounded-xl border border-card-border bg-card p-4">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-sm font-semibold">오늘의 크루 현황</h2>

        <span className="text-xs text-subtext">전체 크루 {crew.length}명</span>
      </div>

      {crew.length > 0 ? (
        <ul className="flex flex-col gap-4">
          {crew.map((item) => (
            <CrewStatusRow
              key={item.staff.id}
              item={item}
              maxActiveCount={maxActiveCount}
            />
          ))}
        </ul>
      ) : (
        <div className="py-5 text-center text-sm text-subtext">
          등록된 크루가 없습니다.
        </div>
      )}

      <Link
        href={href}
        className="mt-4 flex items-center justify-end gap-1 text-xs font-medium text-subtext transition-colors hover:text-primary"
      >
        청소 작업 보기
        <ArrowRightIcon className="h-3.5 w-3.5" />
      </Link>
    </div>
  );
}

function CrewStatusRow({
  item,
  maxActiveCount,
}: {
  item: CrewStatusItem;
  maxActiveCount: number;
}) {
  const { staff, working, activeCount, completedCount, branch } = item;

  return (
    <li>
      <div className="flex items-start gap-2.5">
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-sand text-xs font-semibold text-brown">
          {staff.name.slice(-2)}
        </span>

        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-2">
            <span className="truncate text-sm font-medium">{staff.name}</span>

            <span
              className={[
                "shrink-0 rounded-full px-2 py-0.5 text-[10px] font-medium",
                working
                  ? "bg-info-bg text-info-text"
                  : "bg-black/5 text-foreground/60 dark:bg-white/10",
              ].join(" ")}
            >
              {working ? "작업 중" : "대기"}
            </span>
          </div>

          <p className="mt-0.5 truncate text-xs text-subtext ">
            진행 {activeCount}건
            <span className="mx-1 text-foreground/20">·</span>
            완료 {completedCount}건
          </p>

          <CrewWorkloadSlots count={activeCount} maxCount={maxActiveCount} />
        </div>
      </div>
    </li>
  );
}

const MAX_WORKLOAD_SLOTS = 5;

function CrewWorkloadSlots({
  count,
  maxCount,
}: {
  count: number;
  maxCount: number;
}) {
  const slotCount = Math.min(Math.max(maxCount, 1), MAX_WORKLOAD_SLOTS);
  const activeCount =
    maxCount > MAX_WORKLOAD_SLOTS
      ? Math.round(
          (Math.min(Math.max(count, 0), maxCount) / maxCount) * slotCount
        )
      : Math.min(Math.max(count, 0), slotCount);

  return (
    <div
      className="mt-2 grid gap-0.5"
      style={{
        gridTemplateColumns: `repeat(${slotCount}, minmax(0, 1fr))`,
      }}
      role="img"
      aria-label={`진행 중인 작업 ${count}건`}
    >
      {Array.from({ length: slotCount }).map((_, index) => {
        const isFirst = index === 0;
        const isLast = index === slotCount - 1;
        const rounding =
          isFirst && isLast
            ? "rounded-full"
            : isFirst
            ? "rounded-l-full"
            : isLast
            ? "rounded-r-full"
            : "";

        return (
          <span
            key={index}
            aria-hidden="true"
            className={[
              "h-1.5",
              rounding,
              index < activeCount
                ? "bg-primary"
                : "bg-black/5 dark:bg-white/10",
            ].join(" ")}
          />
        );
      })}
    </div>
  );
}
