import Link from "next/link";
import type { ComponentType } from "react";
import { CheckCircleIcon } from "@/components/common/icons";

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
  active = false,
}: {
  icon: ComponentType<{ className?: string }>;
  tone: Tone;
  value: number;
  label: string;
  detail: string;
  href: string;
  active?: boolean;
}) {
  return (
    <Link
      href={href}
      aria-current={active ? "true" : undefined}
      className={`rounded-xl border p-4 transition-colors ${
        active
          ? "border-primary bg-primary/5 ring-2 ring-primary ring-offset-1 ring-offset-background"
          : "border-card-border bg-card hover:border-primary/40"
      }`}
    >
      <div className="flex items-center">
        <span
          className={`inline-flex h-9 w-9 items-center justify-center rounded-lg ${TONE_CLASSES[tone]}`}
        >
          <Icon className="h-4.5 w-4.5 rounded-full" />
        </span>
        <div className="mt-0.5 ml-3 flex items-center gap-1.5 text-sm font-semibold">
          {label}
          {active && (
            <CheckCircleIcon className="h-3.5 w-3.5 shrink-0 text-primary" />
          )}
        </div>
      </div>

      <div className="mt-3 text-2xl font-semibold">{value}</div>

      <div className="mt-0.5 text-xs text-subtext">{detail}</div>
    </Link>
  );
}
