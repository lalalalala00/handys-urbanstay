import { getOpenAlertsCount } from "@/lib/queries";
import { BellIcon, ChevronDownIcon } from "./icons";
import { RegionSelector } from "./RegionSelector";

export async function Header() {
  const alertsCount = await getOpenAlertsCount();

  return (
    <header className="flex h-16 shrink-0 items-center justify-between border-b border-card-border bg-card px-6">
      <span className="text-sm font-semibold tracking-tight">
        Stay Operations Dashboard
      </span>

      <div className="flex items-center gap-4">
        <RegionSelector />

        <button
          type="button"
          className="relative flex h-9 w-9 items-center justify-center rounded-full border border-card-border text-foreground/70 transition-colors hover:border-primary/40"
          aria-label="알림"
        >
          <BellIcon className="h-4.5 w-4.5" />
          {alertsCount > 0 && (
            <span className="absolute -right-1 -top-1 flex h-4.5 min-w-4.5 items-center justify-center rounded-full bg-danger-text px-1 text-[10px] font-semibold text-white">
              {alertsCount}
            </span>
          )}
        </button>

        <button
          type="button"
          className="flex items-center gap-2 rounded-lg py-1 pl-1 pr-2 transition-colors hover:bg-black/5 dark:hover:bg-white/5"
        >
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-sage text-xs font-semibold text-primary-hover">
            운영
          </span>
          <span className="text-left leading-tight">
            <span className="block text-xs font-medium">운영자</span>
            <span className="block text-[11px] text-subtext">핸디즈 운영팀</span>
          </span>
          <ChevronDownIcon className="h-3.5 w-3.5 text-subtext" />
        </button>
      </div>
    </header>
  );
}
