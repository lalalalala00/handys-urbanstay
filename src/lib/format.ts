export function formatDateTime(iso: string | null): string {
  if (!iso) return "-";
  return new Date(iso).toLocaleString("ko-KR", {
    month: "numeric",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
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
  });
}

export function isToday(iso: string | null): boolean {
  if (!iso) return false;
  const d = new Date(iso);
  const now = new Date();
  return (
    d.getUTCFullYear() === now.getUTCFullYear() &&
    d.getUTCMonth() === now.getUTCMonth() &&
    d.getUTCDate() === now.getUTCDate()
  );
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
  return date.toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit" });
}

export function formatDateHeader(date: Date): string {
  return date.toLocaleDateString("ko-KR", {
    year: "numeric",
    month: "long",
    day: "numeric",
    weekday: "short",
  });
}

export function formatDuration(minutes: number): string {
  const abs = Math.round(Math.abs(minutes));
  const hours = Math.floor(abs / 60);
  const mins = abs % 60;
  if (hours === 0) return `${mins}분`;
  if (mins === 0) return `${hours}시간`;
  return `${hours}시간 ${mins}분`;
}
