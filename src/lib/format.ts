const OPERATIONS_TIME_ZONE = "Asia/Seoul";

function operationDateKey(date: Date): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: OPERATIONS_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

export function formatDateTime(iso: string | null): string {
  if (!iso) return "-";
  return new Date(iso).toLocaleString("ko-KR", {
    month: "numeric",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: OPERATIONS_TIME_ZONE,
  });
}

export function formatDateTimeWithDay(iso: string | null): string {
  if (!iso) return "-";
  return new Date(iso).toLocaleString("ko-KR", {
    month: "numeric",
    day: "numeric",
    weekday: "short",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: OPERATIONS_TIME_ZONE,
  });
}

export function isToday(iso: string | null): boolean {
  if (!iso) return false;
  return operationDateKey(new Date(iso)) === operationDateKey(new Date());
}

export function formatRelative(iso: string | null): string {
  if (!iso) return "-";
  const diffMinutes = Math.round(
    (new Date(iso).getTime() - Date.now()) / 60000
  );
  const abs = Math.abs(diffMinutes);
  const unit = abs < 60 ? `${abs}분` : `${Math.round(abs / 60)}시간`;
  return diffMinutes >= 0 ? `${unit} 후` : `${unit} 전`;
}

export function formatBuffer(minutes: number | null): string {
  if (minutes === null) return "-";
  if (minutes < 0) return `${formatDuration(minutes)} 지연`;
  return `여유 ${formatDuration(minutes)}`;
}

export function minutesUntil(iso: string | null): number | null {
  if (!iso) return null;
  return Math.round((new Date(iso).getTime() - Date.now()) / 60000);
}

export function formatTime(date: Date): string {
  return date.toLocaleTimeString("ko-KR", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: OPERATIONS_TIME_ZONE,
  });
}

export function formatDateHeader(date: Date): string {
  return date.toLocaleDateString("ko-KR", {
    year: "numeric",
    month: "long",
    day: "numeric",
    weekday: "short",
    timeZone: OPERATIONS_TIME_ZONE,
  });
}

export function relativeOperationDay(iso: string): string {
  const target = Date.parse(`${operationDateKey(new Date(iso))}T00:00:00Z`);
  const today = Date.parse(`${operationDateKey(new Date())}T00:00:00Z`);
  const diffDays = Math.round((target - today) / 86_400_000);
  if (diffDays === 0) return "오늘";
  if (diffDays === 1) return "내일";
  if (diffDays === -1) return "어제";
  return diffDays > 0 ? `${diffDays}일 후` : `${Math.abs(diffDays)}일 전`;
}

export function formatDDay(iso: string | null): string | null {
  if (!iso) return null;
  const target = Date.parse(`${operationDateKey(new Date(iso))}T00:00:00Z`);
  const today = Date.parse(`${operationDateKey(new Date())}T00:00:00Z`);
  const diffDays = Math.round((target - today) / 86_400_000);
  if (diffDays === 0) return "D-DAY";
  return diffDays > 0 ? `D-${diffDays}` : `D+${Math.abs(diffDays)}`;
}

// "김철수" / "김철수 외 2명" / "미배정" — same "이름 외 N명" convention used
// for guest counts, applied to a list of possibly-duplicate assignee names.
export function summarizeNames(names: (string | null | undefined)[]): string {
  const unique = Array.from(
    new Set(names.filter((name): name is string => Boolean(name)))
  );
  if (unique.length === 0) return "미배정";
  if (unique.length === 1) return unique[0];
  return `${unique[0]} 외 ${unique.length - 1}명`;
}

export function formatDuration(minutes: number): string {
  const abs = Math.round(Math.abs(minutes));
  const hours = Math.floor(abs / 60);
  const mins = abs % 60;
  if (hours === 0) return `${mins}분`;
  if (mins === 0) return `${hours}시간`;
  return `${hours}시간 ${mins}분`;
}
