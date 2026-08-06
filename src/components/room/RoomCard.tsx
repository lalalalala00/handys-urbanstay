import Link from "next/link";
import { Badge } from "@/components/common/Badge";
import { RoomStatusBadge } from "@/components/common/StatusBadges";
import { CopyButton } from "@/components/common/CopyButton";
import { IssueIcon } from "@/components/common/icons";
import { buildRoomOverviewInfo } from "@/lib/roomOverviewInfo";
import type { RoomOverviewItem } from "@/lib/queries";

export function RoomCard({ item }: { item: RoomOverviewItem }) {
  const { room, task, displayStatus, openIssueCount } = item;
  const info = buildRoomOverviewInfo(item);
  const assigneeLine = task?.assignee?.name
    ? `담당 ${task.assignee.name}`
    : task
      ? "미배정"
      : null;

  return (
    <Link
      href={`/rooms/${room.id}`}
      className="flex flex-col gap-2.5 rounded-xl border border-card-border bg-card p-3.5 transition-colors hover:border-primary/40"
    >
      <div className="flex items-center justify-between gap-2">
        <span className="flex items-center gap-1.5 text-sm font-semibold whitespace-nowrap">
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

      <div className="min-w-0">
        <span className="block truncate text-sm font-medium">{info.primary}</span>
        {info.phone && (
          <span className="mt-0.5 flex items-center gap-1 text-xs text-subtext">
            {info.phone}
            <CopyButton value={info.phone} />
          </span>
        )}
      </div>

      {openIssueCount > 0 && (
        <span className="inline-flex w-fit items-center gap-1 rounded-full bg-danger-bg px-2 py-0.5 text-[11px] font-medium whitespace-nowrap text-danger-text">
          <IssueIcon className="h-3 w-3" />
          이슈 {openIssueCount}건
        </span>
      )}

      <div className="mt-auto flex flex-col items-start gap-1.5 border-t border-card-border pt-2.5">
        <span className="w-full truncate text-xs text-subtext">{info.scheduleLine}</span>
        <Badge tone={info.badge.tone}>{info.badge.label}</Badge>
      </div>

      {assigneeLine && (
        <span className="truncate text-xs text-foreground/70">{assigneeLine}</span>
      )}
    </Link>
  );
}
