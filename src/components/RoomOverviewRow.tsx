import Link from "next/link";
import { Badge, type Tone } from "@/components/Badge";
import { RoomStatusBadge } from "@/components/StatusBadges";
import { CopyButton } from "@/components/CopyButton";
import { ArrowRightIcon, IssueIcon } from "@/components/icons";
import { CLEANING_STATUS_LABEL } from "@/lib/labels";
import {
  formatDateTimeWithDay,
  formatDDay,
  formatDuration,
  minutesUntil,
} from "@/lib/format";
import type { RoomOverviewItem } from "@/lib/queries";

export function RoomOverviewRow({ item }: { item: RoomOverviewItem }) {
  const { room, task, displayStatus, openIssueCount } = item;
  const info = buildRowInfo(item);

  return (
    <Link
      href={`/rooms/${room.id}`}
      className="flex items-center gap-4 px-4 py-3.5 transition-colors hover:bg-black/[0.02] dark:hover:bg-white/[0.025]"
    >
      <div className="flex w-24 shrink-0 flex-col items-start gap-1.5">
        <span className="font-medium whitespace-nowrap">{room.room_number}호</span>
        <RoomStatusBadge status={displayStatus} />
      </div>

      <div className="min-w-0 flex-1">
        <div className="truncate text-sm font-medium">{info.primary}</div>
        {info.phone && (
          <div className="mt-1 flex items-center gap-1 text-xs text-subtext">
            {info.phone}
            <CopyButton value={info.phone} />
          </div>
        )}
      </div>

      <div className="hidden w-64 shrink-0 flex-col items-start gap-1.5 sm:flex">
        {info.dateRange && (
          <span className="text-xs whitespace-nowrap text-subtext">{info.dateRange}</span>
        )}
        {info.badge && <Badge tone={info.badge.tone}>{info.badge.label}</Badge>}
      </div>

      <div className="hidden w-36 shrink-0 flex-col items-end gap-1 text-right lg:flex">
        {info.taskNote && <span className="text-xs text-subtext">{info.taskNote}</span>}
        <span className="text-xs font-medium">
          {info.assignee ? `담당 ${info.assignee}` : task ? "미배정" : "-"}
        </span>
      </div>

      {openIssueCount > 0 && (
        <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-danger-bg px-2 py-0.5 text-[11px] font-medium whitespace-nowrap text-danger-text">
          <IssueIcon className="h-3 w-3" />
          이슈 {openIssueCount}건
        </span>
      )}

      <ArrowRightIcon className="h-4 w-4 shrink-0 text-subtext" />
    </Link>
  );
}

type RowInfo = {
  primary: string;
  phone?: string | null;
  dateRange?: string | null;
  badge?: { label: string; tone: Tone } | null;
  taskNote?: string | null;
  assignee?: string | null;
};

function buildRowInfo(item: RoomOverviewItem): RowInfo {
  const { room, task, displayStatus } = item;

  switch (displayStatus) {
    case "occupied": {
      const mins = minutesUntil(room.checkout_at);
      return {
        primary: guestLabel(room),
        phone: room.guest_phone,
        dateRange: `${formatDateTimeWithDay(room.next_checkin_at)} → ${formatDateTimeWithDay(
          room.checkout_at
        )}`,
        badge: room.checkout_at
          ? {
              label: `퇴실 ${formatDDay(room.checkout_at)}`,
              tone: mins !== null && mins <= 0 ? "danger" : mins !== null && mins <= 1440 ? "warning" : "neutral",
            }
          : null,
      };
    }

    case "checkin_due": {
      const mins = minutesUntil(room.next_checkin_at);
      return {
        primary: guestLabel(room),
        phone: room.guest_phone,
        dateRange: `${formatDateTimeWithDay(room.next_checkin_at)} 체크인`,
        badge:
          mins !== null
            ? { label: `남은 시간 ${formatDuration(Math.max(mins, 0))}`, tone: "info" }
            : null,
        taskNote: task ? (task.status === "done" ? "청소 완료 · 검수 완료" : CLEANING_STATUS_LABEL[task.status]) : null,
        assignee: task?.assignee?.name ?? null,
      };
    }

    case "dirty": {
      const mins = minutesUntil(room.checkout_at);
      return {
        primary: "체크아웃 완료",
        badge:
          mins !== null
            ? { label: `경과 ${formatDuration(Math.abs(mins))}`, tone: "warning" }
            : null,
        assignee: task?.assignee?.name ?? null,
      };
    }

    case "cleaning":
    case "inspection":
      return {
        primary: task ? CLEANING_STATUS_LABEL[task.status] : "청소 진행 중",
        assignee: task?.assignee?.name ?? null,
      };

    case "blocked":
      return {
        primary: room.operation_note ?? "판매 중지",
        badge: { label: "점검 중", tone: "danger" },
      };

    case "ready":
    default:
      return {
        primary: room.next_checkin_at
          ? `다음 입실 ${formatDateTimeWithDay(room.next_checkin_at)}`
          : "다음 예약 없음",
        badge: { label: "바로 배정 가능", tone: "success" },
        assignee: task?.assignee?.name ?? null,
      };
  }
}

function guestLabel(room: RoomOverviewItem["room"]): string {
  if (!room.guest_name) return "예약 정보 없음";
  if (room.guest_count && room.guest_count > 1) {
    return `${room.guest_name} 외 ${room.guest_count - 1}명`;
  }
  return room.guest_name;
}
