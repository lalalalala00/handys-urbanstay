import Link from "next/link";
import { getDashboardData } from "@/lib/queries";
import { Badge, type Tone } from "@/components/Badge";
import { RoomStatusBadge, IssueStatusBadge } from "@/components/StatusBadges";
import { getRoomDisplayStatus, type RoomDisplayStatus } from "@/lib/roomDisplayStatus";
import {
  formatBuffer,
  formatDateHeader,
  formatRelative,
  formatTime,
} from "@/lib/format";
import {
  CLEANING_STATUS_LABEL,
  ISSUE_URGENCY_LABEL,
  REPORTER_TYPE_LABEL,
} from "@/lib/labels";
import type { Room } from "@/lib/types";
import { StatCard } from "@/components/dashboard/StatCard";
import { RoomStatusDonut } from "@/components/dashboard/RoomStatusDonut";
import { ActivityDrawer } from "@/components/dashboard/ActivityDrawer";
import {
  ArrowRightIcon,
  CheckCircleIcon,
  CleaningIcon,
  ClockIcon,
  CrewIcon,
  IssueIcon,
  LightbulbIcon,
  MessageIcon,
  RefreshIcon,
} from "@/components/icons";
import { CrewStatusCard } from "@/components/crew/CrewStatusCard";

export const dynamic = "force-dynamic";

type UrgentTone = "danger" | "warning" | "success";

type UrgentCard = {
  id: string;
  branch: string;
  roomLabel: string;
  roomId: string | undefined;
  type: "cleaning" | "issue";
  badgeLabel: string;
  tone: UrgentTone;
  statusText: string;
  subText: string;
  actionLabel: string;
  href: string;
};

const URGENT_TONE_CLASSES: Record<UrgentTone, string> = {
  danger: "bg-danger-bg text-danger-text border-danger-border",
  warning: "bg-warning-bg text-warning-text border-warning-border",
  success: "bg-success-bg text-success-text border-success-border",
};

const URGENT_CARD_CLASSES = {
  danger: {
    card: "border-[#F3D7D2] bg-[#FFF8F6]",
    badge: "bg-[#FDEEEE] text-[#D75A5A]",
    button: "border-[#F1C7C0] bg-white text-[#D75A5A] hover:bg-[#FDEEEE]",
    icon: "text-[#D75A5A]",
  },
  warning: {
    card: "border-[#EFDDBE] bg-[#FFFBF3]",
    badge: "bg-[#FFF1D6] text-[#C98A1E]",
    button: "border-[#ECD5A9] bg-white text-[#B97B18] hover:bg-[#FFF3DB]",
    icon: "text-[#C98A1E]",
  },
  success: {
    card: "border-[#D5E8DA] bg-[#F7FCF8]",
    badge: "bg-[#EDF8F1] text-[#2F8F5B]",
    button: "border-[#CBE8D4] bg-white text-[#2F8F5B] hover:bg-[#EDF8F1]",
    icon: "text-[#2F8F5B]",
  },
  info: {
    card: "border-[#D9E4F5] bg-[#F7FAFF]",
    badge: "bg-[#EEF5FF] text-[#4F7DD8]",
    button: "border-[#D4E3FF] bg-white text-[#4F7DD8] hover:bg-[#EEF5FF]",
    icon: "text-[#4F7DD8]",
  },
} as const;

// Day-relative label ("오늘"/"내일"/"3일 후") for a datetime, independent of
// the D-day badge used elsewhere.
function relativeDayLabel(iso: string): string {
  const startOfDay = (d: Date) =>
    new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
  const diffDays = Math.round(
    (startOfDay(new Date(iso)) - startOfDay(new Date())) / 86_400_000
  );
  if (diffDays === 0) return "오늘";
  if (diffDays === 1) return "내일";
  if (diffDays === -1) return "어제";
  return diffDays > 0 ? `${diffDays}일 후` : `${Math.abs(diffDays)}일 전`;
}

function nextScheduleText(room: Room, displayStatus: RoomDisplayStatus): string {
  switch (displayStatus) {
    case "occupied":
      return room.checkout_at
        ? `${relativeDayLabel(room.checkout_at)} 퇴실`
        : "퇴실 일정 없음";
    case "checkin_due":
      return room.next_checkin_at
        ? `체크인 ${formatTime(new Date(room.next_checkin_at))}`
        : "체크인 시간 미정";
    case "dirty":
    case "cleaning":
    case "inspection":
      return room.next_checkin_at
        ? formatRelative(room.next_checkin_at)
        : "체크인 정보 없음";
    case "blocked":
      return "-";
    case "ready":
    default:
      return room.next_checkin_at
        ? `${relativeDayLabel(room.next_checkin_at)} ${formatTime(
            new Date(room.next_checkin_at)
          )} 체크인`
        : "예약 없음";
  }
}

const OPERATIONAL_STATE: Record<RoomDisplayStatus, { label: string; tone: Tone }> = {
  occupied: { label: "정상", tone: "neutral" },
  checkin_due: { label: "정상", tone: "neutral" },
  ready: { label: "준비 완료", tone: "success" },
  dirty: { label: "작업 필요", tone: "warning" },
  cleaning: { label: "작업 필요", tone: "warning" },
  inspection: { label: "작업 필요", tone: "warning" },
  blocked: { label: "점검 중", tone: "danger" },
};

function operationalState(room: Room, displayStatus: RoomDisplayStatus) {
  if (displayStatus === "blocked" && room.operation_note) {
    return { label: room.operation_note, tone: "danger" as Tone };
  }
  return OPERATIONAL_STATE[displayStatus];
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
    for (const [key, value] of Object.entries(extra)) {
      params.set(key, value);
    }
    return `${path}?${params.toString()}`;
  };
  const {
    summary,
    priorityRooms,
    roomsByPriority,
    cleaningTasksByPriority,
    openIssues,
    crew,
    activity,
    activityHistory,
    roomStatusDistribution,
    totalRooms,
    checkinPeakHour,
  } = await getDashboardData({ branch, region });

  const now = new Date();
  const normalRooms = roomStatusDistribution.normal;

  const urgentIssueRoomIds = new Set(
    openIssues
      .filter((issue) => issue.urgency === "urgent")
      .map((issue) => issue.room?.id)
  );
  const urgentRoomCards: UrgentCard[] = priorityRooms
    .filter(
      ({ room, priority, task }) =>
        !urgentIssueRoomIds.has(room.id) &&
        (priority.riskLevel === "urgent" ||
          priority.riskLevel === "warning" ||
          task?.status === "unassigned")
    )
    .slice(0, 3)
    .map(({ room, task, priority }) => ({
      id: `room-${room.id}`,
      branch: room.branch,
      roomLabel: `${room.room_number}호`,
      roomId: room.id,
      type: "cleaning" as const,
      badgeLabel: formatBuffer(priority.bufferMinutes),
      tone:
        priority.riskLevel === "urgent"
          ? ("danger" as const)
          : priority.riskLevel === "warning"
          ? ("warning" as const)
          : ("success" as const),
      statusText: task ? CLEANING_STATUS_LABEL[task.status] : "청소 없음",
      subText: room.next_checkin_at
        ? `체크인 ${formatTime(new Date(room.next_checkin_at))}`
        : "체크인 예정 없음",
      actionLabel:
        !task || task.status === "unassigned" ? "배정하기" : "확인하기",
      href: task ? `/cleaning/${task.id}` : withFilter("/cleaning"),
    }));

  const urgentIssueCards: UrgentCard[] = openIssues
    .filter((issue) => issue.urgency === "urgent")
    .slice(0, Math.max(4 - urgentRoomCards.length, 0))
    .map((issue) => ({
      id: `issue-${issue.id}`,
      branch: issue.room?.branch ?? "",
      roomLabel: `${issue.room?.room_number ?? ""}호`,
      roomId: issue.room?.id,
      type: "issue" as const,
      badgeLabel: "긴급",
      tone: "danger" as const,
      statusText: "이상 신고 처리 필요",
      subText: issue.description,
      actionLabel: "확인하기",
      href: `/issues/${issue.id}`,
    }));

  const urgentCards = [...urgentRoomCards, ...urgentIssueCards].slice(0, 4);

  return (
    <div className="flex gap-6">
      <div className="flex min-w-0 flex-1 flex-col gap-6">
        <section className="flex items-center justify-between">
          <div>
            <h1 className="text-lg font-semibold">오늘의 운영 현황</h1>
            <p className="mt-0.5 text-sm text-subtext">
              {formatDateHeader(now)}요일
            </p>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs text-subtext">{formatTime(now)} 기준</span>
            <Link
              href="/"
              className="flex items-center gap-1.5 rounded-lg border border-card-border bg-card px-3 py-1.5 text-xs font-medium transition-colors hover:border-primary/40"
            >
              <RefreshIcon className="h-3.5 w-3.5" />
              새로고침
            </Link>
          </div>
        </section>

        <section className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          <StatCard
            icon={CheckCircleIcon}
            tone="success"
            value={normalRooms}
            label="정상 운영"
            detail={`전체 객실 중 ${
              totalRooms > 0 ? Math.round((normalRooms / totalRooms) * 100) : 0
            }%`}
            href={withFilterParams("/rooms", { status: "normal" })}
          />
          <StatCard
            icon={IssueIcon}
            tone="danger"
            value={roomStatusDistribution.urgent}
            label="즉시 처리"
            detail="지연/문제 발생"
            href={withFilterParams("/issues", { urgency: "urgent" })}
          />
          <StatCard
            icon={CleaningIcon}
            tone="warning"
            value={roomStatusDistribution.inspection}
            label="검수 대기"
            detail="청소 완료 후 검수"
            href={withFilterParams("/cleaning", { status: "inspection" })}
          />
          <StatCard
            icon={CrewIcon}
            tone="info"
            value={summary.unassigned}
            label="미배정"
            detail="크루 배정 필요"
            href={withFilterParams("/cleaning", { status: "unassigned" })}
          />
          <StatCard
            icon={MessageIcon}
            tone="info"
            value={openIssues.filter((i) => i.reporter_type === "guest").length}
            label="게스트 문의"
            detail="게스트 신고 접수"
            href={withFilterParams("/issues", { reporter: "guest" })}
          />
        </section>

        {urgentCards.length > 0 && (
          <section>
            <div className="mb-3 flex items-center gap-2">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#FDEEEE] text-[#D75A5A]">
                <IssueIcon className="h-3.5 w-3.5" />
              </span>

              <h2 className="text-base font-semibold text-[#2F2F2F]">
                오늘 긴급 작업
              </h2>

              <span className="rounded-full bg-[#FDEEEE] px-2 py-0.5 text-[11px] font-semibold text-[#D75A5A]">
                {urgentCards.length}
              </span>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {urgentCards.map((card) => {
                const tone = URGENT_CARD_CLASSES[card.tone];

                return (
                  <article
                    key={card.id}
                    className={`
              group flex min-h-[142px] flex-col justify-between
              rounded-2xl border p-4
              transition-all duration-200
              hover:-translate-y-0.5 hover:shadow-[0_8px_24px_rgba(47,47,47,0.06)]
              ${tone.card}
            `}
                  >
                    <div>
                      <div className="flex items-start justify-between gap-3">
                        <span className="min-w-0 truncate text-xs font-medium text-[#8A8A8A]">
                          {card.branch}
                        </span>

                        <span
                          className={`
                    shrink-0 rounded-full px-2.5 py-1
                    text-[11px] font-semibold
                    ${tone.badge}
                  `}
                        >
                          {card.badgeLabel}
                        </span>
                      </div>

                      <h3 className="min-w-0 truncate text-sm font-bold text-[#2F2F2F]">
                        {card.roomId ? (
                          <Link
                            href={`/rooms/${card.roomId}`}
                            className="hover:underline"
                          >
                            {card.roomLabel}
                          </Link>
                        ) : (
                          card.roomLabel
                        )}
                      </h3>

                      <div className={`mt-4`}>
                        <p className="flex items-center gap-1.5 text-xs font-medium text-[#555555]">
                          {card.type === "cleaning" ? (
                            <CleaningIcon
                              className={`h-3.5 w-3.5 shrink-0 ${tone.icon}`}
                            />
                          ) : (
                            <IssueIcon
                              className={`h-3.5 w-3.5 shrink-0 ${tone.icon}`}
                            />
                          )}

                          <span className="truncate">{card.statusText}</span>
                        </p>

                        <p className="mt-1.5 truncate text-xs text-[#7A7A7A]">
                          {card.subText}
                        </p>
                      </div>
                    </div>

                    <div className="mt-2 flex items-center justify-end">
                      <Link
                        href={card.href}
                        className={`
                  inline-flex h-8 items-center justify-center
                  rounded-lg border px-3
                  text-xs font-semibold
                  transition-colors
                  ${tone.button}
                `}
                      >
                        {card.actionLabel}
                      </Link>
                    </div>
                  </article>
                );
              })}
            </div>
          </section>
        )}

        <section>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-base font-semibold">객실 현황</h2>
            <Link
              href={withFilter("/rooms")}
              className="flex items-center gap-1 text-xs font-medium text-subtext transition-colors hover:text-primary"
            >
              전체 보기
              <ArrowRightIcon className="h-3.5 w-3.5" />
            </Link>
          </div>
          <div className="overflow-x-auto rounded-xl border border-card-border bg-card">
            <table className="w-full min-w-140 text-sm">
              <thead className="text-left text-xs text-subtext">
                <tr>
                  <th className="px-4 py-2.5 font-medium">객실</th>
                  <th className="px-4 py-2.5 font-medium">현재 상태</th>
                  <th className="px-4 py-2.5 font-medium">다음 일정</th>
                  <th className="px-4 py-2.5 font-medium">운영 상태</th>
                  <th className="px-4 py-2.5 font-medium">액션</th>
                </tr>
              </thead>
              <tbody>
                {roomsByPriority.slice(0, 6).map(({ room, task }) => {
                  const displayStatus = getRoomDisplayStatus(room, task);
                  const opState = operationalState(room, displayStatus);
                  return (
                    <tr key={room.id} className="border-t border-card-border">
                      <td className="px-4 py-2.5 whitespace-nowrap">
                        <Link
                          href={`/rooms/${room.id}`}
                          className="font-medium hover:text-primary hover:underline"
                        >
                          {room.branch} {room.room_number}호
                        </Link>
                      </td>
                      <td className="px-4 py-2.5 whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          <RoomStatusBadge status={displayStatus} />
                          {displayStatus === "ready" && (
                            <span className="inline-flex items-center gap-1 rounded-full bg-success-bg px-2 py-0.5 text-[11px] font-medium text-success-text">
                              <CheckCircleIcon className="h-3 w-3" />
                              등록완료
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-2.5 text-subtext whitespace-nowrap">
                        {nextScheduleText(room, displayStatus)}
                      </td>
                      <td className="px-4 py-2.5 whitespace-nowrap">
                        <Badge tone={opState.tone}>{opState.label}</Badge>
                      </td>
                      <td className="px-4 py-2.5 whitespace-nowrap">
                        <Link
                          href={`/rooms/${room.id}`}
                          className="font-medium text-primary hover:underline"
                        >
                          상세보기
                        </Link>
                      </td>
                    </tr>
                  );
                })}
                {roomsByPriority.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-4 py-6 text-center text-subtext">
                      객실이 없습니다.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>

        <section>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-base font-semibold">
              청소 작업{" "}
              <span className="text-subtext">
                ({cleaningTasksByPriority.length})
              </span>
            </h2>
            <Link
              href={withFilter("/cleaning")}
              className="flex items-center gap-1 text-xs font-medium text-subtext transition-colors hover:text-primary"
            >
              전체 보기
              <ArrowRightIcon className="h-3.5 w-3.5" />
            </Link>
          </div>
          <div className="overflow-x-auto rounded-xl border border-card-border bg-card">
            <table className="w-full min-w-140 text-sm">
              <thead className="text-left text-xs text-subtext">
                <tr>
                  <th className="px-4 py-2.5 font-medium">객실</th>
                  <th className="px-4 py-2.5 font-medium">청소 상태</th>
                  <th className="px-4 py-2.5 font-medium">담당자</th>
                  <th className="px-4 py-2.5 font-medium">여유 시간</th>
                  <th className="px-4 py-2.5 font-medium">액션</th>
                </tr>
              </thead>
              <tbody>
                {cleaningTasksByPriority.slice(0, 6).map(({ room, task, priority }) => (
                  <tr key={room.id} className="border-t border-card-border">
                    <td className="px-4 py-2.5 whitespace-nowrap">
                      <Link
                        href={`/rooms/${room.id}`}
                        className="font-medium hover:text-primary hover:underline"
                      >
                        {room.branch} {room.room_number}호
                      </Link>
                    </td>
                    <td className="px-4 py-2.5 text-subtext whitespace-nowrap">
                      {CLEANING_STATUS_LABEL[task!.status]}
                    </td>
                    <td className="px-4 py-2.5 text-subtext whitespace-nowrap">
                      {task!.assignee?.name ?? "미배정"}
                    </td>
                    <td className="px-4 py-2.5 whitespace-nowrap">
                      <span
                        className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                          priority.riskLevel === "urgent"
                            ? "bg-danger-bg text-danger-text"
                            : priority.riskLevel === "warning"
                            ? "bg-warning-bg text-warning-text"
                            : "bg-success-bg text-success-text"
                        }`}
                      >
                        {formatBuffer(priority.bufferMinutes)}
                      </span>
                    </td>
                    <td className="px-4 py-2.5 whitespace-nowrap">
                      <Link
                        href={`/cleaning/${task!.id}`}
                        className="font-medium text-primary hover:underline"
                      >
                        {task!.status === "unassigned" ? "배정하기" : "상세보기"}
                      </Link>
                    </td>
                  </tr>
                ))}
                {cleaningTasksByPriority.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-4 py-6 text-center text-subtext">
                      처리할 청소 작업이 없습니다.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>

        <section>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-base font-semibold">
              룸이슈{" "}
              <span className="text-subtext">({openIssues.length})</span>
            </h2>
            <Link
              href={withFilter("/issues")}
              className="flex items-center gap-1 text-xs font-medium text-subtext transition-colors hover:text-primary"
            >
              전체 보기
              <ArrowRightIcon className="h-3.5 w-3.5" />
            </Link>
          </div>
          <div className="overflow-x-auto rounded-xl border border-card-border bg-card">
            <table className="w-full min-w-140 text-sm">
              <thead className="text-left text-xs text-subtext">
                <tr>
                  <th className="px-4 py-2.5 font-medium">객실</th>
                  <th className="px-4 py-2.5 font-medium">신고 내용</th>
                  <th className="px-4 py-2.5 font-medium">신고자</th>
                  <th className="px-4 py-2.5 font-medium">긴급도</th>
                  <th className="px-4 py-2.5 font-medium">상태</th>
                  <th className="px-4 py-2.5 font-medium">액션</th>
                </tr>
              </thead>
              <tbody>
                {openIssues.slice(0, 6).map((issue) => (
                  <tr key={issue.id} className="border-t border-card-border">
                    <td className="px-4 py-2.5 whitespace-nowrap">
                      <span className="font-medium">
                        {issue.room?.branch} {issue.room?.room_number}호
                      </span>
                    </td>
                    <td className="max-w-60 truncate px-4 py-2.5 text-subtext">
                      {issue.description}
                    </td>
                    <td className="px-4 py-2.5 text-subtext whitespace-nowrap">
                      {REPORTER_TYPE_LABEL[issue.reporter_type]}
                    </td>
                    <td className="px-4 py-2.5 whitespace-nowrap">
                      <span
                        className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                          issue.urgency === "urgent"
                            ? "bg-danger-bg text-danger-text"
                            : issue.urgency === "normal"
                            ? "bg-warning-bg text-warning-text"
                            : "bg-black/5 text-foreground/60 dark:bg-white/10"
                        }`}
                      >
                        {ISSUE_URGENCY_LABEL[issue.urgency]}
                      </span>
                    </td>
                    <td className="px-4 py-2.5 whitespace-nowrap">
                      <IssueStatusBadge status={issue.status} />
                    </td>
                    <td className="px-4 py-2.5 whitespace-nowrap">
                      <Link
                        href={`/issues/${issue.id}`}
                        className="font-medium text-primary hover:underline"
                      >
                        확인하기
                      </Link>
                    </td>
                  </tr>
                ))}
                {openIssues.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-4 py-6 text-center text-subtext">
                      미처리 이슈가 없습니다.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      </div>

      <aside className="hidden w-72 shrink-0 flex-col gap-4 xl:flex">
        <CrewStatusCard crew={crew} href={withFilter("/cleaning")} />

        <div className="rounded-xl border border-card-border bg-card p-4">
          <h2 className="mb-3 text-sm font-semibold">객실 상태 분포</h2>
          <RoomStatusDonut
            distribution={roomStatusDistribution}
            total={totalRooms}
          />
        </div>

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
                <span className="shrink-0 text-subtext">
                  {formatTime(item.time)}
                </span>
              </li>
            ))}
            {activity.length === 0 && (
              <li className="py-2 text-center text-sm text-subtext">
                최근 활동이 없습니다.
              </li>
            )}
          </ul>
        </div>

        <div className="rounded-xl border border-card-border bg-card p-4">
          <div className="mb-2 flex items-center gap-2">
            <LightbulbIcon className="h-4 w-4 text-primary" />
            <h2 className="text-sm font-semibold">운영 팁</h2>
          </div>
          {checkinPeakHour !== null ? (
            <p className="text-xs text-subtext">
              체크인 피크 시간: 오늘 {checkinPeakHour}:00 -{" "}
              {checkinPeakHour + 1}:00 사이에 체크인이 집중됩니다.
            </p>
          ) : summary.unassigned > 0 ? (
            <p className="text-xs text-subtext">
              현재 미배정 청소가 {summary.unassigned}건 있습니다. 크루를 배정해
              주세요.
            </p>
          ) : (
            <p className="text-xs text-subtext">
              오늘 처리할 긴급 작업이 없습니다.
            </p>
          )}
          <Link
            href={withFilter("/cleaning")}
            className="mt-3 block rounded-lg bg-primary py-1.5 text-center text-xs font-medium text-white transition-colors hover:bg-primary-hover"
          >
            크루 추가 배정하기
          </Link>
        </div>
      </aside>
    </div>
  );
}
