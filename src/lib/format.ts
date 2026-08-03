export function formatDateTime(iso: string | null): string {
  if (!iso) return "-";
  return new Date(iso).toLocaleString("ko-KR", {
    month: "numeric",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
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
  if (minutes < 0) return `${Math.abs(minutes)}분 지연`;
  return `여유 ${minutes}분`;
}
