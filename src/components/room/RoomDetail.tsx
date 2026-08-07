import Link from "next/link";
import {
  CleaningStatusBadge,
  IssueStatusBadge,
  UrgencyBadge,
} from "@/components/common/StatusBadges";
import { Badge } from "@/components/common/Badge";
import { DoorLockField } from "@/components/room/DoorLockField";
import { CopyButton } from "@/components/common/CopyButton";
import { AIIssueSummary } from "@/components/issue/AIIssueSummary";
import { RoomModalHeader } from "@/components/common/RoomModalHeader";
import { CheckoutButton } from "@/components/room/CheckoutButton";
import { ISSUE_CATEGORY_LABEL, issueNextActionLabel } from "@/lib/labels";
import {
  formatDateTimeWithDay,
  formatDuration,
  formatBuffer,
  isToday,
  minutesUntil,
  summarizeNames,
} from "@/lib/format";
import {
  CalendarIcon,
  CheckCircleIcon,
  CrewIcon,
  IssueIcon,
  LockIcon,
} from "@/components/common/icons";
import type { CleaningTask, Issue, Room, Staff } from "@/lib/types";
import type { RoomActivityItem } from "@/lib/queries";
import type { RoomPriority } from "@/lib/priority";

export function RoomDetail({
  room,
  task,
  issues,
  priority,
  managers,
  activity,
  compact = false,
}: {
  room: Room;
  task: CleaningTask | null;
  issues: Issue[];
  priority: RoomPriority;
  managers: Staff[];
  activity: RoomActivityItem[];
  compact?: boolean;
}) {
  const defaultManager = room.property?.manager ?? null;
  const checkedIn = room.occupancy_status === "occupied";
  const hasGuest = Boolean(room.guest_name);
  const isCombinedView = compact;

  const plannedCheckout =
    checkedIn || !room.next_checkin_at || !room.nights
      ? room.checkout_at
      : new Date(
          new Date(room.next_checkin_at).getTime() + room.nights * 86_400_000
        ).toISOString();

  const minsUntilCheckin = minutesUntil(room.next_checkin_at);

  const hasCheckinCountdown =
    !checkedIn && minsUntilCheckin !== null && minsUntilCheckin > 0;

  return (
    <div className="flex flex-col gap-5">
      <RoomModalHeader
        room={room}
        task={task}
        managerControl={{
          managerId: defaultManager?.id ?? null,
          managerName: defaultManager?.name ?? null,
          defaultManagerId: defaultManager?.id ?? null,
          managers,
          target: { kind: "property", id: room.property?.id ?? "" },
        }}
        cleaningCrewName={task?.assignee?.name ?? null}
        issueCrewName={
          issues.length > 0
            ? summarizeNames(issues.map((issue) => issue.assignee?.name))
            : undefined
        }
        operationControl={{
          roomOpenIssueCount: issues.length,
        }}
      />

      {!isCombinedView && (
        <section className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,3fr)_minmax(240px,1fr)]">
          <ReservationCard
            room={room}
            checkedIn={checkedIn}
            hasGuest={hasGuest}
            plannedCheckout={plannedCheckout}
            minsUntilCheckin={minsUntilCheckin}
            hasCheckinCountdown={hasCheckinCountdown}
          />

          <AccessCard doorLockCode={room.door_lock_code} />
        </section>
      )}

      <section>
        <SectionHeading
          title="객실 운영 현황"
          description="청소 진행 상태와 현재 접수된 이슈를 확인합니다."
        />

        <div className="mt-3 grid grid-cols-1 items-start gap-4 lg:grid-cols-[minmax(0,1.65fr)_minmax(320px,1fr)]">
          <CleaningStatusCard
            task={task}
            priority={priority}
            minsUntilCheckin={minsUntilCheckin}
            hasNextCheckin={Boolean(room.next_checkin_at)}
          />

          <IssueListCard issues={issues} />
        </div>
      </section>

      {!isCombinedView && (
        <>
          <ActivityCard activity={activity} />

          {issues.length > 0 && (
            <AIIssueSummary
              issues={issues.map((issue) => ({
                category: ISSUE_CATEGORY_LABEL[issue.category],
                description: issue.description,
                urgency: issue.urgency,
              }))}
            />
          )}
        </>
      )}
    </div>
  );
}

function ReservationCard({
  room,
  checkedIn,
  hasGuest,
  plannedCheckout,
  minsUntilCheckin,
  hasCheckinCountdown,
}: {
  room: Room;
  checkedIn: boolean;
  hasGuest: boolean;
  plannedCheckout: string | null;
  minsUntilCheckin: number | null;
  hasCheckinCountdown: boolean;
}) {
  return (
    <Card>
      <div className="mb-5 flex items-start justify-between gap-4">
        <CardHeader
          icon={<CalendarIcon className="h-4 w-4" />}
          title="예약 정보"
          description="현재 및 다음 투숙 일정을 확인합니다."
          className="mb-0"
        />

        {checkedIn && <CheckoutButton roomId={room.id} />}
      </div>

      {hasGuest ? (
        <>
          <div className="grid grid-cols-2 gap-x-5 gap-y-5 sm:grid-cols-4">
            <Field label="예약자">{room.guest_name}</Field>

            <Field label="연락처">
              {room.guest_phone ? (
                <span className="flex items-center gap-1">
                  {room.guest_phone}
                  <CopyButton value={room.guest_phone} />
                </span>
              ) : (
                "-"
              )}
            </Field>

            <Field label="투숙 인원">
              {room.guest_count ? `${room.guest_count}명` : "-"}
            </Field>

            <Field label="숙박 기간">
              {room.nights ? `${room.nights}박` : "-"}
            </Field>
          </div>

          <div className="my-5 border-t border-black/5 dark:border-white/10" />

          <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
            <Field label="체크인">
              <div className="flex flex-wrap items-center gap-2">
                <span className="whitespace-nowrap">
                  {formatDateTimeWithDay(room.next_checkin_at)}
                </span>

                {isToday(room.next_checkin_at) && (
                  <Badge tone="info">오늘</Badge>
                )}
              </div>
            </Field>

            <Field label="체크아웃">
              <span className="whitespace-nowrap">
                {formatDateTimeWithDay(plannedCheckout)}
              </span>
            </Field>

            <Field label="결제">
              <div className="flex flex-wrap items-center gap-2">
                <Badge
                  tone={room.payment_status === "paid" ? "success" : "warning"}
                >
                  {room.payment_status === "paid" ? "결제 완료" : "미결제"}
                </Badge>

                <span className="text-sm font-semibold">
                  {room.payment_amount
                    ? `${room.payment_amount.toLocaleString()}원`
                    : "-"}
                </span>
              </div>
            </Field>
          </div>

          {hasCheckinCountdown && minsUntilCheckin !== null && (
            <CountdownBanner tone="info">
              다음 체크인까지 {formatDuration(minsUntilCheckin)} 남았습니다.
            </CountdownBanner>
          )}
        </>
      ) : (
        <EmptyState
          title="예정된 예약이 없습니다."
          description="새로운 체크인 일정이 등록되면 이곳에 표시됩니다."
        />
      )}
    </Card>
  );
}

function AccessCard({ doorLockCode }: { doorLockCode: string | null }) {
  return (
    <Card>
      <CardHeader
        icon={<LockIcon className="h-4 w-4" />}
        title="출입 정보"
        description="객실 도어락 정보를 확인합니다."
      />

      <div className="rounded-xl border border-black/5 bg-black/[0.02] p-4 dark:border-white/10 dark:bg-white/[0.03]">
        <DoorLockField code={doorLockCode ?? "-"} />
      </div>

      <p className="mt-3 text-[11px] leading-5 text-subtext">
        출입 정보는 업무 목적에 필요한 담당자에게만 공유해 주세요.
      </p>
    </Card>
  );
}

function CleaningStatusCard({
  task,
  priority,
  minsUntilCheckin,
  hasNextCheckin,
}: {
  task: CleaningTask | null;
  priority: RoomPriority;
  minsUntilCheckin: number | null;
  hasNextCheckin: boolean;
}) {
  return (
    <Card>
      <div className="mb-5 flex items-start justify-between gap-4">
        <CardHeader
          icon={<CrewIcon className="h-4 w-4" />}
          title="청소 진행 상태"
          description="현재 객실의 청소 일정과 담당 크루입니다."
          className="mb-0"
        />

        {task && <CleaningStatusBadge status={task.status} />}
      </div>

      {task ? (
        <>
          <div className="grid grid-cols-2 gap-x-5 gap-y-5 sm:grid-cols-3">
            <Field label="담당 크루">
              {task.assignee?.name ?? (
                <span className="text-amber-600 dark:text-amber-400">
                  미배정
                </span>
              )}
            </Field>

            <Field label="예상 소요 시간">{task.estimated_minutes}분</Field>

            <Field label="청소 시작">
              {task.started_at
                ? formatDateTimeWithDay(task.started_at)
                : "시작 전"}
            </Field>
          </div>

          {task.status !== "done" && hasNextCheckin && priority.bufferMinutes !== null && (
            <CountdownBanner
              tone={priority.riskLevel === "urgent" ? "danger" : "warning"}
            >
              <span>
                다음 체크인까지{" "}
                {formatDuration(Math.max(minsUntilCheckin ?? 0, 0))} 남음
              </span>

              <span className="mx-1.5 opacity-40">·</span>

              <span>청소 여유 {formatBuffer(priority.bufferMinutes)}</span>
            </CountdownBanner>
          )}
          <div className="flex justify-end w-full">
            <DetailLink href={`/cleaning/${task.id}`}>
              청소 작업 열기
            </DetailLink>
          </div>
        </>
      ) : (
        <EmptyState
          title="진행할 청소 작업이 없습니다."
          description="체크아웃 처리 시 청소 작업이 자동으로 생성됩니다."
        />
      )}
    </Card>
  );
}

function IssueListCard({ issues }: { issues: Issue[] }) {
  return (
    <Card>
      <div className="mb-4 flex items-start justify-between gap-3">
        <CardHeader
          icon={<IssueIcon className="h-4 w-4" />}
          title="운영 이슈"
          description="현재 접수된 문제와 처리 상태입니다."
          className="mb-0"
        />

        {issues.length > 0 && (
          <Badge tone="danger">진행 중 {issues.length}건</Badge>
        )}
      </div>

      {issues.length > 0 ? (
        <ul className="flex flex-col gap-2">
          {issues.map((issue) => (
            <li key={issue.id}>
              <Link
                href={`/issues/${issue.id}`}
                className="group block rounded-xl border border-black/5 bg-black/[0.015] p-3.5 transition hover:border-primary/20 hover:bg-primary/[0.03] dark:border-white/10 dark:bg-white/[0.02]"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-sm font-semibold">
                        {ISSUE_CATEGORY_LABEL[issue.category]}
                      </span>

                      <UrgencyBadge urgency={issue.urgency} />
                    </div>

                    <p className="mt-2 line-clamp-2 text-xs leading-5 text-subtext">
                      {issue.description}
                    </p>
                  </div>

                  <span className="shrink-0 whitespace-nowrap text-[11px] text-subtext">
                    {formatDateTimeWithDay(issue.created_at)}
                  </span>
                </div>

                <div className="mt-3 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <IssueStatusBadge status={issue.status} />

                    <span className="flex items-center gap-1 text-[11px] text-subtext">
                      <CrewIcon className="h-3 w-3" />
                      {issue.assignee?.name ?? (
                        <span className="text-amber-600 dark:text-amber-400">
                          미배정
                        </span>
                      )}
                    </span>
                  </div>

                  {issueNextActionLabel(issue.status, Boolean(issue.assignee)) && (
                    <span className="text-xs font-medium text-primary">
                      {issueNextActionLabel(issue.status, Boolean(issue.assignee))}
                    </span>
                  )}
                </div>
              </Link>
            </li>
          ))}
        </ul>
      ) : (
        <EmptyState
          title="등록된 운영 이슈가 없습니다."
          description="현재 확인이 필요한 문제 없이 정상 운영 중입니다."
          tone="success"
        />
      )}
    </Card>
  );
}

function ActivityCard({ activity }: { activity: RoomActivityItem[] }) {
  return (
    <section>
      <SectionHeading
        title="최근 활동"
        description="객실에서 발생한 최근 작업과 상태 변경 기록입니다."
      />

      <Card className="mt-3">
        {activity.length > 0 ? (
          <ol className="relative">
            {activity.slice(0, 8).map((item, index) => (
              <ActivityRow
                key={item.id}
                item={item}
                isLast={index === Math.min(activity.length, 8) - 1}
              />
            ))}
          </ol>
        ) : (
          <EmptyState
            title="최근 활동이 없습니다."
            description="청소 배정이나 이슈 변경 내역이 생기면 표시됩니다."
          />
        )}
      </Card>
    </section>
  );
}

function ActivityRow({
  item,
  isLast,
}: {
  item: RoomActivityItem;
  isLast: boolean;
}) {
  return (
    <li className="relative flex gap-3">
      {!isLast && (
        <span className="absolute left-[15px] top-8 h-[calc(100%-8px)] w-px bg-black/10 dark:bg-white/10" />
      )}

      <div className="relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-black/5 bg-card dark:border-white/10">
        <ActivityIcon item={item} />
      </div>

      <div className={["min-w-0 flex-1 pb-5", isLast ? "pb-0" : ""].join(" ")}>
        <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1">
          <div className="min-w-0">
            <span className="text-sm font-medium">
              {item.actorName ?? item.actorRole}
            </span>

            {item.actorName && (
              <span className="ml-1.5 text-xs text-subtext">
                {item.actorRole}
              </span>
            )}
          </div>

          <time className="shrink-0 text-[11px] text-subtext">
            {formatActivityTime(item.time)}
          </time>
        </div>

        <p className="mt-1 text-sm text-foreground/80">{item.action}</p>

        {item.detail && (
          <p className="mt-1.5 inline-block rounded-md bg-black/[0.035] px-2 py-1 text-xs text-subtext dark:bg-white/[0.06]">
            {item.detail}
          </p>
        )}
      </div>
    </li>
  );
}

function SectionHeading({
  title,
  description,
}: {
  title: string;
  description?: string;
}) {
  return (
    <div>
      <h2 className="text-sm font-semibold">{title}</h2>

      {description && (
        <p className="mt-1 text-xs text-subtext">{description}</p>
      )}
    </div>
  );
}

function Card({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={[
        "rounded-xl border border-card-border bg-card p-5",
        className,
      ].join(" ")}
    >
      {children}
    </div>
  );
}

function CardHeader({
  icon,
  title,
  description,
  className = "",
}: {
  icon: React.ReactNode;
  title: string;
  description?: string;
  className?: string;
}) {
  return (
    <div className={["mb-5 flex items-start gap-3", className].join(" ")}>
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
        {icon}
      </span>

      <div className="min-w-0">
        <h3 className="text-sm font-semibold">{title}</h3>

        {description && (
          <p className="mt-0.5 text-xs leading-5 text-subtext">{description}</p>
        )}
      </div>
    </div>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="min-w-0">
      <div className="text-xs text-subtext">{label}</div>

      <div className="mt-1.5 break-words text-sm font-medium">{children}</div>
    </div>
  );
}

function CountdownBanner({
  children,
  tone = "warning",
}: {
  children: React.ReactNode;
  tone?: "info" | "warning" | "danger";
}) {
  const toneClasses = {
    info: "border-blue-100 bg-blue-50 text-blue-700 dark:border-blue-900/40 dark:bg-blue-950/30 dark:text-blue-300",
    warning:
      "border-amber-100 bg-amber-50 text-amber-800 dark:border-amber-900/40 dark:bg-amber-950/30 dark:text-amber-300",
    danger:
      "border-red-100 bg-red-50 text-red-700 dark:border-red-900/40 dark:bg-red-950/30 dark:text-red-300",
  };

  return (
    <div
      className={[
        "mt-4 flex items-center rounded-lg border px-3 py-2.5 text-xs font-medium",
        toneClasses[tone],
      ].join(" ")}
    >
      <span aria-hidden="true" className="mr-2">
        ⏱
      </span>

      <span>{children}</span>
    </div>
  );
}

function EmptyState({
  title,
  description,
  tone = "default",
}: {
  title: string;
  description?: string;
  tone?: "default" | "success";
}) {
  return (
    <div
      className={[
        "flex min-h-28 flex-col items-center justify-center rounded-xl border border-dashed px-4 py-6 text-center",
        tone === "success"
          ? "border-green-200 bg-green-50/50 dark:border-green-900/40 dark:bg-green-950/20"
          : "border-black/10 bg-black/[0.015] dark:border-white/10 dark:bg-white/[0.02]",
      ].join(" ")}
    >
      {tone === "success" && (
        <CheckCircleIcon className="mb-2 h-5 w-5 text-green-600 dark:text-green-400" />
      )}

      <p className="text-sm font-medium">{title}</p>

      {description && (
        <p className="mt-1 max-w-sm text-xs leading-5 text-subtext">
          {description}
        </p>
      )}
    </div>
  );
}

function DetailLink({
  href,
  children,
}: {
  href: string;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className="mt-4 flex h-9 w-fit items-center rounded-lg border border-primary/15 bg-primary/[0.05] px-3 text-xs font-semibold text-primary transition hover:bg-primary/10"
    >
      {children}
      <span className="ml-1.5">→</span>
    </Link>
  );
}

function formatActivityTime(time: Date) {
  return isToday(time.toISOString())
    ? time.toLocaleTimeString("ko-KR", {
        hour: "2-digit",
        minute: "2-digit",
      })
    : time.toLocaleString("ko-KR", {
        month: "numeric",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
}

function ActivityIcon({ item }: { item: RoomActivityItem }) {
  if (item.done) {
    return (
      <CheckCircleIcon className="h-4 w-4 text-green-600 dark:text-green-400" />
    );
  }

  if (item.kind === "issue") {
    return <IssueIcon className="h-4 w-4 text-red-500 dark:text-red-400" />;
  }

  return <CrewIcon className="h-4 w-4 text-blue-500 dark:text-blue-400" />;
}
