import Link from "next/link";
import { getCleaningTasksList, getIssuesList } from "@/lib/queries";
import {
  CleaningStatusBadge,
  IssueStatusBadge,
  RiskBadge,
  UrgencyBadge,
} from "@/components/common/StatusBadges";
import { formatBuffer, formatDateTime } from "@/lib/format";
import { ISSUE_CATEGORY_LABEL } from "@/lib/labels";
import { ClickableTableRow } from "@/components/common/ClickableTableRow";
import { ArrowRightIcon, CleaningIcon, IssueIcon } from "@/components/common/icons";

export const dynamic = "force-dynamic";

export default async function UnassignedWorkPage({
  searchParams,
}: {
  searchParams: Promise<{ branch?: string; region?: string }>;
}) {
  const { branch, region } = await searchParams;

  const [tasks, issues] = await Promise.all([
    getCleaningTasksList({ branch, region }),
    getIssuesList({ branch, region }),
  ]);

  const unassignedTasks = tasks.filter((task) => task.status === "unassigned");
  const unassignedIssues = issues.filter(
    (issue) => !issue.assignee_id && issue.status !== "done"
  );

  const filterQuery = new URLSearchParams();
  if (branch) filterQuery.set("branch", branch);
  if (region) filterQuery.set("region", region);
  const filterQueryString = filterQuery.toString();
  const withFilter = (href: string) =>
    filterQueryString ? `${href}?${filterQueryString}` : href;

  return (
    <div className="flex flex-col gap-7">
      <header>
        <h1 className="text-lg font-semibold">미배정 작업</h1>
        <p className="mt-1 text-xs text-subtext">
          담당자가 지정되지 않은 청소와 이슈를 한 곳에서 확인합니다.
        </p>
      </header>

      <section>
        <div className="mb-3 flex items-end justify-between gap-4">
          <div className="flex items-center gap-2">
            <CleaningIcon className="h-4 w-4" />
            <h2 className="text-base font-semibold">미배정 청소</h2>
            <span className="text-sm text-subtext">{unassignedTasks.length}</span>
          </div>
          <Link
            href={withFilter("/cleaning?status=unassigned")}
            className="flex shrink-0 items-center gap-1 text-xs font-medium text-subtext transition-colors hover:text-primary"
          >
            전체 보기 <ArrowRightIcon className="h-3.5 w-3.5" />
          </Link>
        </div>

        <div className="overflow-hidden rounded-xl border border-card-border bg-card">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] text-sm">
              <thead className="bg-black/[0.02] text-left text-xs text-subtext">
                <tr>
                  <th className="px-4 py-3 font-medium">객실</th>
                  <th className="px-4 py-3 font-medium">청소 상태</th>
                  <th className="px-4 py-3 font-medium">체크아웃</th>
                  <th className="px-4 py-3 font-medium">여유 시간</th>
                  <th className="w-24 px-4 py-3 font-medium"><span className="sr-only">액션</span></th>
                </tr>
              </thead>
              <tbody>
                {unassignedTasks.map((task) => (
                  <ClickableTableRow
                    key={task.id}
                    href={`/cleaning/${task.id}`}
                    className="border-t border-card-border transition-colors hover:bg-black/[0.02] dark:hover:bg-white/[0.025]"
                  >
                    <td className="px-4 py-3">
                      <Link
                        href={task.room ? `/rooms/${task.room.id}` : `/cleaning/${task.id}`}
                        className="font-semibold hover:text-primary"
                      >
                        {task.room ? `${task.room.branch} · ${task.room.room_number}호` : "객실 정보 없음"}
                      </Link>
                    </td>
                    <td className="px-4 py-3"><CleaningStatusBadge status={task.status} /></td>
                    <td className="px-4 py-3 text-subtext">{formatDateTime(task.room?.checkout_at ?? null)}</td>
                    <td className="px-4 py-3"><RiskBadge level={task.priority.riskLevel} label={formatBuffer(task.priority.bufferMinutes)} /></td>
                    <td className="px-4 py-3 text-right">
                      <Link href={`/cleaning/${task.id}`} className="inline-flex text-xs font-semibold text-primary hover:underline">
                        배정하기
                      </Link>
                    </td>
                  </ClickableTableRow>
                ))}
                {unassignedTasks.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-4 py-10 text-center text-sm text-subtext">
                      미배정 청소 작업이 없습니다.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      <section>
        <div className="mb-3 flex items-end justify-between gap-4">
          <div className="flex items-center gap-2">
            <IssueIcon className="h-4 w-4" />
            <h2 className="text-base font-semibold">미배정 이슈</h2>
            <span className="text-sm text-subtext">{unassignedIssues.length}</span>
          </div>
          <Link
            href={withFilter("/issues")}
            className="flex shrink-0 items-center gap-1 text-xs font-medium text-subtext transition-colors hover:text-primary"
          >
            전체 보기 <ArrowRightIcon className="h-3.5 w-3.5" />
          </Link>
        </div>

        <div className="overflow-hidden rounded-xl border border-card-border bg-card">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-sm">
              <thead className="bg-black/[0.02] text-left text-xs text-subtext">
                <tr>
                  <th className="px-4 py-3 font-medium">객실</th>
                  <th className="px-4 py-3 font-medium">유형</th>
                  <th className="px-4 py-3 font-medium">긴급도</th>
                  <th className="px-4 py-3 font-medium">신고 내용</th>
                  <th className="px-4 py-3 font-medium">상태</th>
                  <th className="w-24 px-4 py-3 font-medium"><span className="sr-only">액션</span></th>
                </tr>
              </thead>
              <tbody>
                {unassignedIssues.map((issue) => (
                  <ClickableTableRow
                    key={issue.id}
                    href={`/issues/${issue.id}`}
                    className="border-t border-card-border transition-colors hover:bg-black/[0.02] dark:hover:bg-white/[0.025]"
                  >
                    <td className="px-4 py-3">
                      <Link
                        href={issue.room ? `/rooms/${issue.room.id}` : `/issues/${issue.id}`}
                        className="font-semibold hover:text-primary"
                      >
                        {issue.room ? `${issue.room.branch} · ${issue.room.room_number}호` : "객실 정보 없음"}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-subtext">{ISSUE_CATEGORY_LABEL[issue.category]}</td>
                    <td className="px-4 py-3"><UrgencyBadge urgency={issue.urgency} /></td>
                    <td className="px-4 py-3">
                      <p className="line-clamp-1 max-w-xs text-foreground/80">{issue.description}</p>
                    </td>
                    <td className="px-4 py-3"><IssueStatusBadge status={issue.status} /></td>
                    <td className="px-4 py-3 text-right">
                      <Link href={`/issues/${issue.id}`} className="inline-flex text-xs font-semibold text-primary hover:underline">
                        배정하기
                      </Link>
                    </td>
                  </ClickableTableRow>
                ))}
                {unassignedIssues.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-4 py-10 text-center text-sm text-subtext">
                      미배정 이슈가 없습니다.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </section>
    </div>
  );
}
