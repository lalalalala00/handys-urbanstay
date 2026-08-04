import Link from "next/link";
import { getRoomsOverview, type RoomOverviewItem } from "@/lib/queries";
import { RoomStatusBadge } from "@/components/StatusBadges";
import { StatCard } from "@/components/dashboard/StatCard";
import { ROOM_DISPLAY_STATUS_LABEL } from "@/lib/labels";
import { formatDateTime, formatTime, isToday } from "@/lib/format";
import {
  CheckCircleIcon,
  CleaningIcon,
  ClockIcon,
  IssueIcon,
  LockIcon,
  RoomIcon,
} from "@/components/icons";
import type { RoomDisplayStatus } from "@/lib/roomDisplayStatus";

export const dynamic = "force-dynamic";

export default async function RoomsOverviewPage({
  searchParams,
}: {
  searchParams: Promise<{
    branch?: string;
    region?: string;
    status?: string;
    checkout?: string;
  }>;
}) {
  const { branch, region, status, checkout } = await searchParams;

  const { items, summary } = await getRoomsOverview({ branch, region });

  const activeStatus = isRoomDisplayStatus(status) ? status : undefined;
  const checkoutToday = checkout === "today";

  const filteredItems = activeStatus
    ? items.filter((item) => item.displayStatus === activeStatus)
    : checkoutToday
      ? items.filter((item) => isToday(item.room.checkout_at))
      : items;

  const baseParams = new URLSearchParams();
  if (branch) baseParams.set("branch", branch);
  if (region) baseParams.set("region", region);

  function hrefForStatus(next: RoomDisplayStatus) {
    const params = new URLSearchParams(baseParams);
    params.set("status", next);
    return `/rooms?${params.toString()}`;
  }

  function hrefForCheckoutToday() {
    const params = new URLSearchParams(baseParams);
    params.set("checkout", "today");
    return `/rooms?${params.toString()}`;
  }

  const groups = groupByBranch(filteredItems);

  return (
    <div className="flex flex-col gap-5">
      <header>
        <h1 className="text-lg font-semibold">객실 현황</h1>
        <p className="mt-1 text-xs text-subtext">
          투숙·청소·판매 상태를 조합한 객실별 현재 상태입니다.
        </p>
      </header>

      <section className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        <StatCard
          icon={RoomIcon}
          tone="neutral"
          value={summary.occupied}
          label="투숙 중"
          detail="현재 게스트가 있는 객실"
          href={hrefForStatus("occupied")}
        />
        <StatCard
          icon={ClockIcon}
          tone="info"
          value={summary.checkinDue}
          label="입실 예정"
          detail="오늘 체크인 예정"
          href={hrefForStatus("checkin_due")}
        />
        <StatCard
          icon={ClockIcon}
          tone="warning"
          value={summary.checkoutDue}
          label="퇴실 예정"
          detail="오늘 체크아웃 예정"
          href={hrefForCheckoutToday()}
        />
        <StatCard
          icon={CleaningIcon}
          tone="warning"
          value={summary.needsCleaning}
          label="청소 필요"
          detail="체크아웃 후 작업 대기"
          href={hrefForStatus("dirty")}
        />
        <StatCard
          icon={CheckCircleIcon}
          tone="success"
          value={summary.ready}
          label="입실 준비"
          detail="바로 배정 가능한 객실"
          href={hrefForStatus("ready")}
        />
        <StatCard
          icon={LockIcon}
          tone="danger"
          value={summary.blocked}
          label="판매 중지"
          detail="운영 불가능한 객실"
          href={hrefForStatus("blocked")}
        />
      </section>

      <section className="flex flex-col gap-5">
        {groups.map(([branchName, branchItems]) => (
          <div
            key={branchName}
            className="overflow-hidden rounded-xl border border-card-border bg-card"
          >
            <div className="border-b border-card-border px-4 py-3">
              <h2 className="text-sm font-semibold">{branchName}</h2>
              <p className="mt-0.5 text-xs text-subtext">{branchItems.length}개 객실</p>
            </div>

            <ul>
              {branchItems.map((item) => (
                <li key={item.room.id} className="border-t border-card-border first:border-t-0">
                  <Link
                    href={`/rooms/${item.room.id}`}
                    className="flex items-center justify-between gap-4 px-4 py-3 transition-colors hover:bg-black/[0.02] dark:hover:bg-white/[0.025]"
                  >
                    <div className="flex min-w-0 items-center gap-3">
                      <span className="font-medium whitespace-nowrap">
                        {item.room.room_number}호
                      </span>
                      <RoomStatusBadge status={item.displayStatus} />
                      {item.openIssueCount > 0 && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-danger-bg px-1.5 py-0.5 text-[10px] font-medium text-danger-text">
                          <IssueIcon className="h-3 w-3" />
                          이슈 {item.openIssueCount}
                        </span>
                      )}
                    </div>

                    <span className="truncate text-xs text-subtext">
                      {roomDetailLine(item)}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}

        {groups.length === 0 && (
          <div className="flex min-h-48 flex-col items-center justify-center rounded-xl border border-card-border bg-card px-4 py-8 text-center">
            <p className="text-sm font-medium">
              {activeStatus
                ? `${ROOM_DISPLAY_STATUS_LABEL[activeStatus]} 상태의 객실이 없습니다.`
                : "조건에 맞는 객실이 없습니다."}
            </p>
          </div>
        )}
      </section>
    </div>
  );
}

function isRoomDisplayStatus(value: string | undefined): value is RoomDisplayStatus {
  return (
    value === "occupied" ||
    value === "cleaning" ||
    value === "inspection" ||
    value === "dirty" ||
    value === "checkin_due" ||
    value === "ready" ||
    value === "blocked"
  );
}

function groupByBranch(items: RoomOverviewItem[]): [string, RoomOverviewItem[]][] {
  const groups = new Map<string, RoomOverviewItem[]>();
  for (const item of items) {
    const list = groups.get(item.room.branch) ?? [];
    list.push(item);
    groups.set(item.room.branch, list);
  }
  return Array.from(groups.entries());
}

function roomDetailLine(item: RoomOverviewItem): string {
  const { room, task, displayStatus } = item;

  switch (displayStatus) {
    case "occupied":
      return `퇴실 ${formatDateTime(room.checkout_at)}`;
    case "checkin_due":
      return room.next_checkin_at
        ? `입실 ${formatTime(new Date(room.next_checkin_at))} · ${
            task && task.status !== "done" ? "청소 필요" : "청소 완료"
          }`
        : "입실 예정";
    case "cleaning":
    case "inspection":
    case "dirty":
      return task?.assignee?.name ? `담당 ${task.assignee.name}` : "담당자 미배정";
    case "blocked":
      return room.operation_note ?? "판매 중지";
    case "ready":
    default:
      return room.next_checkin_at
        ? `다음 입실 ${formatDateTime(room.next_checkin_at)}`
        : "다음 예약 없음";
  }
}
