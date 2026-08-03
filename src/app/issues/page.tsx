import Link from "next/link";
import { getIssuesList } from "@/lib/queries";
import { IssueStatusBadge, UrgencyBadge } from "@/components/StatusBadges";
import { ISSUE_CATEGORY_LABEL } from "@/lib/labels";
import { formatDateTime } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function IssuesPage() {
  const issues = await getIssuesList();

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
            {issues.map((issue) => (
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
            {issues.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-6 text-center text-gray-500">
                  등록된 이슈가 없습니다.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
