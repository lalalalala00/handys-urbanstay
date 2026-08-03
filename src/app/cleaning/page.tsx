import Link from "next/link";
import { getCleaningTasksList } from "@/lib/queries";
import { CleaningStatusBadge, RiskBadge } from "@/components/StatusBadges";
import { formatBuffer, formatDateTime, formatRelative } from "@/lib/format";

export const dynamic = "force-dynamic";

const STATUS_GROUPS = [
  { status: "unassigned", label: "미배정" },
  { status: "assigned", label: "배정 완료" },
  { status: "cleaning", label: "진행 중" },
  { status: "inspection", label: "검수 대기" },
  { status: "done", label: "완료" },
] as const;

export default async function CleaningTasksPage() {
  const tasks = await getCleaningTasksList();

  return (
    <div className="flex flex-col gap-8">
      <h1 className="text-lg font-semibold">청소 작업</h1>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
        {STATUS_GROUPS.map((group) => (
          <div
            key={group.status}
            className="rounded-lg border border-black/10 p-4 dark:border-white/10"
          >
            <div className="text-2xl font-semibold">
              {tasks.filter((t) => t.status === group.status).length}
            </div>
            <div className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              {group.label}
            </div>
          </div>
        ))}
      </div>

      <div className="overflow-x-auto rounded-lg border border-black/10 dark:border-white/10">
        <table className="w-full min-w-180 text-sm">
          <thead className="bg-black/3 text-left text-xs text-gray-500 dark:bg-white/5 dark:text-gray-400">
            <tr>
              <th className="px-4 py-2 font-medium">객실</th>
              <th className="px-4 py-2 font-medium">상태</th>
              <th className="px-4 py-2 font-medium">체크아웃</th>
              <th className="px-4 py-2 font-medium">다음 체크인</th>
              <th className="px-4 py-2 font-medium">여유 시간</th>
              <th className="px-4 py-2 font-medium">예상 소요</th>
              <th className="px-4 py-2 font-medium">담당자</th>
            </tr>
          </thead>
          <tbody>
            {tasks.map((task) => (
              <tr
                key={task.id}
                className="border-t border-black/5 dark:border-white/5"
              >
                <td className="px-4 py-2">
                  <Link href={`/cleaning/${task.id}`} className="hover:underline">
                    {task.room?.branch} {task.room?.room_number}호
                  </Link>
                </td>
                <td className="px-4 py-2">
                  <CleaningStatusBadge status={task.status} />
                </td>
                <td className="px-4 py-2 text-gray-500 dark:text-gray-400">
                  {formatDateTime(task.room?.checkout_at ?? null)}
                </td>
                <td className="px-4 py-2 text-gray-500 dark:text-gray-400">
                  {formatRelative(task.room?.next_checkin_at ?? null)}
                </td>
                <td className="px-4 py-2">
                  <RiskBadge
                    level={task.priority.riskLevel}
                    label={formatBuffer(task.priority.bufferMinutes)}
                  />
                </td>
                <td className="px-4 py-2 text-gray-500 dark:text-gray-400">
                  {task.estimated_minutes}분
                </td>
                <td className="px-4 py-2 text-gray-500 dark:text-gray-400">
                  {task.assignee?.name ?? "미배정"}
                </td>
              </tr>
            ))}
            {tasks.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-6 text-center text-gray-500">
                  청소 작업이 없습니다.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
