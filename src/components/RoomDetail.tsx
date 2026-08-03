import Link from "next/link";
import {
  CleaningStatusBadge,
  IssueStatusBadge,
  RoomStatusBadge,
  UrgencyBadge,
} from "@/components/StatusBadges";
import { Badge } from "@/components/Badge";
import { DoorLockField } from "@/components/DoorLockField";
import { AIIssueSummary } from "@/components/AIIssueSummary";
import { ISSUE_CATEGORY_LABEL } from "@/lib/labels";
import {
  formatDateTimeWithDay,
  formatDuration,
  formatBuffer,
  isToday,
  minutesUntil,
} from "@/lib/format";
import { regionForBranch } from "@/lib/regions";
import {
  CalendarIcon,
  CheckCircleIcon,
  CrewIcon,
  IssueIcon,
  LocationIcon,
  LockIcon,
} from "@/components/icons";
import type { CleaningTask, Issue, Room, Staff } from "@/lib/types";
import type { RoomActivityItem } from "@/lib/queries";
import type { RoomPriority } from "@/lib/priority";

export function RoomDetail({
  room,
  task,
  issues,
  priority,
  operator,
  activity,
}: {
  room: Room;
  task: CleaningTask | null;
  issues: Issue[];
  priority: RoomPriority;
  operator: Staff | null;
  activity: RoomActivityItem[];
}) {
  const checkedIn = room.status === "occupied";
  const hasGuest = Boolean(room.guest_name);
  const plannedCheckout =
    checkedIn || !room.next_checkin_at || !room.nights
      ? room.checkout_at
      : new Date(
          new Date(room.next_checkin_at).getTime() + room.nights * 86400000
        ).toISOString();

  const region = regionForBranch(room.branch);
  const minsUntilCheckin = minutesUntil(room.next_checkin_at);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400">
            <LocationIcon className="h-3.5 w-3.5" />
            <span>{room.branch}</span>
          </div>
          <div className="mt-1 flex items-center gap-2">
            <h2 className="text-xl font-semibold">{room.room_number}호</h2>
            <RoomStatusBadge status={room.status} />
          </div>
          {region && (
            <div className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              {region.city} &gt; {region.district}
            </div>
          )}
        </div>

        <div className="flex items-center gap-5">
          <PersonField label="담당 운영자" name={operator?.name ?? null} sub={room.branch} />
          <PersonField label="담당 크루" name={task?.assignee?.name ?? null} />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[3fr_1fr]">
        <div className="rounded-lg border border-black/10 p-4 dark:border-white/10">
          <div className="mb-3 flex items-center gap-1.5 text-sm font-medium">
            <CalendarIcon className="h-4 w-4 text-primary" />
            예약 정보
          </div>
          {hasGuest ? (
            <>
              <div className="grid grid-cols-2 gap-4 text-sm sm:grid-cols-4">
                <Field label="예약자">{room.guest_name}</Field>
                <Field label="연락처">{room.guest_phone ?? "-"}</Field>
                <Field label="인원">
                  {room.guest_count ? `${room.guest_count}명` : "-"}
                </Field>
                <Field label="숙박">{room.nights}박</Field>
              </div>
              <div className="mt-4 grid grid-cols-1 gap-4 text-sm sm:grid-cols-3">
                <Field label="체크인">
                  <span className="flex flex-wrap items-center gap-1.5">
                    <span className="whitespace-nowrap">
                      {formatDateTimeWithDay(room.next_checkin_at)}
                    </span>
                    {isToday(room.next_checkin_at) && <Badge tone="info">오늘</Badge>}
                  </span>
                </Field>
                <Field label="체크아웃">
                  <span className="whitespace-nowrap">
                    {formatDateTimeWithDay(plannedCheckout)}
                  </span>
                </Field>
                <Field label="결제 상태">
                  <span className="flex flex-col gap-1">
                    <Badge tone={room.payment_status === "paid" ? "success" : "warning"}>
                      {room.payment_status === "paid" ? "결제 완료" : "미결제"}
                    </Badge>
                    <span className="text-sm">
                      {room.payment_amount
                        ? `${room.payment_amount.toLocaleString()}원`
                        : "-"}
                    </span>
                  </span>
                </Field>
              </div>
              {!checkedIn && minsUntilCheckin !== null && minsUntilCheckin > 0 && (
                <CountdownBanner>
                  다음 체크인까지 {formatDuration(minsUntilCheckin)} 남음
                </CountdownBanner>
              )}
            </>
          ) : (
            <p className="text-sm text-gray-500 dark:text-gray-400">
              예정된 예약이 없습니다.
            </p>
          )}
        </div>

        <div className="rounded-lg border border-black/10 p-4 dark:border-white/10">
          <div className="mb-3 flex items-center gap-1.5 text-sm font-medium">
            <LockIcon className="h-4 w-4 text-primary" />
            출입 정보
          </div>
          <DoorLockField code={room.door_lock_code ?? "-"} />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[2.5fr_1.5fr]">
        <div className="rounded-lg border border-black/10 p-4 dark:border-white/10">
          <div className="mb-3 text-sm font-medium">청소 진행 상태</div>
          {task ? (
            <>
              <div className="grid grid-cols-2 gap-4 text-sm sm:grid-cols-4">
                <Field label="상태">
                  <CleaningStatusBadge status={task.status} />
                </Field>
                <Field label="담당 크루">{task.assignee?.name ?? "미배정"}</Field>
                <Field label="예상 소요 시간">{task.estimated_minutes}분</Field>
                <Field label="시작 시각">{formatDateTimeWithDay(task.started_at)}</Field>
              </div>
              {room.next_checkin_at && priority.bufferMinutes !== null && (
                <CountdownBanner tone={priority.riskLevel === "urgent" ? "danger" : "warning"}>
                  다음 체크인까지 {formatDuration(minsUntilCheckin ?? 0)} 남음 (
                  {formatBuffer(priority.bufferMinutes)})
                </CountdownBanner>
              )}
              <Link
                href={`/cleaning/${task.id}`}
                className="mt-3 inline-block text-xs font-medium text-primary hover:underline"
              >
                청소 작업 열기 →
              </Link>
            </>
          ) : (
            <p className="text-sm text-gray-500 dark:text-gray-400">
              등록된 청소 작업이 없습니다.
            </p>
          )}
        </div>

        <div className="rounded-lg border border-black/10 p-4 dark:border-white/10">
          <div className="mb-3 flex items-center justify-between">
            <div className="text-sm font-medium">객실 이슈</div>
            {issues.length > 0 && <Badge tone="danger">진행 중 {issues.length}건</Badge>}
          </div>
          {issues.length > 0 ? (
            <ul className="flex flex-col gap-2">
              {issues.map((issue) => (
                <li key={issue.id}>
                  <Link
                    href={`/issues/${issue.id}`}
                    className="flex flex-col gap-1 rounded-lg border border-black/5 p-3 transition-colors hover:bg-black/3 dark:border-white/10 dark:hover:bg-white/5"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-sm font-medium">
                        {ISSUE_CATEGORY_LABEL[issue.category]}
                      </span>
                      <span className="shrink-0 text-xs text-gray-500 dark:text-gray-400">
                        {formatDateTimeWithDay(issue.created_at)}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {issue.description}
                    </p>
                    <div className="flex items-center gap-2">
                      <UrgencyBadge urgency={issue.urgency} />
                      <IssueStatusBadge status={issue.status} />
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-gray-500 dark:text-gray-400">
              등록된 객실 이슈가 없습니다.
            </p>
          )}
          {issues.length > 0 && (
            <Link
              href={`/issues/${issues[0].id}`}
              className="mt-3 inline-block text-xs font-medium text-primary hover:underline"
            >
              이슈 상세 보기 →
            </Link>
          )}
        </div>
      </div>

      <div className="rounded-lg border border-black/10 p-4 dark:border-white/10">
        <div className="mb-3 text-sm font-medium">최근 활동</div>
        {activity.length > 0 ? (
          <ul className="flex flex-col gap-3">
            {activity.slice(0, 8).map((item) => (
              <li key={item.id} className="flex items-center gap-3 text-xs">
                <span className="w-12 shrink-0 text-gray-400 dark:text-gray-500">
                  {item.time.toLocaleTimeString("ko-KR", {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
                <ActivityIcon item={item} />
                <span className="w-28 shrink-0 truncate font-medium">
                  {item.actorName ?? item.actorRole}
                  {item.actorName && (
                    <span className="ml-1 font-normal text-gray-500 dark:text-gray-400">
                      {item.actorRole}
                    </span>
                  )}
                </span>
                <span className="w-40 shrink-0 truncate text-foreground/80">
                  {item.action}
                </span>
                {item.detail && (
                  <span className="max-w-56 min-w-0 truncate rounded-full bg-black/5 px-2 py-0.5 text-[11px] text-gray-500 dark:bg-white/10 dark:text-gray-400">
                    {item.detail}
                  </span>
                )}
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-gray-500 dark:text-gray-400">
            최근 활동이 없습니다.
          </p>
        )}
      </div>

      {issues.length > 0 && (
        <AIIssueSummary
          issues={issues.map((i) => ({
            category: ISSUE_CATEGORY_LABEL[i.category],
            description: i.description,
            urgency: i.urgency,
          }))}
        />
      )}
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="text-xs text-gray-500 dark:text-gray-400">{label}</div>
      <div className="mt-1 text-sm">{children}</div>
    </div>
  );
}

function PersonField({
  label,
  name,
  sub,
}: {
  label: string;
  name: string | null;
  sub?: string;
}) {
  return (
    <div className="flex items-center gap-2">
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-sage text-xs font-semibold text-primary-hover">
        {name ? name.slice(0, 1) : "-"}
      </div>
      <div className="leading-tight">
        <div className="text-[11px] whitespace-nowrap text-gray-500 dark:text-gray-400">
          {label}
        </div>
        <div className="text-sm font-medium whitespace-nowrap">{name ?? "미배정"}</div>
        {name && sub && (
          <div className="text-[11px] whitespace-nowrap text-gray-500 dark:text-gray-400">
            {sub}
          </div>
        )}
      </div>
    </div>
  );
}

function CountdownBanner({
  children,
  tone = "warning",
}: {
  children: React.ReactNode;
  tone?: "warning" | "danger";
}) {
  const toneClasses =
    tone === "danger"
      ? "bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-300"
      : "bg-amber-50 text-amber-800 dark:bg-amber-900/20 dark:text-amber-300";
  return (
    <div className={`mt-4 rounded-lg px-3 py-2 text-xs font-medium ${toneClasses}`}>
      ⏰ {children}
    </div>
  );
}

function ActivityIcon({ item }: { item: RoomActivityItem }) {
  if (item.done) {
    return <CheckCircleIcon className="h-4 w-4 shrink-0 text-green-600 dark:text-green-400" />;
  }
  if (item.kind === "issue") {
    return <IssueIcon className="h-4 w-4 shrink-0 text-red-500 dark:text-red-400" />;
  }
  return <CrewIcon className="h-4 w-4 shrink-0 text-blue-500 dark:text-blue-400" />;
}
