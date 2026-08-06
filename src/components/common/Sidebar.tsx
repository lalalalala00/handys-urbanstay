"use client";

import { Suspense } from "react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import {
  CalendarIcon,
  CleaningIcon,
  CrewIcon,
  DashboardIcon,
  IssueIcon,
  LocationIcon,
  MessageIcon,
  ReportIcon,
  RoomIcon,
  SettingsIcon,
} from "./icons";

const NAV_LINKS = [
  { href: "/", label: "대시보드", icon: DashboardIcon },
  { href: "/rooms", label: "객실 현황", icon: RoomIcon },
  { href: "/cleaning", label: "청소 작업", icon: CleaningIcon },
  { href: "/issues", label: "운영 이슈", icon: IssueIcon },
];

const SOON_LINKS = [
  { label: "예약 관리", icon: CalendarIcon },
  { label: "크루 관리", icon: CrewIcon },
  { label: "숙소 관리", icon: LocationIcon },
  { label: "메시지", icon: MessageIcon },
  { label: "리포트", icon: ReportIcon },
  { label: "설정", icon: SettingsIcon },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <>
      <aside className="hidden h-full w-56 shrink-0 flex-col justify-between border-r border-card-border bg-card px-4 py-5 lg:flex">
        <div>
          <Link href="/" className="mb-7 flex items-center gap-2 px-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-sm font-bold text-white">
              h
            </span>
            <span>
              <span className="block text-base font-semibold tracking-tight">handys</span>
              <span className="block text-[10px] font-medium tracking-[0.12em] text-subtext">STAY OPS</span>
            </span>
          </Link>

          <nav className="flex flex-col gap-0.5" aria-label="주요 메뉴">
            <p className="mb-1 px-3 text-[10px] font-semibold tracking-wider text-subtext">오늘 운영</p>
            <Suspense fallback={<NavLinks pathname={pathname} query="" />}>
              <QueryAwareNavLinks pathname={pathname} />
            </Suspense>

            <p className="mb-1 mt-5 px-3 text-[10px] font-semibold tracking-wider text-subtext">관리</p>
            {SOON_LINKS.map((link) => (
              <span
                key={link.label}
                title="MVP 이후 제공 예정"
                className="flex cursor-default items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-foreground/35"
              >
                <link.icon className="h-4.5 w-4.5 shrink-0" />
                {link.label}
                <span className="ml-auto text-[9px] font-semibold tracking-wide">SOON</span>
              </span>
            ))}
          </nav>
        </div>

        <div className="rounded-xl border border-card-border bg-background p-3">
          <p className="text-xs font-semibold">Operations MVP</p>
          <p className="mt-1 text-[11px] leading-4 text-subtext">객실·청소·이슈 운영 흐름을 검증하는 과제 버전입니다.</p>
        </div>
      </aside>

      <nav
        className="fixed inset-x-3 bottom-3 z-40 grid grid-cols-4 rounded-2xl border border-card-border bg-card/95 p-1.5 shadow-lg backdrop-blur lg:hidden"
        aria-label="모바일 주요 메뉴"
      >
        <Suspense fallback={<MobileNavLinks pathname={pathname} query="" />}>
          <QueryAwareMobileNavLinks pathname={pathname} />
        </Suspense>
      </nav>
    </>
  );
}

function QueryAwareNavLinks({ pathname }: { pathname: string }) {
  const searchParams = useSearchParams();
  return <NavLinks pathname={pathname} query={locationQuery(searchParams)} />;
}

function QueryAwareMobileNavLinks({ pathname }: { pathname: string }) {
  const searchParams = useSearchParams();
  return <MobileNavLinks pathname={pathname} query={locationQuery(searchParams)} />;
}

function locationQuery(searchParams: { get(name: string): string | null }) {
  const params = new URLSearchParams();
  const branch = searchParams.get("branch");
  const region = searchParams.get("region");
  if (branch) params.set("branch", branch);
  if (region) params.set("region", region);
  return params.toString();
}

function NavLinks({ pathname, query }: { pathname: string; query: string }) {
  return (
    <>
      {NAV_LINKS.map((link) => {
        const active = isActivePath(pathname, link.href);
        const Icon = link.icon;
        return (
          <Link
            key={link.href}
            href={query ? `${link.href}?${query}` : link.href}
            className={`flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition-colors ${
              active
                ? "bg-success-bg font-medium text-foreground"
                : "text-foreground/70 hover:bg-black/5 dark:hover:bg-white/5"
            }`}
          >
            <span
              className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-md ${
                active ? "bg-primary text-white" : ""
              }`}
            >
              <Icon className="h-4 w-4" />
            </span>
            {link.label}
          </Link>
        );
      })}
    </>
  );
}

function MobileNavLinks({ pathname, query }: { pathname: string; query: string }) {
  return NAV_LINKS.map((link) => {
    const active = isActivePath(pathname, link.href);
    const Icon = link.icon;
    return (
      <Link
        key={link.href}
        href={query ? `${link.href}?${query}` : link.href}
        className={`flex min-w-0 flex-col items-center gap-1 rounded-xl px-1 py-2 text-[10px] font-medium transition-colors ${
          active ? "bg-success-bg text-primary" : "text-subtext"
        }`}
      >
        <Icon className="h-4.5 w-4.5" />
        <span className="truncate">{link.label}</span>
      </Link>
    );
  });
}

function isActivePath(pathname: string, href: string) {
  return href === "/" ? pathname === "/" : pathname.startsWith(href);
}
