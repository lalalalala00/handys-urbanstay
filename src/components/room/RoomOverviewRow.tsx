import Link from "next/link";
import { Badge, type Tone } from "@/components/common/Badge";
import { RoomStatusBadge } from "@/components/common/StatusBadges";
import { CopyButton } from "@/components/common/CopyButton";
import { IssueIcon } from "@/components/common/icons";
import { CLEANING_STATUS_LABEL } from "@/lib/labels";
import { calcRoomPriority } from "@/lib/priority";
import { formatBuffer, formatDateTimeWithDay, formatRelative, minutesUntil } from "@/lib/format";
import type { RoomOverviewItem } from "@/lib/queries";

export function RoomOverviewRow({ item }: { item: RoomOverviewItem }) {
  const { room, task, displayStatus, openIssueCount } = item;
  const info = buildRowInfo(item);
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

      <span className="hidden shrink-0 self-center whitespace-nowrap text-xs font-semibold text-primary sm:inline">
        객실 보기
      </span>
    </Link>
  );
}

type RowInfo = {
  primary: string;
  phone?: string | null;
  scheduleLine: string;
  badge: { label: string; tone: Tone };
};

// Same buffer wording ("여유 X" / "X 지연") and the same danger→warning→success
// scale used everywhere else in the app (dashboard 청소 작업 table, priority
// sort), so every row's badge reads as one consistent system instead of a
// different phrase per status.
function bufferBadge(minutes: number | null): { label: string; tone: Tone } {
  const label = formatBuffer(minutes);
  if (minutes === null) return { label, tone: "neutral" };
  if (minutes < 0) return { label, tone: "danger" };
  if (minutes <= 60) return { label, tone: "warning" };
  return { label, tone: "success" };
}

function buildRowInfo(item: RoomOverviewItem): RowInfo {
  const { room, task, displayStatus } = item;

  if (displayStatus === "blocked") {
    return {
      primary: room.operation_note ?? "판매 중지",
      scheduleLine: "-",
      badge: { label: "점검 중", tone: "danger" },
    };
  }

  if (displayStatus === "occupied") {
    return {
      primary: guestLabel(room),
      phone: room.guest_phone,
      scheduleLine: room.checkout_at
        ? `체크아웃 ${formatDateTimeWithDay(room.checkout_at)}`
        : "체크아웃 일정 없음",
      badge: bufferBadge(minutesUntil(room.checkout_at)),
    };
  }

  // Vacant rooms revolve around the same clock: time left until the next
  // check-in, minus any cleaning still owed.
  const priority = calcRoomPriority(room, task ?? undefined);
  const scheduleLine = room.next_checkin_at
    ? `체크인 ${formatDateTimeWithDay(room.next_checkin_at)}`
    : "체크인 일정 없음";
  const badge = bufferBadge(priority.bufferMinutes);

  switch (displayStatus) {
    case "checkin_due":
      return { primary: guestLabel(room), phone: room.guest_phone, scheduleLine, badge };
    case "dirty":
      return {
        primary: task
          ? `청소 · ${CLEANING_STATUS_LABEL[task.status]}`
          : "체크아웃 완료 · 청소 필요",
        scheduleLine,
        badge,
      };
    case "ready":
    default:
      return {
        primary: task?.completed_at
          ? `게시됨 · ${formatRelative(task.completed_at)}`
          : "예약 대기 중",
        scheduleLine,
        badge,
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
