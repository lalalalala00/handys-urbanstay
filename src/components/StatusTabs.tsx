import Link from "next/link";

interface StatusGroup<T extends string> {
  status: T;
  label: string;
  tone?: string;
}

const DOT_CLASSES: Record<string, string> = {
  gray: "bg-gray-400",
  blue: "bg-blue-500",
  amber: "bg-amber-500",
  yellow: "bg-amber-500",
  green: "bg-green-500",
  red: "bg-red-500",
  purple: "bg-purple-500",

  neutral: "bg-gray-400",
  info: "bg-blue-500",
  warning: "bg-amber-500",
  success: "bg-green-500",
  danger: "bg-red-500",
};

export function StatusTabs<T extends string>({
  groups,
  counts,
  totalCount,
  activeStatus,
  hrefFor,
  ariaLabel = "상태 필터",
}: {
  groups: StatusGroup<T>[];
  counts: Record<T, number>;
  totalCount: number;
  activeStatus?: T;
  hrefFor: (status: T | null) => string;
  ariaLabel?: string;
}) {
  return (
    <div className="overflow-x-auto rounded-xl border border-card-border bg-card p-1.5">
      <nav aria-label={ariaLabel} className="flex min-w-max items-center gap-1">
        <StatusTab
          href={hrefFor(null)}
          label="전체"
          count={totalCount}
          active={!activeStatus}
        />

        <span aria-hidden="true" className="mx-1 h-5 w-px bg-card-border" />

        {groups.map((group) => (
          <StatusTab
            key={group.status}
            href={hrefFor(group.status)}
            label={group.label}
            count={counts[group.status]}
            active={activeStatus === group.status}
            tone={group.tone}
          />
        ))}
      </nav>
    </div>
  );
}

function StatusTab({
  href,
  label,
  count,
  active,
  tone,
}: {
  href: string;
  label: string;
  count: number;
  active: boolean;
  tone?: string;
}) {
  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={[
        "flex h-9 items-center gap-2 rounded-lg px-3 text-xs font-medium transition-colors",
        active
          ? "bg-foreground text-background shadow-sm"
          : "text-subtext hover:bg-black/[0.035] hover:text-foreground dark:hover:bg-white/[0.06]",
      ].join(" ")}
    >
      {tone && !active && (
        <span
          aria-hidden="true"
          className={[
            "h-1.5 w-1.5 rounded-full",
            DOT_CLASSES[tone] ?? "bg-gray-400",
          ].join(" ")}
        />
      )}

      <span>{label}</span>

      <span
        className={[
          "flex min-w-5 items-center justify-center rounded-full px-1.5 py-0.5 text-[10px] tabular-nums",
          active
            ? "bg-background/15 text-background"
            : "bg-black/[0.045] text-subtext dark:bg-white/[0.08]",
        ].join(" ")}
      >
        {count}
      </span>
    </Link>
  );
}
