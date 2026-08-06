import Link from "next/link";
import { Badge } from "@/components/common/Badge";
import { RoomStatusBadge } from "@/components/common/StatusBadges";
import { CopyButton } from "@/components/common/CopyButton";
import { IssueIcon } from "@/components/common/icons";
import { buildRoomOverviewInfo } from "@/lib/roomOverviewInfo";
import type { RoomOverviewItem } from "@/lib/queries";

export function RoomListRow({ item }: { item: RoomOverviewItem }) {
  const { room, task, displayStatus, openIssueCount } = item;
  const info = buildRoomOverviewInfo(item);
  const assigneeLine = task?.assignee?.name
    ? `담당 ${task.assignee.name}`
    : task
      ? "미배정"
      : "-";

  return (
    <Link
      href={`/rooms/${room.id}`}
      className="flex items-start gap-4 px-4 py-3.5 transition-colors hover:bg-black/[0.02] dark:hover:bg-white/[0.025]"
    >
      <div className="flex w-24 shrink-0 flex-col items-start gap-1.5">
        <span className="flex items-center gap-1.5 font-medium whitespace-nowrap">
          <span
            aria-hidden="true"
            className={`h-1.5 w-1.5 shrink-0 rounded-full ${
              room.operation_status === "blocked" ? "bg-danger-text" : "bg-success-text"
            }`}
          />
          {room.room_number}호
        </span>
        <RoomStatusBadge status={displayStatus} />
      </div>

      <div className={`min-w-0 flex-1 ${openIssueCount > 0 ? "" : "self-center"}`}>
        <div className="flex items-center gap-1.5">
          <span className="truncate text-sm font-medium">{info.primary}</span>
          {info.phone && (
            <span className="flex shrink-0 items-center gap-1 text-xs text-subtext">
              · {info.phone}
              <CopyButton value={info.phone} />
            </span>
          )}
        </div>
        {openIssueCount > 0 && (
          <span className="mt-1.5 inline-flex items-center gap-1 rounded-full bg-danger-bg px-2 py-0.5 text-[11px] font-medium whitespace-nowrap text-danger-text">
            <IssueIcon className="h-3 w-3" />
            이슈 {openIssueCount}건
          </span>
        )}
      </div>

      <div className="hidden w-64 shrink-0 flex-col items-start gap-1.5 sm:flex">
        <span className="text-xs whitespace-nowrap text-subtext">{info.scheduleLine}</span>
        <Badge tone={info.badge.tone}>{info.badge.label}</Badge>
      </div>

      <div className="hidden w-36 shrink-0 items-center justify-end self-center text-right lg:flex">
        <span className="text-xs font-medium whitespace-nowrap">{assigneeLine}</span>
      </div>

    </Link>
  );
}
