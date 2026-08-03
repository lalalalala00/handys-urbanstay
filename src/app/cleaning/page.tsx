import Link from "next/link";
import { getCleaningTasksList } from "@/lib/queries";
import { CleaningStatusBadge, RiskBadge, CLEANING_TONE } from "@/components/StatusBadges";
import { StatusFilterCards } from "@/components/StatusFilterCards";
import { formatBuffer, formatDateTime, formatRelative } from "@/lib/format";
import type { CleaningTaskStatus } from "@/lib/types";

export const dynamic = "force-dynamic";

const STATUS_GROUPS = [
  { status: "unassigned", label: "미배정" },
  { status: "assigned", label: "배정 완료" },
  { status: "cleaning", label: "진행 중" },
  { status: "inspection", label: "검수 대기" },
  { status: "done", label: "완료" },
] as const satisfies { status: CleaningTaskStatus; label: string }[];

export default async function CleaningTasksPage({
  searchParams,
}: {
  searchParams: Promise<{ branch?: string; region?: string; status?: string }>;
}) {
  const { branch, region, status } = await searchParams;
  const tasks = await getCleaningTasksList({ branch, region });

  const activeStatus = STATUS_GROUPS.some((g) => g.status === status)
    ? (status as CleaningTaskStatus)
    : undefined;
  const filteredTasks = activeStatus
    ? tasks.filter((t) => t.status === activeStatus)
    : tasks;

  const baseParams = new URLSearchParams();
  if (branch) baseParams.set("branch", branch);
  if (region) baseParams.set("region", region);
  const hrefFor = (next: CleaningTaskStatus | null) => {
    const params = new URLSearchParams(baseParams);
    if (next) params.set("status", next);
    const qs = params.toString();
    return qs ? `/cleaning?${qs}` : "/cleaning";
  };

  const counts = Object.fromEntries(
    STATUS_GROUPS.map((g) => [g.status, tasks.filter((t) => t.status === g.status).length])
  ) as Record<CleaningTaskStatus, number>;

  return (
    <div className="flex flex-col gap-8">
      <h1 className="text-lg font-semibold">청소 작업</h1>

      <StatusFilterCards
        groups={STATUS_GROUPS.map((g) => ({ ...g, tone: CLEANING_TONE[g.status] }))}
        counts={counts}
        activeStatus={activeStatus}
        hrefFor={hrefFor}
      />

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
            {filteredTasks.map((task) => (
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
            {filteredTasks.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-6 text-center text-gray-500">
                  {activeStatus ? "해당 상태의 청소 작업이 없습니다." : "청소 작업이 없습니다."}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
