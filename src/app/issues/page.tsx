import Link from "next/link";
import { getIssuesList } from "@/lib/queries";
import { IssueStatusBadge, UrgencyBadge, ISSUE_STATUS_TONE } from "@/components/StatusBadges";
import { StatusFilterCards } from "@/components/StatusFilterCards";
import { ISSUE_CATEGORY_LABEL, ISSUE_STATUS_LABEL } from "@/lib/labels";
import { formatDateTime } from "@/lib/format";
import type { IssueStatus } from "@/lib/types";

export const dynamic = "force-dynamic";

const STATUS_GROUPS = (
  ["new", "checking", "assigned", "in_progress", "inspection", "done"] as const
).map((status) => ({ status, label: ISSUE_STATUS_LABEL[status] }));

export default async function IssuesPage({
  searchParams,
}: {
  searchParams: Promise<{ branch?: string; region?: string; status?: string }>;
}) {
  const { branch, region, status } = await searchParams;
  const issues = await getIssuesList({ branch, region });

  const activeStatus = STATUS_GROUPS.some((g) => g.status === status)
    ? (status as IssueStatus)
    : undefined;
  const filteredIssues = activeStatus
    ? issues.filter((i) => i.status === activeStatus)
    : issues;

  const baseParams = new URLSearchParams();
  if (branch) baseParams.set("branch", branch);
  if (region) baseParams.set("region", region);
  const hrefFor = (next: IssueStatus | null) => {
    const params = new URLSearchParams(baseParams);
    if (next) params.set("status", next);
    const qs = params.toString();
    return qs ? `/issues?${qs}` : "/issues";
  };

  const counts = Object.fromEntries(
    STATUS_GROUPS.map((g) => [g.status, issues.filter((i) => i.status === g.status).length])
  ) as Record<IssueStatus, number>;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold">객실 이슈</h1>
        <Link
          href="/issues/new"
          className="rounded bg-foreground px-3 py-1.5 text-sm text-background"
        >
          이슈 등록
        </Link>
      </div>

      <StatusFilterCards
        groups={STATUS_GROUPS.map((g) => ({ ...g, tone: ISSUE_STATUS_TONE[g.status] }))}
        counts={counts}
        activeStatus={activeStatus}
        hrefFor={hrefFor}
        gridClassName="grid-cols-2 sm:grid-cols-3 lg:grid-cols-6"
      />

      <div className="overflow-x-auto rounded-lg border border-black/10 dark:border-white/10">
        <table className="w-full min-w-180 text-sm">
          <thead className="bg-black/3 text-left text-xs text-gray-500 dark:bg-white/5 dark:text-gray-400">
            <tr>
              <th className="px-4 py-2 font-medium">객실</th>
              <th className="px-4 py-2 font-medium">유형</th>
              <th className="px-4 py-2 font-medium">긴급도</th>
              <th className="px-4 py-2 font-medium">내용</th>
              <th className="px-4 py-2 font-medium">접수 시간</th>
              <th className="px-4 py-2 font-medium">상태</th>
              <th className="px-4 py-2 font-medium">담당자</th>
            </tr>
          </thead>
          <tbody>
            {filteredIssues.map((issue) => (
              <tr
                key={issue.id}
                className="border-t border-black/5 dark:border-white/5"
              >
                <td className="px-4 py-2">
                  <Link href={`/issues/${issue.id}`} className="hover:underline">
                    {issue.room?.branch} {issue.room?.room_number}호
                  </Link>
                </td>
                <td className="px-4 py-2 text-gray-500 dark:text-gray-400">
                  {ISSUE_CATEGORY_LABEL[issue.category]}
                </td>
                <td className="px-4 py-2">
                  <UrgencyBadge urgency={issue.urgency} />
                </td>
                <td className="max-w-xs truncate px-4 py-2 text-gray-500 dark:text-gray-400">
                  {issue.description}
                </td>
                <td className="px-4 py-2 text-gray-500 dark:text-gray-400">
                  {formatDateTime(issue.created_at)}
                </td>
                <td className="px-4 py-2">
                  <IssueStatusBadge status={issue.status} />
                </td>
                <td className="px-4 py-2 text-gray-500 dark:text-gray-400">
                  {issue.assignee?.name ?? "미배정"}
                </td>
              </tr>
            ))}
            {filteredIssues.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-6 text-center text-gray-500">
                  {activeStatus ? "해당 상태의 이슈가 없습니다." : "등록된 이슈가 없습니다."}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
