import { Suspense } from "react";
import Link from "next/link";
import { getOpenAlertsCount } from "@/lib/queries";
import { BellIcon, ChevronDownIcon, LocationIcon } from "./icons";
import { RegionSelector } from "./RegionSelector";

export function Header() {
  return (
    <header className="flex h-16 shrink-0 items-center justify-between border-b border-card-border bg-card px-4 sm:px-6">
      <span className="text-sm font-semibold tracking-tight">
        <span className="sm:hidden">handys</span>
        <span className="hidden sm:inline">Handys Stay Operations</span>
      </span>

      <div className="flex min-w-0 items-center gap-2 sm:gap-4">
        <Suspense fallback={<RegionSelectorFallback />}>
          <RegionSelector />
        </Suspense>

        <Link
          href="/issues"
          className="relative flex h-9 w-9 items-center justify-center rounded-full border border-card-border text-foreground/70 transition-colors hover:border-primary/40"
        >
          <span className="sr-only">미처리 운영 이슈 보기</span>
          <BellIcon className="h-4.5 w-4.5" aria-hidden="true" />
          <Suspense fallback={null}>
            <AlertBadge />
          </Suspense>
        </Link>

        <div
          className="hidden items-center gap-2 rounded-lg py-1 pl-1 pr-2 sm:flex"
        >
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-sage text-xs font-semibold text-primary-hover">
            운영
          </span>
          <span className="text-left leading-tight">
            <span className="block text-xs font-medium">운영자</span>
            <span className="block text-[11px] text-subtext">핸디즈 운영팀</span>
          </span>
          <ChevronDownIcon className="h-3.5 w-3.5 text-subtext" />
        </div>
      </div>
    </header>
  );
}

async function AlertBadge() {
  const alertsCount = await getOpenAlertsCount();
  if (alertsCount === 0) return null;
  return (
    <span className="absolute -right-1 -top-1 flex h-4.5 min-w-4.5 items-center justify-center rounded-full bg-danger-text px-1 text-[10px] font-semibold text-white">
      {alertsCount}
    </span>
  );
}

function RegionSelectorFallback() {
  return (
    <div className="flex max-w-36 items-center gap-1.5 rounded-lg border border-card-border px-3 py-1.5 text-sm text-foreground/80 sm:max-w-none">
      <LocationIcon className="h-3.5 w-3.5 text-subtext" />
      <span className="truncate">전체 지역</span>
      <ChevronDownIcon className="h-3.5 w-3.5 text-subtext" />
    </div>
  );
}
