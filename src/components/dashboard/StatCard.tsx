import Link from "next/link";
import type { ComponentType } from "react";

type Tone = "success" | "danger" | "warning" | "info" | "neutral";

const TONE_CLASSES: Record<Tone, string> = {
  success: "bg-success-bg text-success-text",
  danger: "bg-danger-bg text-danger-text",
  warning: "bg-warning-bg text-warning-text",
  info: "bg-info-bg text-info-text",
  neutral: "bg-black/5 text-foreground/70 dark:bg-white/10",
};

export function StatCard({
  icon: Icon,
  tone,
  value,
  label,
  detail,
  href,
}: {
  icon: ComponentType<{ className?: string }>;
  tone: Tone;
  value: number;
  label: string;
  detail: string;
  href: string;
}) {
  return (
    <Link
      href={href}
      className="rounded-xl border border-card-border bg-card p-4 transition-colors hover:border-primary/40"
    >
      <div className="flex items-center">
        <span
          className={`inline-flex h-9 w-9 items-center justify-center rounded-lg ${TONE_CLASSES[tone]}`}
        >
          <Icon className="h-4.5 w-4.5 rounded-full" />
        </span>
        <div className="mt-0.5 text-sm font-semibold ml-3">{label}</div>
      </div>

      <div className="mt-3 text-2xl font-semibold">{value}</div>

      <div className="mt-0.5 text-xs text-subtext">{detail}</div>
    </Link>
  );
}
