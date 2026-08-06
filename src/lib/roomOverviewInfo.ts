import type { Tone } from "@/components/common/Badge";
import { CLEANING_STATUS_LABEL } from "@/lib/labels";
import { calcRoomPriority } from "@/lib/priority";
import { formatBuffer, formatDateTimeWithDay, formatRelative, minutesUntil } from "@/lib/format";
import type { RoomOverviewItem } from "@/lib/queries";

export type RoomOverviewInfo = {
  primary: string;
  phone?: string | null;
  scheduleLine: string;
  badge: { label: string; tone: Tone };
};

// Same buffer wording ("여유 X" / "X 지연") and the same danger→warning→success
// scale used everywhere else in the app (dashboard 청소 작업 table, priority
// sort), so every room's badge reads as one consistent system instead of a
// different phrase per status.
function bufferBadge(minutes: number | null): { label: string; tone: Tone } {
  const label = formatBuffer(minutes);
  if (minutes === null) return { label, tone: "neutral" };
  if (minutes < 0) return { label, tone: "danger" };
  if (minutes <= 60) return { label, tone: "warning" };
  return { label, tone: "success" };
}

export function buildRoomOverviewInfo(item: RoomOverviewItem): RoomOverviewInfo {
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
