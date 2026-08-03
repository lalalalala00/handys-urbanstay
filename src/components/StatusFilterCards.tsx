import Link from "next/link";
import type { Tone } from "@/components/Badge";

const TONE_CARD_CLASSES: Record<Tone, string> = {
  neutral:
    "border-black/10 bg-black/3 text-foreground dark:border-white/10 dark:bg-white/5",
  info: "border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-900/40 dark:bg-blue-950/20 dark:text-blue-300",
  success:
    "border-green-200 bg-green-50 text-green-700 dark:border-green-900/40 dark:bg-green-950/20 dark:text-green-300",
  warning:
    "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900/40 dark:bg-amber-950/20 dark:text-amber-300",
  danger:
    "border-red-200 bg-red-50 text-red-700 dark:border-red-900/40 dark:bg-red-950/20 dark:text-red-300",
};

export function StatusFilterCards<T extends string>({
  groups,
  counts,
  activeStatus,
  hrefFor,
  gridClassName = "grid-cols-2 sm:grid-cols-5",
}: {
  groups: { status: T; label: string; tone: Tone }[];
  counts: Record<T, number>;
  activeStatus: T | undefined;
  hrefFor: (status: T | null) => string;
  gridClassName?: string;
}) {
  return (
    <div className={`grid gap-3 ${gridClassName}`}>
      {groups.map((group) => {
        const isActive = activeStatus === group.status;
        return (
          <Link
            key={group.status}
            href={hrefFor(isActive ? null : group.status)}
            className={`rounded-lg border p-4 transition-colors ${TONE_CARD_CLASSES[group.tone]} ${
              isActive ? "ring-2 ring-primary ring-offset-1 ring-offset-background" : ""
            }`}
          >
            <div className="text-2xl font-semibold">{counts[group.status] ?? 0}</div>
            <div className="mt-1 text-xs opacity-80">{group.label}</div>
          </Link>
        );
      })}
    </div>
  );
}
