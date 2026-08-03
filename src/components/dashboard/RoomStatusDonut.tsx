type Distribution = {
  normal: number;
  urgent: number;
  inspection: number;
  assigned: number;
};

const SEGMENTS: { key: keyof Distribution; label: string; color: string }[] = [
  { key: "normal", label: "정상 운영", color: "var(--success-text)" },
  { key: "urgent", label: "즉시 처리", color: "var(--danger-text)" },
  { key: "inspection", label: "검수 대기", color: "var(--warning-text)" },
  { key: "assigned", label: "배정/진행", color: "var(--info-text)" },
];

const RADIUS = 42;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

export function RoomStatusDonut({
  distribution,
  total,
}: {
  distribution: Distribution;
  total: number;
}) {
  let offset = 0;

  return (
    <div className="flex items-center gap-6">
      <svg viewBox="0 0 100 100" className="h-32 w-32 shrink-0 -rotate-90">
        <circle
          cx="50"
          cy="50"
          r={RADIUS}
          fill="none"
          stroke="var(--card-border)"
          strokeWidth="12"
        />
        {total > 0 &&
          SEGMENTS.map((segment) => {
            const count = distribution[segment.key];
            if (count === 0) return null;
            const length = (count / total) * CIRCUMFERENCE;
            const dashoffset = -offset;
            offset += length;
            return (
              <circle
                key={segment.key}
                cx="50"
                cy="50"
                r={RADIUS}
                fill="none"
                stroke={segment.color}
                strokeWidth="12"
                strokeDasharray={`${length} ${CIRCUMFERENCE - length}`}
                strokeDashoffset={dashoffset}
              />
            );
          })}
        <text
          x="50"
          y="47"
          textAnchor="middle"
          className="rotate-90 fill-foreground text-[20px] font-semibold"
          style={{ transformOrigin: "50px 50px" }}
        >
          {total}
        </text>
        <text
          x="50"
          y="62"
          textAnchor="middle"
          className="rotate-90 fill-subtext text-[8px]"
          style={{ transformOrigin: "50px 50px" }}
        >
          전체 객실
        </text>
      </svg>

      <ul className="flex flex-col gap-2 text-sm">
        {SEGMENTS.map((segment) => (
          <li key={segment.key} className="flex items-center gap-2">
            <span
              className="h-2.5 w-2.5 shrink-0 rounded-full"
              style={{ backgroundColor: segment.color }}
            />
            <span className="text-foreground/80">{segment.label}</span>
            <span className="text-subtext">
              {distribution[segment.key]}
              {total > 0 &&
                ` (${Math.round((distribution[segment.key] / total) * 100)}%)`}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
