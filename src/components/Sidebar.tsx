"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  CleaningIcon,
  CrewIcon,
  DashboardIcon,
  IssueIcon,
  LocationIcon,
  MessageIcon,
  ReportIcon,
  SettingsIcon,
} from "./icons";

const NAV_LINKS = [
  { href: "/", label: "대시보드", icon: DashboardIcon },
  { href: "/cleaning", label: "청소 작업", icon: CleaningIcon },
  { href: "/issues", label: "객실 이슈", icon: IssueIcon },
];

const SOON_LINKS = [
  { label: "크루 관리", icon: CrewIcon },
  { label: "거점/숙소 관리", icon: LocationIcon },
  { label: "메시지", icon: MessageIcon },
  { label: "리포트", icon: ReportIcon },
  { label: "설정", icon: SettingsIcon },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="flex h-full w-56 shrink-0 flex-col justify-between border-r border-card-border bg-card px-4 py-5">
      <div>
        <Link href="/" className="mb-6 flex items-center gap-2 px-2">
          <span className="flex h-7 w-7 items-center justify-center rounded-md bg-primary text-sm font-bold text-white">
            h
          </span>
          <span className="text-base font-semibold tracking-tight">handys</span>
        </Link>

        <nav className="flex flex-col gap-0.5">
          {NAV_LINKS.map((link) => {
            const active = pathname === link.href;
            const Icon = link.icon;
            return (
              <Link
                key={link.href}
                href={link.href}
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

          {SOON_LINKS.map((link) => (
            <span
              key={link.label}
              title="준비 중인 메뉴입니다"
              className="flex cursor-default items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-foreground/35"
            >
              <link.icon className="h-4.5 w-4.5 shrink-0" />
              {link.label}
            </span>
          ))}
        </nav>
      </div>

      <div className="rounded-xl border border-card-border bg-background p-4">
        <p className="text-sm font-medium">도움이 필요하신가요?</p>
        <p className="mt-2 text-xs text-subtext">핸디즈 운영팀</p>
        <p className="text-xs text-subtext">02-1234-5678</p>
        <button
          type="button"
          className="mt-3 w-full rounded-lg border border-card-border bg-card py-1.5 text-xs font-medium text-foreground transition-colors hover:border-primary/40"
        >
          문의하기
        </button>
      </div>
    </aside>
  );
}
