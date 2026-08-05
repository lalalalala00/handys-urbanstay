import Link from "next/link";
import { getCleaningTasksList } from "@/lib/queries";
import {
  CleaningStatusBadge,
  RiskBadge,
  CLEANING_TONE,
} from "@/components/StatusBadges";

import { formatBuffer, formatDateTime, formatRelative } from "@/lib/format";
import type { CleaningTaskStatus } from "@/lib/types";
import { StatusTabs } from "@/components/StatusTabs";
import { ClickableTableRow } from "@/components/ClickableTableRow";

export const dynamic = "force-dynamic";

const STATUS_GROUPS = [
  { status: "unassigned", label: "미배정" },
  { status: "assigned", label: "배정 완료" },
  { status: "cleaning", label: "진행 중" },
  { status: "inspection", label: "검수 대기" },
  { status: "done", label: "완료" },
] as const satisfies {
  status: CleaningTaskStatus;
  label: string;
}[];

export default async function CleaningTasksPage({
  searchParams,
}: {
  searchParams: Promise<{
    branch?: string;
    region?: string;
    status?: string;
  }>;
}) {
  const { branch, region, status } = await searchParams;

  const tasks = await getCleaningTasksList({
    branch,
    region,
  });

  const activeStatus = STATUS_GROUPS.some((group) => group.status === status)
    ? (status as CleaningTaskStatus)
    : undefined;

  const filteredTasks = activeStatus
    ? tasks.filter((task) => task.status === activeStatus)
    : tasks;

  const baseParams = new URLSearchParams();

  if (branch) {
    baseParams.set("branch", branch);
  }

  if (region) {
    baseParams.set("region", region);
  }

  function hrefFor(next: CleaningTaskStatus | null) {
    const params = new URLSearchParams(baseParams);

    if (next) {
      params.set("status", next);
    }

    const queryString = params.toString();

    return queryString ? `/cleaning?${queryString}` : "/cleaning";
  }

  const counts = Object.fromEntries(
    STATUS_GROUPS.map((group) => [
      group.status,
      tasks.filter((task) => task.status === group.status).length,
    ])
  ) as Record<CleaningTaskStatus, number>;

  const unresolvedCount = tasks.filter((task) => task.status !== "done").length;

  const unassignedCount = tasks.filter(
    (task) => task.status === "unassigned"
  ).length;

  const urgentCount = tasks.filter(
    (task) => task.status !== "done" && task.priority.riskLevel === "urgent"
  ).length;

  return (
    <div className="flex flex-col gap-5">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-lg font-semibold">청소 작업</h1>

            {unresolvedCount > 0 && (
              <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-semibold text-primary">
                진행 중 {unresolvedCount}
              </span>
            )}
          </div>

          <p className="mt-1 text-xs text-subtext">
            객실별 청소 일정과 배정 현황을 확인합니다.
          </p>
        </div>
      </header>

      {(urgentCount > 0 || unassignedCount > 0) && (
        <CleaningAlertBanner
          urgentCount={urgentCount}
          unassignedCount={unassignedCount}
          hrefFor={hrefFor}
        />
      )}
      <StatusTabs
        groups={STATUS_GROUPS.map((group) => ({
          ...group,
          tone: CLEANING_TONE[group.status],
        }))}
        counts={counts}
        totalCount={tasks.length}
        activeStatus={activeStatus}
        hrefFor={hrefFor}
        ariaLabel="청소 작업 상태 필터"
      />

      <section className="overflow-hidden rounded-xl border border-card-border bg-card">
        <div className="flex items-center justify-between border-b border-card-border px-4 py-3">
          <div>
            <h2 className="text-sm font-semibold">
              {activeStatus
                ? STATUS_GROUPS.find((group) => group.status === activeStatus)
                    ?.label
                : "전체 청소 작업"}
            </h2>

            <p className="mt-0.5 text-xs text-subtext">
              총 {filteredTasks.length}건
            </p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[940px] text-sm">
            <thead className="bg-black/[0.025] text-left dark:bg-white/[0.03]">
              <tr className="text-xs text-subtext">
                <th className="w-[170px] px-4 py-3 font-medium">객실</th>

                <th className="w-[120px] px-4 py-3 font-medium">상태</th>

                <th className="w-[145px] px-4 py-3 font-medium">체크아웃</th>

                <th className="w-[145px] px-4 py-3 font-medium">다음 체크인</th>

                <th className="w-[120px] px-4 py-3 font-medium">여유 시간</th>

                <th className="w-[100px] px-4 py-3 font-medium">예상 소요</th>

                <th className="w-[140px] px-4 py-3 font-medium">담당 크루</th>

                <th className="w-28 px-4 py-3 font-medium">액션</th>
              </tr>
            </thead>

            <tbody>
              {filteredTasks.map((task) => {
                const isUrgent =
                  task.status !== "done" &&
                  task.priority.riskLevel === "urgent";

                const isUnassigned = task.status === "unassigned";

                return (
                  <ClickableTableRow
                    key={task.id}
                    href={`/cleaning/${task.id}`}
                    className={[
                      "group border-t border-card-border transition-colors",
                      isUrgent
                        ? "bg-red-50/40 hover:bg-red-50/70 dark:bg-red-950/10 dark:hover:bg-red-950/20"
                        : isUnassigned
                        ? "bg-amber-50/30 hover:bg-amber-50/60 dark:bg-amber-950/10 dark:hover:bg-amber-950/20"
                        : "hover:bg-black/[0.02] dark:hover:bg-white/[0.025]",
                    ].join(" ")}
                  >
                    <td className="px-4 py-3.5">
                      <Link
                        href={task.room ? `/rooms/${task.room.id}` : `/cleaning/${task.id}`}
                        className="block"
                      >
                        <p className="font-semibold">
                          {task.room?.room_number
                            ? `${task.room.room_number}호`
                            : "객실 정보 없음"}
                        </p>

                        <p className="mt-0.5 max-w-[150px] truncate text-xs text-subtext">
                          {task.room?.branch ?? "-"}
                        </p>
                      </Link>
                    </td>

                    <td className="px-4 py-3.5">
                      <Link href={`/cleaning/${task.id}`} className="block">
                        <CleaningStatusBadge status={task.status} />
                      </Link>
                    </td>

                    <td className="px-4 py-3.5">
                      <Link href={`/cleaning/${task.id}`} className="block">
                        <span className="whitespace-nowrap text-xs text-subtext">
                          {formatDateTime(task.room?.checkout_at ?? null)}
                        </span>
                      </Link>
                    </td>

                    <td className="px-4 py-3.5">
                      <Link href={`/cleaning/${task.id}`} className="block">
                        <div className="flex flex-col gap-0.5">
                          <span
                            className={[
                              "whitespace-nowrap text-sm font-medium",
                              isUrgent
                                ? "text-red-600 dark:text-red-400"
                                : "text-foreground/80",
                            ].join(" ")}
                          >
                            {formatRelative(task.room?.next_checkin_at ?? null)}
                          </span>

                          {task.room?.next_checkin_at && (
                            <span className="whitespace-nowrap text-[11px] text-subtext">
                              {formatDateTime(task.room.next_checkin_at)}
                            </span>
                          )}
                        </div>
                      </Link>
                    </td>

                    <td className="px-4 py-3.5">
                      <Link href={`/cleaning/${task.id}`} className="block">
                        <RiskBadge
                          level={task.priority.riskLevel}
                          label={formatBuffer(task.priority.bufferMinutes)}
                        />
                      </Link>
                    </td>

                    <td className="px-4 py-3.5">
                      <Link href={`/cleaning/${task.id}`} className="block">
                        <span className="text-sm text-foreground/75">
                          {task.estimated_minutes}분
                        </span>
                      </Link>
                    </td>

                    <td className="px-4 py-3.5">
                      <Link href={`/cleaning/${task.id}`} className="block">
                        {task.assignee?.name ? (
                          <div className="flex items-center gap-2">
                            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-sand text-[10px] font-semibold text-brown">
                              {task.assignee.name.slice(-2)}
                            </span>

                            <span className="truncate text-xs font-medium">
                              {task.assignee.name}
                            </span>
                          </div>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 text-xs font-medium text-amber-600 dark:text-amber-400">
                            <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
                            미배정
                          </span>
                        )}
                      </Link>
                    </td>

                    <td className="px-4 py-3.5">
                      <Link
                        href={`/cleaning/${task.id}`}
                        aria-label="청소 작업 상세 보기"
                        className="inline-flex items-center gap-1 whitespace-nowrap text-xs font-semibold text-primary hover:underline"
                      >
                        {task.status === "unassigned"
                          ? "배정하기"
                          : task.status === "inspection"
                            ? "검수하기"
                            : task.status === "done"
                              ? "상세보기"
                              : "확인하기"}
                      </Link>
                    </td>
                  </ClickableTableRow>
                );
              })}

              {filteredTasks.length === 0 && (
                <tr>
                  <td colSpan={8}>
                    <EmptyCleaningState activeStatus={activeStatus} />
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

function CleaningAlertBanner({
  urgentCount,
  unassignedCount,
  hrefFor,
}: {
  urgentCount: number;
  unassignedCount: number;
  hrefFor: (status: CleaningTaskStatus | null) => string;
}) {
  if (urgentCount > 0) {
    return (
      <div className="flex flex-col gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 sm:flex-row sm:items-center sm:justify-between dark:border-red-900/50 dark:bg-red-950/20">
        <div className="flex items-center gap-3">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-red-100 text-sm font-bold text-red-600 dark:bg-red-900/40 dark:text-red-300">
            !
          </span>

          <div>
            <p className="text-sm font-semibold text-red-700 dark:text-red-300">
              체크인 임박 작업 {urgentCount}건
            </p>

            <p className="mt-0.5 text-xs text-red-600 dark:text-red-400">
              여유 시간이 부족한 객실을 우선 확인해 주세요.
            </p>
          </div>
        </div>

        {unassignedCount > 0 && (
          <Link
            href={hrefFor("unassigned")}
            className="self-start text-xs font-semibold text-red-600 underline-offset-4 hover:underline sm:self-auto dark:text-red-400"
          >
            미배정 {unassignedCount}건 확인
          </Link>
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 sm:flex-row sm:items-center sm:justify-between dark:border-amber-900/50 dark:bg-amber-950/20">
      <div className="flex items-center gap-3">
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-amber-100 text-sm font-bold text-amber-600 dark:bg-amber-900/40 dark:text-amber-300">
          !
        </span>

        <div>
          <p className="text-sm font-semibold text-amber-700 dark:text-amber-300">
            미배정 작업 {unassignedCount}건
          </p>

          <p className="mt-0.5 text-xs text-amber-600 dark:text-amber-400">
            청소 일정에 맞춰 크루 배정이 필요합니다.
          </p>
        </div>
      </div>

      <Link
        href={hrefFor("unassigned")}
        className="self-start text-xs font-semibold text-amber-700 underline-offset-4 hover:underline sm:self-auto dark:text-amber-300"
      >
        미배정 작업 보기
      </Link>
    </div>
  );
}

function EmptyCleaningState({
  activeStatus,
}: {
  activeStatus?: CleaningTaskStatus;
}) {
  const activeLabel = STATUS_GROUPS.find(
    (group) => group.status === activeStatus
  )?.label;

  return (
    <div className="flex min-h-48 flex-col items-center justify-center px-4 py-8 text-center">
      <span className="flex h-10 w-10 items-center justify-center rounded-full bg-black/[0.04] text-lg text-subtext dark:bg-white/[0.06]">
        ✓
      </span>

      <p className="mt-3 text-sm font-medium">
        {activeStatus
          ? `${activeLabel} 상태의 청소 작업이 없습니다.`
          : "등록된 청소 작업이 없습니다."}
      </p>

      <p className="mt-1 text-xs text-subtext">
        {activeStatus
          ? "다른 상태를 선택해 전체 작업을 확인할 수 있습니다."
          : "청소 작업이 생성되면 이곳에 표시됩니다."}
      </p>
    </div>
  );
}
