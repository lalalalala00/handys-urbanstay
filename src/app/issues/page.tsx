import Link from "next/link";
import { getIssuesList } from "@/lib/queries";
import {
  IssueStatusBadge,
  UrgencyBadge,
  ISSUE_STATUS_TONE,
} from "@/components/StatusBadges";

import { ISSUE_CATEGORY_LABEL, ISSUE_STATUS_LABEL } from "@/lib/labels";
import { formatDateTime } from "@/lib/format";
import type { IssueStatus } from "@/lib/types";
import { IssueStatusTabs } from "@/components/issue/IssueStatusTabs";
import { StatusTabs } from "@/components/StatusTabs";

export const dynamic = "force-dynamic";

const STATUS_GROUPS = (
  ["new", "checking", "assigned", "in_progress", "inspection", "done"] as const
).map((status) => ({
  status,
  label: ISSUE_STATUS_LABEL[status],
  tone: ISSUE_STATUS_TONE[status],
}));

export default async function IssuesPage({
  searchParams,
}: {
  searchParams: Promise<{
    branch?: string;
    region?: string;
    status?: string;
  }>;
}) {
  const { branch, region, status } = await searchParams;

  const issues = await getIssuesList({
    branch,
    region,
  });

  const activeStatus = STATUS_GROUPS.some((group) => group.status === status)
    ? (status as IssueStatus)
    : undefined;

  const filteredIssues = activeStatus
    ? issues.filter((issue) => issue.status === activeStatus)
    : issues;

  const baseParams = new URLSearchParams();

  if (branch) {
    baseParams.set("branch", branch);
  }

  if (region) {
    baseParams.set("region", region);
  }

  function hrefFor(next: IssueStatus | null) {
    const params = new URLSearchParams(baseParams);

    if (next) {
      params.set("status", next);
    }

    const queryString = params.toString();

    return queryString ? `/issues?${queryString}` : "/issues";
  }

  const counts = Object.fromEntries(
    STATUS_GROUPS.map((group) => [
      group.status,
      issues.filter((issue) => issue.status === group.status).length,
    ])
  ) as Record<IssueStatus, number>;

  const unresolvedCount = issues.filter(
    (issue) => issue.status !== "done"
  ).length;

  const urgentCount = issues.filter(
    (issue) => issue.status !== "done" && issue.urgency === "urgent"
  ).length;

  return (
    <div className="flex flex-col gap-5">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-lg font-semibold">객실 이슈</h1>

            {unresolvedCount > 0 && (
              <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-semibold text-primary">
                처리 중 {unresolvedCount}
              </span>
            )}
          </div>

          <p className="mt-1 text-xs text-subtext">
            객실에서 접수된 문제와 처리 진행 상황을 확인합니다.
          </p>
        </div>

        <Link
          href="/issues/new"
          className="flex h-9 items-center justify-center rounded-lg bg-foreground px-4 text-sm font-medium text-background transition hover:opacity-90"
        >
          이슈 등록
        </Link>
      </header>

      {urgentCount > 0 && (
        <div className="flex items-center justify-between gap-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 dark:border-red-900/50 dark:bg-red-950/20">
          <div className="flex items-center gap-3">
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-red-100 text-sm font-bold text-red-600 dark:bg-red-900/40 dark:text-red-300">
              !
            </span>

            <div>
              <p className="text-sm font-semibold text-red-700 dark:text-red-300">
                긴급 이슈 {urgentCount}건
              </p>

              <p className="mt-0.5 text-xs text-red-600 dark:text-red-400">
                우선 확인이 필요한 이슈가 있습니다.
              </p>
            </div>
          </div>

          <span className="hidden text-xs font-medium text-red-600 sm:block dark:text-red-400">
            긴급도 높은 순으로 확인하세요
          </span>
        </div>
      )}

      <StatusTabs
        groups={STATUS_GROUPS.map((group) => ({
          ...group,
          tone: ISSUE_STATUS_TONE[group.status],
        }))}
        counts={counts}
        totalCount={issues.length}
        activeStatus={activeStatus}
        hrefFor={hrefFor}
        ariaLabel="이슈 상태 필터"
      />
      <section className="overflow-hidden rounded-xl border border-card-border bg-card">
        <div className="flex items-center justify-between border-b border-card-border px-4 py-3">
          <div>
            <h2 className="text-sm font-semibold">
              {activeStatus ? ISSUE_STATUS_LABEL[activeStatus] : "전체 이슈"}
            </h2>

            <p className="mt-0.5 text-xs text-subtext">
              총 {filteredIssues.length}건
            </p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px] text-sm">
            <thead className="bg-black/[0.025] text-left dark:bg-white/[0.03]">
              <tr className="text-xs text-subtext">
                <th className="w-[170px] px-4 py-3 font-medium">객실</th>

                <th className="w-[110px] px-4 py-3 font-medium">유형</th>

                <th className="w-[90px] px-4 py-3 font-medium">긴급도</th>

                <th className="min-w-[240px] px-4 py-3 font-medium">
                  신고 내용
                </th>

                <th className="w-[150px] px-4 py-3 font-medium">접수 시간</th>

                <th className="w-[120px] px-4 py-3 font-medium">상태</th>

                <th className="w-[110px] px-4 py-3 font-medium">담당 크루</th>

                <th className="w-10 px-2 py-3">
                  <span className="sr-only">상세 보기</span>
                </th>
              </tr>
            </thead>

            <tbody>
              {filteredIssues.map((issue) => {
                const isUrgent =
                  issue.urgency === "urgent" && issue.status !== "done";

                return (
                  <tr
                    key={issue.id}
                    className={[
                      "group border-t border-card-border transition-colors",
                      isUrgent
                        ? "bg-red-50/40 hover:bg-red-50/70 dark:bg-red-950/10 dark:hover:bg-red-950/20"
                        : "hover:bg-black/[0.02] dark:hover:bg-white/[0.025]",
                    ].join(" ")}
                  >
                    <td className="px-4 py-3.5">
                      <Link
                        href={issue.room ? `/rooms/${issue.room.id}` : `/issues/${issue.id}`}
                        className="block"
                      >
                        <p className="font-semibold">
                          {issue.room?.room_number
                            ? `${issue.room.room_number}호`
                            : "객실 정보 없음"}
                        </p>

                        <p className="mt-0.5 max-w-[150px] truncate text-xs text-subtext">
                          {issue.room?.branch ?? "-"}
                        </p>
                      </Link>
                    </td>

                    <td className="px-4 py-3.5">
                      <Link href={`/issues/${issue.id}`} className="block">
                        <span className="text-sm text-foreground/80">
                          {ISSUE_CATEGORY_LABEL[issue.category]}
                        </span>
                      </Link>
                    </td>

                    <td className="px-4 py-3.5">
                      <Link href={`/issues/${issue.id}`} className="block">
                        <UrgencyBadge urgency={issue.urgency} />
                      </Link>
                    </td>

                    <td className="px-4 py-3.5">
                      <Link
                        href={`/issues/${issue.id}`}
                        className="block max-w-md"
                      >
                        <p className="line-clamp-2 text-sm leading-5 text-foreground/75 transition-colors group-hover:text-foreground">
                          {issue.description}
                        </p>
                      </Link>
                    </td>

                    <td className="px-4 py-3.5">
                      <Link href={`/issues/${issue.id}`} className="block">
                        <span className="whitespace-nowrap text-xs text-subtext">
                          {formatDateTime(issue.created_at)}
                        </span>
                      </Link>
                    </td>

                    <td className="px-4 py-3.5">
                      <Link href={`/issues/${issue.id}`} className="block">
                        <IssueStatusBadge status={issue.status} />
                      </Link>
                    </td>

                    <td className="px-4 py-3.5">
                      <Link href={`/issues/${issue.id}`} className="block">
                        {issue.assignee?.name ? (
                          <div className="flex items-center gap-2">
                            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-sand text-[10px] font-semibold text-brown">
                              {issue.assignee.name.slice(-2)}
                            </span>

                            <span className="truncate text-xs font-medium">
                              {issue.assignee.name}
                            </span>
                          </div>
                        ) : (
                          <span className="text-xs text-amber-600 dark:text-amber-400">
                            미배정
                          </span>
                        )}
                      </Link>
                    </td>

                    <td className="px-2 py-3.5">
                      <Link
                        href={`/issues/${issue.id}`}
                        aria-label="이슈 상세 보기"
                        className="flex h-8 w-8 items-center justify-center rounded-lg text-subtext opacity-0 transition hover:bg-black/5 hover:text-primary group-hover:opacity-100 dark:hover:bg-white/10"
                      >
                        <ArrowRightIcon className="h-4 w-4" />
                      </Link>
                    </td>
                  </tr>
                );
              })}

              {filteredIssues.length === 0 && (
                <tr>
                  <td colSpan={8}>
                    <EmptyIssueState activeStatus={activeStatus} />
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

function EmptyIssueState({ activeStatus }: { activeStatus?: IssueStatus }) {
  return (
    <div className="flex min-h-48 flex-col items-center justify-center px-4 py-8 text-center">
      <span className="flex h-10 w-10 items-center justify-center rounded-full bg-black/[0.04] text-lg text-subtext dark:bg-white/[0.06]">
        ✓
      </span>

      <p className="mt-3 text-sm font-medium">
        {activeStatus
          ? `${ISSUE_STATUS_LABEL[activeStatus]} 상태의 이슈가 없습니다.`
          : "등록된 이슈가 없습니다."}
      </p>

      <p className="mt-1 text-xs text-subtext">
        {activeStatus
          ? "다른 상태를 선택해 전체 이슈를 확인할 수 있습니다."
          : "새 이슈가 접수되면 이곳에 표시됩니다."}
      </p>
    </div>
  );
}

function ArrowRightIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
      className={className}
    >
      <path
        d="M5 12h14M13 6l6 6-6 6"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
