import Link from "next/link";
import { getDashboardData } from "@/lib/queries";
import { RoomStatusBadge, IssueStatusBadge, UrgencyBadge, RiskBadge } from "@/components/StatusBadges";
import { formatBuffer, formatRelative } from "@/lib/format";
import { CLEANING_STATUS_LABEL } from "@/lib/labels";

export const dynamic = "force-dynamic";

const SUMMARY_CARDS = [
  { key: "todaysCheckins", label: "오늘 체크인", href: "/cleaning" },
  { key: "todaysCheckouts", label: "오늘 체크아웃", href: "/cleaning" },
  { key: "needsCleaning", label: "청소 필요 객실", href: "/cleaning" },
  { key: "unassigned", label: "청소 미배정", href: "/cleaning" },
  { key: "openIssues", label: "이상 신고", href: "/issues" },
  { key: "delayRisk", label: "지연 위험", href: "/cleaning" },
] as const;

export default async function DashboardPage() {
  const { summary, priorityRooms, openIssues } = await getDashboardData();

  return (
    <div className="flex flex-col gap-10">
      <section>
        <h1 className="mb-4 text-lg font-semibold">오늘의 운영 현황</h1>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          {SUMMARY_CARDS.map((card) => (
            <Link
              key={card.key}
              href={card.href}
              className="rounded-lg border border-black/10 p-4 transition-colors hover:border-black/20 dark:border-white/10 dark:hover:border-white/20"
            >
              <div className="text-2xl font-semibold">{summary[card.key]}</div>
              <div className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                {card.label}
              </div>
            </Link>
          ))}
        </div>
      </section>

      <section>
        <h2 className="mb-3 text-base font-semibold">우선 처리 필요 객실</h2>
        <p className="mb-3 text-xs text-gray-500 dark:text-gray-400">
          다음 체크인까지 남은 시간에서 예상 청소 시간을 뺀 여유 시간이 짧은 순으로 정렬됩니다. 미배정 작업은 같은 위험도 내에서 우선순위가 더 높습니다.
        </p>
        <div className="overflow-x-auto rounded-lg border border-black/10 dark:border-white/10">
          <table className="w-full min-w-160 text-sm">
            <thead className="bg-black/3 text-left text-xs text-gray-500 dark:bg-white/5 dark:text-gray-400">
              <tr>
                <th className="px-4 py-2 font-medium">객실</th>
                <th className="px-4 py-2 font-medium">상태</th>
                <th className="px-4 py-2 font-medium">청소</th>
                <th className="px-4 py-2 font-medium">다음 체크인</th>
                <th className="px-4 py-2 font-medium">여유 시간</th>
                <th className="px-4 py-2 font-medium">담당자</th>
              </tr>
            </thead>
            <tbody>
              {priorityRooms.map(({ room, task, priority }) => (
                <tr
                  key={room.id}
                  className="border-t border-black/5 dark:border-white/5"
                >
                  <td className="px-4 py-2">
                    {task ? (
                      <Link href={`/cleaning/${task.id}`} className="hover:underline">
                        {room.branch} {room.room_number}호
                      </Link>
                    ) : (
                      `${room.branch} ${room.room_number}호`
                    )}
                  </td>
                  <td className="px-4 py-2">
                    <RoomStatusBadge status={room.status} />
                  </td>
                  <td className="px-4 py-2 text-gray-500 dark:text-gray-400">
                    {task ? CLEANING_STATUS_LABEL[task.status] : "-"}
                  </td>
                  <td className="px-4 py-2 text-gray-500 dark:text-gray-400">
                    {formatRelative(room.next_checkin_at)}
                  </td>
                  <td className="px-4 py-2">
                    <RiskBadge
                      level={priority.riskLevel}
                      label={formatBuffer(priority.bufferMinutes)}
                    />
                  </td>
                  <td className="px-4 py-2 text-gray-500 dark:text-gray-400">
                    {task?.assignee?.name ?? "미배정"}
                  </td>
                </tr>
              ))}
              {priorityRooms.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-6 text-center text-gray-500">
                    처리할 객실이 없습니다.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      <section>
        <h2 className="mb-3 text-base font-semibold">미처리 객실 이슈</h2>
        <div className="overflow-x-auto rounded-lg border border-black/10 dark:border-white/10">
          <table className="w-full min-w-140 text-sm">
            <thead className="bg-black/3 text-left text-xs text-gray-500 dark:bg-white/5 dark:text-gray-400">
              <tr>
                <th className="px-4 py-2 font-medium">객실</th>
                <th className="px-4 py-2 font-medium">긴급도</th>
                <th className="px-4 py-2 font-medium">내용</th>
                <th className="px-4 py-2 font-medium">상태</th>
                <th className="px-4 py-2 font-medium">담당자</th>
              </tr>
            </thead>
            <tbody>
              {openIssues.map((issue) => (
                <tr
                  key={issue.id}
                  className="border-t border-black/5 dark:border-white/5"
                >
                  <td className="px-4 py-2">
                    <Link href={`/issues/${issue.id}`} className="hover:underline">
                      {issue.room?.branch} {issue.room?.room_number}호
                    </Link>
                  </td>
                  <td className="px-4 py-2">
                    <UrgencyBadge urgency={issue.urgency} />
                  </td>
                  <td className="max-w-xs truncate px-4 py-2 text-gray-500 dark:text-gray-400">
                    {issue.description}
                  </td>
                  <td className="px-4 py-2">
                    <IssueStatusBadge status={issue.status} />
                  </td>
                  <td className="px-4 py-2 text-gray-500 dark:text-gray-400">
                    {issue.assignee?.name ?? "미배정"}
                  </td>
                </tr>
              ))}
              {openIssues.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-6 text-center text-gray-500">
                    미처리 이슈가 없습니다.
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
