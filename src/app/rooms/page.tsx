import Link from "next/link";
import type { ComponentType } from "react";
import { getRoomsOverview, type RoomOverviewItem } from "@/lib/queries";
import { RoomCard } from "@/components/room/RoomCard";
import { RoomListRow } from "@/components/room/RoomListRow";
import { StatCard } from "@/components/dashboard/StatCard";
import { ROOM_DISPLAY_STATUS_LABEL } from "@/lib/labels";
import { addressForBranch } from "@/lib/regions";
import { calcRoomPriority } from "@/lib/priority";
import {
  CheckCircleIcon,
  ChevronDownIcon,
  CleaningIcon,
  ClockIcon,
  GridIcon,
  ListIcon,
  LockIcon,
  RoomIcon,
} from "@/components/common/icons";
import type { RoomDisplayStatus } from "@/lib/roomDisplayStatus";

export const dynamic = "force-dynamic";

type ViewMode = "card" | "list";

export default async function RoomsOverviewPage({
  searchParams,
}: {
  searchParams: Promise<{
    branch?: string;
    region?: string;
    status?: string;
    view?: string;
  }>;
}) {
  const { branch, region, status, view } = await searchParams;

  const { items, summary } = await getRoomsOverview({ branch, region });

  const activeStatus = isRoomDisplayStatus(status) ? status : undefined;
  const isNormalFilter = status === "normal";
  const viewMode: ViewMode = view === "list" ? "list" : "card";

  const filteredItems = activeStatus
    ? items.filter((item) => item.displayStatus === activeStatus)
    : isNormalFilter
      ? items.filter(isOperationallyNormal)
      : items;

  const baseParams = new URLSearchParams();
  if (branch) baseParams.set("branch", branch);
  if (region) baseParams.set("region", region);

  function hrefForStatus(next: RoomDisplayStatus) {
    const params = new URLSearchParams(baseParams);
    if (activeStatus !== next) {
      params.set("status", next);
    }
    if (view) params.set("view", view);
    return `/rooms?${params.toString()}`;
  }

  function hrefForView(next: ViewMode) {
    const params = new URLSearchParams(baseParams);
    if (status) params.set("status", status);
    if (next !== "card") params.set("view", next);
    return `/rooms${params.toString() ? `?${params.toString()}` : ""}`;
  }

  const groups = groupByBranch(filteredItems);

  return (
    <div className="flex flex-col gap-5">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-lg font-semibold">객실 현황</h1>
          <p className="mt-1 text-xs text-subtext">
            투숙·청소·판매 상태를 조합한 객실별 현재 상태입니다.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-0.5 rounded-lg border border-card-border bg-card p-1">
            <ViewToggleButton
              href={hrefForView("card")}
              active={viewMode === "card"}
              label="카드형으로 보기"
              icon={GridIcon}
            />
            <ViewToggleButton
              href={hrefForView("list")}
              active={viewMode === "list"}
              label="목록형으로 보기"
              icon={ListIcon}
            />
          </div>

          <Link
            href="/properties/new"
            className="flex h-9 items-center justify-center rounded-lg bg-foreground px-4 text-sm font-medium text-background transition hover:opacity-90"
          >
            숙소 등록
          </Link>
        </div>
      </header>

      <section className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        <StatCard
          icon={RoomIcon}
          tone="neutral"
          value={summary.occupied}
          label="투숙 중"
          detail="현재 게스트가 있는 객실"
          href={hrefForStatus("occupied")}
          active={activeStatus === "occupied"}
        />
        <StatCard
          icon={ClockIcon}
          tone="info"
          value={summary.checkinDue}
          label="입실 예정"
          detail="오늘 체크인 예정"
          href={hrefForStatus("checkin_due")}
          active={activeStatus === "checkin_due"}
        />
        <StatCard
          icon={CleaningIcon}
          tone="warning"
          value={summary.needsCleaning}
          label="청소 필요"
          detail="체크아웃 후 작업 대기"
          href={hrefForStatus("dirty")}
          active={activeStatus === "dirty"}
        />
        <StatCard
          icon={CheckCircleIcon}
          tone="success"
          value={summary.ready}
          label="입실 가능"
          detail="청소·검수 완료"
          href={hrefForStatus("ready")}
          active={activeStatus === "ready"}
        />
        <StatCard
          icon={LockIcon}
          tone="danger"
          value={summary.blocked}
          label="판매 중지"
          detail="운영 불가능한 객실"
          href={hrefForStatus("blocked")}
          active={activeStatus === "blocked"}
        />
      </section>

      <section className="flex flex-col gap-5">
        {groups.map(([branchName, branchItems]) => (
          <details
            key={branchName}
            open
            className="group overflow-hidden rounded-xl border border-card-border bg-card"
          >
            <summary className="flex cursor-pointer list-none items-center justify-between gap-3 border-b border-card-border px-4 py-3">
              <div>
                <h2 className="text-sm font-semibold">{branchName}</h2>
                <p className="mt-0.5 text-xs text-subtext">
                  {addressForBranch(branchName) ?? `${branchItems.length}개 객실`}
                </p>
              </div>

              <div className="flex shrink-0 items-center gap-2 text-xs text-subtext">
                <span>{branchItems.length}개 객실</span>
                <ChevronDownIcon className="h-4 w-4 transition-transform group-open:rotate-180" />
              </div>
            </summary>

            {viewMode === "card" ? (
              <div className="flex flex-col gap-4 p-4">
                {groupByFloor(branchItems).map(([floor, floorItems]) => (
                  <div key={floor} className="flex flex-col gap-2.5">
                    <h3 className="text-xs font-semibold text-subtext">{floor}층</h3>
                    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
                      {floorItems.map((item) => (
                        <RoomCard key={item.room.id} item={item} />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div>
                {groupByFloor(branchItems).map(([floor, floorItems]) => (
                  <div key={floor}>
                    <h3 className="border-t border-card-border bg-black/1.5 px-4 py-1.5 text-xs font-semibold text-subtext first:border-t-0 dark:bg-white/2">
                      {floor}층
                    </h3>
                    <ul>
                      {floorItems.map((item) => (
                        <li key={item.room.id} className="border-t border-card-border">
                          <RoomListRow item={item} />
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            )}
          </details>
        ))}

        {groups.length === 0 && (
          <div className="flex min-h-48 flex-col items-center justify-center rounded-xl border border-card-border bg-card px-4 py-8 text-center">
            <p className="text-sm font-medium">
              {activeStatus
                ? `${ROOM_DISPLAY_STATUS_LABEL[activeStatus]} 상태의 객실이 없습니다.`
                : isNormalFilter
                  ? "정상 운영 중인 객실이 없습니다."
                  : "조건에 맞는 객실이 없습니다."}
            </p>
          </div>
        )}
      </section>
    </div>
  );
}

function ViewToggleButton({
  href,
  active,
  label,
  icon: Icon,
}: {
  href: string;
  active: boolean;
  label: string;
  icon: ComponentType<{ className?: string }>;
}) {
  return (
    <Link
      href={href}
      aria-label={label}
      aria-current={active ? "page" : undefined}
      className={`flex h-7 w-7 items-center justify-center rounded-md transition-colors ${
        active
          ? "bg-foreground text-background"
          : "text-subtext hover:bg-black/[0.035] hover:text-foreground dark:hover:bg-white/6"
      }`}
    >
      <Icon className="h-4 w-4" />
    </Link>
  );
}

function isRoomDisplayStatus(value: string | undefined): value is RoomDisplayStatus {
  return (
    value === "occupied" ||
    value === "dirty" ||
    value === "checkin_due" ||
    value === "ready" ||
    value === "blocked"
  );
}

function isOperationallyNormal(item: RoomOverviewItem) {
  const priority = calcRoomPriority(item.room, item.task ?? undefined);
  return (
    item.room.operation_status !== "blocked" &&
    item.openIssueCount === 0 &&
    item.task?.status !== "unassigned" &&
    item.task?.status !== "inspection" &&
    priority.riskLevel !== "urgent" &&
    priority.riskLevel !== "warning"
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

// Standard hotel numbering: all but the last two digits of the room number
// are the floor (1205 -> 12층, 802 -> 8층).
function floorForRoom(roomNumber: string): number {
  const digits = roomNumber.replace(/\D/g, "");
  const floorDigits = digits.slice(0, Math.max(digits.length - 2, 1));
  return Number(floorDigits) || 0;
}

function groupByFloor(items: RoomOverviewItem[]): [number, RoomOverviewItem[]][] {
  const groups = new Map<number, RoomOverviewItem[]>();
  for (const item of items) {
    const floor = floorForRoom(item.room.room_number);
    const list = groups.get(floor) ?? [];
    list.push(item);
    groups.set(floor, list);
  }
  return Array.from(groups.entries())
    .sort(([a], [b]) => b - a)
    .map(([floor, floorItems]) => [
      floor,
      [...floorItems].sort((a, b) => a.room.room_number.localeCompare(b.room.room_number)),
    ]);
}
