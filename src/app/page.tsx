import Link from "next/link";
import { getDashboardData, type ActivityItem, type DashboardWorkItem } from "@/lib/queries";
import {
  CleaningStatusBadge,
  IssueStatusBadge,
  RiskBadge,
  RoomStatusBadge,
  UrgencyBadge,
} from "@/components/common/StatusBadges";
import { getRoomDisplayStatus, type RoomDisplayStatus } from "@/lib/roomDisplayStatus";
import {
  formatBuffer,
  formatDateHeader,
  formatRelative,
  formatTime,
  relativeOperationDay,
} from "@/lib/format";
import { ISSUE_CATEGORY_LABEL } from "@/lib/labels";
import type { CleaningTask, Room } from "@/lib/types";
import { StatCard } from "@/components/dashboard/StatCard";
import { ActivityDrawer } from "@/components/dashboard/ActivityDrawer";
import { CrewStatusCard } from "@/components/crew/CrewStatusCard";
import { ClickableTableRow } from "@/components/common/ClickableTableRow";
import {
  ArrowRightIcon,
  CheckCircleIcon,
  CleaningIcon,
  ClockIcon,
  CrewIcon,
  IssueIcon,
  MessageIcon,
  RefreshIcon,
} from "@/components/common/icons";

export const dynamic = "force-dynamic";

type WorkTone = "danger" | "warning" | "info";

const WORK_TONE_CLASSES: Record<
  WorkTone,
  { card: string; icon: string; badge: string; button: string }
> = {
  danger: {
    card: "border-danger-border bg-danger-bg/45",
    icon: "bg-danger-bg text-danger-text",
    badge: "bg-danger-bg text-danger-text",
    button:
      "border-danger-border bg-card text-danger-text hover:bg-danger-bg",
  },
  warning: {
    card: "border-warning-border bg-warning-bg/45",
    icon: "bg-warning-bg text-warning-text",
    badge: "bg-warning-bg text-warning-text",
    button:
      "border-warning-border bg-card text-warning-text hover:bg-warning-bg",
  },
  info: {
    card: "border-info-border bg-info-bg/40",
    icon: "bg-info-bg text-info-text",
    badge: "bg-info-bg text-info-text",
    button: "border-info-border bg-card text-info-text hover:bg-info-bg",
  },
};

function nextScheduleText(room: Room, displayStatus: RoomDisplayStatus): string {
  if (displayStatus === "occupied") {
    return room.checkout_at
      ? `${relativeOperationDay(room.checkout_at)} ${formatTime(new Date(room.checkout_at))} 퇴실`
      : "퇴실 일정 없음";
  }
  if (displayStatus === "blocked") return room.operation_note ?? "점검 중";
  if (!room.next_checkin_at) return "다음 예약 없음";
  return `${relativeOperationDay(room.next_checkin_at)} ${formatTime(
    new Date(room.next_checkin_at)
  )} 체크인`;
}

function workTone(item: DashboardWorkItem): WorkTone {
  if (item.priorityTier <= 2) return "danger";
  if (item.priorityTier === 3) return "warning";
  return "info";
}

function workBadge(item: DashboardWorkItem): string {
  if (item.kind === "issue") {
    return item.issue?.urgency === "urgent" ? "긴급 이슈" : "운영 이슈";
  }
  if (item.priorityTier === 0) return "체크인 임박";
  if (item.priorityTier === 2) return formatBuffer(item.priority?.bufferMinutes ?? null);
  if (item.task?.status === "inspection") return "검수 대기";
  if (item.task?.status === "unassigned") return "미배정";
  return "청소 작업";
}

function workSummary(item: DashboardWorkItem): string {
  if (item.kind === "issue") return item.issue?.description ?? "이슈 내용 없음";
  if (!item.room.next_checkin_at) return "다음 체크인 일정 없음";
  return `체크인 ${formatRelative(item.room.next_checkin_at)}`;
}

function workHref(item: DashboardWorkItem): string {
  if (item.kind === "issue") return `/issues/${item.issue!.id}`;
  return `/cleaning/${item.task!.id}`;
}

function assigneeName(task: CleaningTask | null) {
  if (!task) return "-";
  return task.assignee?.name ?? "미배정";
}

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ branch?: string; region?: string }>;
}) {
  const { branch, region } = await searchParams;
  const filterQuery = new URLSearchParams();
  if (branch) filterQuery.set("branch", branch);
  if (region) filterQuery.set("region", region);
  const filterQueryString = filterQuery.toString();
  const withFilter = (href: string) =>
    filterQueryString ? `${href}?${filterQueryString}` : href;
  const withFilterParams = (path: string, extra: Record<string, string>) => {
    const params = new URLSearchParams(filterQuery);
    for (const [key, value] of Object.entries(extra)) params.set(key, value);
    return `${path}?${params.toString()}`;
  };
  const priorityHref = filterQueryString
    ? `/?${filterQueryString}#priority-work`
    : "/#priority-work";

  const {
    summary,
    priorityWorkItems,
    roomsByPriority,
    cleaningTasksByPriority,
    openIssues,
    crew,
    activity,
    activityHistory,
    totalRooms,
  } = await getDashboardData({ branch, region });

  const now = new Date();
  const topWorkItems = priorityWorkItems.slice(0, 4);

  return (
    <div className="mx-auto w-full max-w-[1480px]">
      <div className="grid gap-7 xl:grid-cols-[minmax(0,1fr)_18rem] xl:items-start">
        <div className="flex min-w-0 flex-col gap-7">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">오늘의 운영 현황</h1>
          <p className="mt-1 text-sm text-subtext">
            {formatDateHeader(now)} · 우선순위가 높은 작업부터 확인하세요.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs text-subtext">{formatTime(now)} 기준</span>
          <Link
            href={withFilter("/")}
            className="flex items-center gap-1.5 rounded-lg border border-card-border bg-card px-3 py-2 text-xs font-medium transition-colors hover:border-primary/40"
          >
            <RefreshIcon className="h-3.5 w-3.5" />
            새로고침
          </Link>
        </div>
      </header>

      <section aria-label="오늘의 핵심 운영 지표" className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-5">
        <StatCard
          icon={CheckCircleIcon}
          tone="success"
          value={summary.normal}
          label="정상 운영"
          detail={`전체 객실 중 ${
            totalRooms > 0 ? Math.round((summary.normal / totalRooms) * 100) : 0
          }%`}
          href={withFilterParams("/rooms", { status: "normal" })}
        />
        <StatCard
          icon={IssueIcon}
          tone="danger"
          value={summary.immediate}
          label="즉시 처리"
          detail="임박·긴급·지연 작업"
          href={priorityHref}
        />
        <StatCard
          icon={ClockIcon}
          tone="warning"
          value={summary.inspection}
          label="검수 대기"
          detail="운영자 확인 필요"
          href={withFilterParams("/cleaning", { status: "inspection" })}
        />
        <StatCard
          icon={CrewIcon}
          tone="info"
          value={summary.unassigned}
          label="미배정"
          detail={`청소 ${summary.unassignedCleaning}건 · 이슈 ${summary.unassignedIssues}건`}
          href={withFilter("/unassigned")}
        />
        <StatCard
          icon={MessageIcon}
          tone="info"
          value={summary.guestInquiries}
          label="게스트 문의"
          detail="미처리 게스트 접수"
          href={withFilterParams("/issues", { reporter: "guest" })}
        />
      </section>

      <section id="priority-work" className="scroll-mt-6">
        <SectionHeading
          icon={<IssueIcon className="h-4 w-4" />}
          title="긴급 작업"
          description="청소와 운영 이슈를 하나의 우선순위로 정렬한 Top 4"
          count={summary.immediate}
        />

        {topWorkItems.length > 0 ? (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {topWorkItems.map((item) => {
              const tone = WORK_TONE_CLASSES[workTone(item)];
              const Icon = item.kind === "cleaning" ? CleaningIcon : IssueIcon;
              return (
                <article
                  key={item.id}
                  className={`flex min-h-[142px] flex-col justify-between rounded-2xl border p-4 transition hover:-translate-y-0.5 hover:shadow-sm ${tone.card}`}
                >
                  <div>
                    <div className="flex items-start justify-between gap-3">
                      <span className="min-w-0 truncate text-xs font-medium text-subtext">
                        {item.room.branch}
                      </span>
                      <span className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${tone.badge}`}>
                        {workBadge(item)}
                      </span>
                    </div>
                    <Link
                      href={`/rooms/${item.room.id}`}
                      className="mt-1 block text-sm font-bold hover:underline"
                    >
                      {item.room.room_number}호
                    </Link>
                    <p className="mt-3 flex items-center gap-1.5 text-xs text-foreground/75">
                      <span className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-md ${tone.icon}`}>
                        <Icon className="h-3 w-3" />
                      </span>
                      <span className="truncate">{workSummary(item)}</span>
                    </p>
                  </div>
                  <div className="mt-3 flex items-center justify-between gap-3">
                    <span className="truncate text-xs text-subtext">
                      {item.kind === "cleaning"
                        ? assigneeName(item.task)
                        : item.issue?.assignee?.name ?? "담당자 미배정"}
                    </span>
                    <Link
                      href={workHref(item)}
                      className={`inline-flex h-8 shrink-0 items-center justify-center rounded-lg border px-3 text-xs font-semibold transition-colors ${tone.button}`}
                    >
                      {item.kind === "cleaning" && item.task?.status === "unassigned"
                        ? "배정하기"
                        : "확인하기"}
                    </Link>
                  </div>
                </article>
              );
            })}
          </div>
        ) : (
          <div className="flex min-h-28 items-center justify-center rounded-xl border border-success-border bg-success-bg text-sm font-medium text-success-text">
            지금 바로 처리할 긴급 작업이 없습니다.
          </div>
        )}
      </section>

      <div className="flex flex-col gap-5 xl:hidden">
        <CrewStatusCard crew={crew} href={withFilter("/cleaning")} />
        <RecentActivityCard activity={activity} activityHistory={activityHistory} />
      </div>

      <DashboardSection
        title="객실 현황"
        description="지금 운영 가능한 객실인지 확인합니다."
        href={withFilter("/rooms")}
      >
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] text-sm">
            <thead className="bg-black/[0.02] text-left text-xs text-subtext">
              <tr>
                <th className="px-4 py-3 font-medium">객실</th>
                <th className="px-4 py-3 font-medium">운영 상태</th>
                <th className="px-4 py-3 font-medium">다음 일정</th>
                <th className="px-4 py-3 font-medium">담당자</th>
                <th className="w-24 px-4 py-3 font-medium"><span className="sr-only">액션</span></th>
              </tr>
            </thead>
            <tbody>
              {roomsByPriority.slice(0, 5).map(({ room, task }) => {
                const displayStatus = getRoomDisplayStatus(room, task);
                return (
                  <ClickableTableRow
                    key={room.id}
                    href={`/rooms/${room.id}`}
                    className="border-t border-card-border transition-colors hover:bg-black/[0.02] dark:hover:bg-white/[0.025]"
                  >
                    <td className="px-4 py-3">
                      <Link
                        href={`/rooms/${room.id}`}
                        className="flex items-center gap-1.5 font-semibold hover:text-primary"
                      >
                        <span
                          aria-hidden="true"
                          className={`h-1.5 w-1.5 shrink-0 rounded-full ${
                            room.operation_status === "blocked"
                              ? "bg-danger-text"
                              : "bg-success-text"
                          }`}
                        />
                        {room.branch} · {room.room_number}호
                      </Link>
                    </td>
                    <td className="px-4 py-3"><RoomStatusBadge status={displayStatus} /></td>
                    <td className="px-4 py-3 text-subtext">{nextScheduleText(room, displayStatus)}</td>
                    <td className="px-4 py-3 text-subtext">{assigneeName(task)}</td>
                    <td className="px-4 py-3 text-right"><RowLink href={`/rooms/${room.id}`} label="객실 보기" /></td>
                  </ClickableTableRow>
                );
              })}
              {roomsByPriority.length === 0 && <EmptyTable colSpan={5} text="객실이 없습니다." />}
            </tbody>
          </table>
        </div>
      </DashboardSection>

      <DashboardSection
        title="청소 작업"
        description="배정부터 검수까지 청소 진행 단계를 확인합니다."
        count={cleaningTasksByPriority.length}
        href={withFilter("/cleaning")}
      >
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] text-sm">
            <thead className="bg-black/[0.02] text-left text-xs text-subtext">
              <tr>
                <th className="px-4 py-3 font-medium">객실</th>
                <th className="px-4 py-3 font-medium">청소 상태</th>
                <th className="px-4 py-3 font-medium">담당 크루</th>
                <th className="px-4 py-3 font-medium">여유 시간</th>
                <th className="w-24 px-4 py-3 font-medium"><span className="sr-only">액션</span></th>
              </tr>
            </thead>
            <tbody>
              {cleaningTasksByPriority.slice(0, 5).map(({ room, task, priority }) => (
                <ClickableTableRow
                  key={task!.id}
                  href={`/cleaning/${task!.id}`}
                  className="border-t border-card-border transition-colors hover:bg-black/[0.02] dark:hover:bg-white/[0.025]"
                >
                  <td className="px-4 py-3">
                    <Link href={`/rooms/${room.id}`} className="font-semibold hover:text-primary">
                      {room.branch} · {room.room_number}호
                    </Link>
                  </td>
                  <td className="px-4 py-3"><CleaningStatusBadge status={task!.status} /></td>
                  <td className="px-4 py-3 text-subtext">{assigneeName(task)}</td>
                  <td className="px-4 py-3"><RiskBadge level={priority.riskLevel} label={formatBuffer(priority.bufferMinutes)} /></td>
                  <td className="px-4 py-3 text-right">
                    <RowLink
                      href={`/cleaning/${task!.id}`}
                      label={
                        task!.status === "unassigned"
                          ? "배정하기"
                          : task!.status === "inspection"
                            ? "검수하기"
                            : task!.status === "done"
                              ? "상세보기"
                              : "확인하기"
                      }
                    />
                  </td>
                </ClickableTableRow>
              ))}
              {cleaningTasksByPriority.length === 0 && <EmptyTable colSpan={5} text="처리할 청소 작업이 없습니다." />}
            </tbody>
          </table>
        </div>
      </DashboardSection>

      <DashboardSection
        title="운영 이슈"
        description="시설 및 게스트 문제의 처리 상황을 확인합니다."
        count={openIssues.length}
        href={withFilter("/issues")}
      >
        <div className="overflow-x-auto">
          <table className="w-full min-w-[820px] text-sm">
            <thead className="bg-black/[0.02] text-left text-xs text-subtext">
              <tr>
                <th className="px-4 py-3 font-medium">객실</th>
                <th className="px-4 py-3 font-medium">유형</th>
                <th className="px-4 py-3 font-medium">이슈 내용</th>
                <th className="px-4 py-3 font-medium">긴급도</th>
                <th className="px-4 py-3 font-medium">상태</th>
                <th className="w-24 px-4 py-3 font-medium"><span className="sr-only">액션</span></th>
              </tr>
            </thead>
            <tbody>
              {openIssues.slice(0, 5).map((issue) => (
                <ClickableTableRow
                  key={issue.id}
                  href={`/issues/${issue.id}`}
                  className="border-t border-card-border transition-colors hover:bg-black/[0.02] dark:hover:bg-white/[0.025]"
                >
                  <td className="px-4 py-3 font-semibold whitespace-nowrap">
                    <Link
                      href={issue.room ? `/rooms/${issue.room.id}` : `/issues/${issue.id}`}
                      className="hover:text-primary"
                    >
                      {issue.room?.branch} · {issue.room?.room_number}호
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-subtext whitespace-nowrap">{ISSUE_CATEGORY_LABEL[issue.category]}</td>
                  <td className="max-w-md px-4 py-3"><p className="line-clamp-1 text-foreground/75">{issue.description}</p></td>
                  <td className="px-4 py-3"><UrgencyBadge urgency={issue.urgency} /></td>
                  <td className="px-4 py-3"><IssueStatusBadge status={issue.status} /></td>
                  <td className="px-4 py-3 text-right">
                    <RowLink
                      href={`/issues/${issue.id}`}
                      label={!issue.assignee ? "배정하기" : "확인하기"}
                    />
                  </td>
                </ClickableTableRow>
              ))}
              {openIssues.length === 0 && <EmptyTable colSpan={6} text="미처리 운영 이슈가 없습니다." />}
            </tbody>
          </table>
        </div>
      </DashboardSection>
        </div>

        <aside className="hidden flex-col gap-5 xl:sticky xl:top-0 xl:flex">
          <CrewStatusCard crew={crew} href={withFilter("/cleaning")} />
          <RecentActivityCard activity={activity} activityHistory={activityHistory} />
        </aside>
      </div>
    </div>
  );
}

function SectionHeading({
  icon,
  title,
  description,
  count,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  count: number;
}) {
  return (
    <div className="mb-3 flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-center gap-2">
        <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-danger-bg text-danger-text">{icon}</span>
        <h2 className="text-base font-semibold">{title}</h2>
        <span className="rounded-full bg-danger-bg px-2 py-0.5 text-[11px] font-semibold text-danger-text">{count}</span>
      </div>
      <p className="text-xs text-subtext">{description}</p>
    </div>
  );
}

function DashboardSection({
  title,
  description,
  count,
  href,
  children,
}: {
  title: string;
  description: string;
  count?: number;
  href: string;
  children: React.ReactNode;
}) {
  return (
    <section>
      <div className="mb-3 flex items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-base font-semibold">{title}</h2>
            {count !== undefined && <span className="text-sm text-subtext">{count}</span>}
          </div>
          <p className="mt-0.5 text-xs text-subtext">{description}</p>
        </div>
        <Link href={href} className="flex shrink-0 items-center gap-1 text-xs font-medium text-subtext transition-colors hover:text-primary">
          전체 보기 <ArrowRightIcon className="h-3.5 w-3.5" />
        </Link>
      </div>
      <div className="overflow-hidden rounded-xl border border-card-border bg-card">{children}</div>
    </section>
  );
}

function RecentActivityCard({
  activity,
  activityHistory,
}: {
  activity: ActivityItem[];
  activityHistory: ActivityItem[];
}) {
  return (
    <div className="rounded-xl border border-card-border bg-card p-4">
      <div className="mb-3 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <ClockIcon className="h-4 w-4 text-primary" />
          <h2 className="text-sm font-semibold">최근 활동</h2>
        </div>
        <ActivityDrawer history={activityHistory} />
      </div>
      <ul className="relative flex flex-col gap-4">
        {activity.length > 1 && (
          <div className="absolute top-1.5 bottom-1.5 left-0.75 w-px bg-black/10 dark:bg-white/10" />
        )}
        {activity.map((item) => (
          <li
            key={item.id}
            className="relative flex items-start justify-between gap-2 pl-4 text-xs"
          >
            {item.done ? (
              <CheckCircleIcon className="absolute -top-0.5 -left-1 h-3.5 w-3.5 bg-card text-primary" />
            ) : (
              <span className="absolute top-1 left-0 h-1.5 w-1.5 rounded-full bg-primary" />
            )}
            <span className="text-foreground/80">
              <span className="rounded-full bg-primary/10 px-1.5 py-0.5 text-[11px] font-medium text-primary">
                {item.room}
              </span>{" "}
              {item.action}
            </span>
            <span className="shrink-0 text-subtext">{formatTime(item.time)}</span>
          </li>
        ))}
        {activity.length === 0 && (
          <li className="py-2 text-center text-sm text-subtext">
            최근 활동이 없습니다.
          </li>
        )}
      </ul>
    </div>
  );
}

function RowLink({ href, label = "보기" }: { href: string; label?: string }) {
  return (
    <Link href={href} className="inline-flex text-xs font-semibold text-primary hover:underline">
      {label}
    </Link>
  );
}

function EmptyTable({ colSpan, text }: { colSpan: number; text: string }) {
  return (
    <tr>
      <td colSpan={colSpan} className="px-4 py-10 text-center text-sm text-subtext">{text}</td>
    </tr>
  );
}
