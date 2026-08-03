import Link from "next/link";
import { notFound } from "next/navigation";
import { getCleaningTaskById, getStaffList } from "@/lib/queries";
import { CleaningStatusBadge, RiskBadge, RoomStatusBadge } from "@/components/StatusBadges";
import { formatBuffer, formatDateTime } from "@/lib/format";
import { calcRoomPriority } from "@/lib/priority";
import { CLEANING_TASK_NEXT } from "@/lib/transitions";
import { CleaningTaskActions } from "@/components/CleaningTaskActions";

export const dynamic = "force-dynamic";

export default async function CleaningTaskDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  let task;
  try {
    task = await getCleaningTaskById(id);
  } catch {
    notFound();
  }
  if (!task || !task.room) notFound();

  const staffList = await getStaffList();
  const cleaners = staffList.filter((s) => s.role === "cleaner");
  const priority = calcRoomPriority(task.room, task);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <Link href="/cleaning" className="text-xs text-gray-500 hover:underline">
          ← 청소 작업 목록
        </Link>
        <h1 className="mt-2 text-lg font-semibold">
          {task.room.branch} {task.room.room_number}호
        </h1>
      </div>

      <div className="grid grid-cols-2 gap-4 rounded-lg border border-black/10 p-5 sm:grid-cols-4 dark:border-white/10">
        <Field label="객실 상태">
          <RoomStatusBadge status={task.room.status} />
        </Field>
        <Field label="청소 상태">
          <CleaningStatusBadge status={task.status} />
        </Field>
        <Field label="여유 시간">
          <RiskBadge level={priority.riskLevel} label={formatBuffer(priority.bufferMinutes)} />
        </Field>
        <Field label="예상 소요 시간">{task.estimated_minutes}분</Field>
        <Field label="체크아웃">{formatDateTime(task.room.checkout_at)}</Field>
        <Field label="다음 체크인">{formatDateTime(task.room.next_checkin_at)}</Field>
        <Field label="청소 시작">{formatDateTime(task.started_at)}</Field>
        <Field label="담당자">{task.assignee?.name ?? "미배정"}</Field>
      </div>

      <CleaningTaskActions
        taskId={task.id}
        status={task.status}
        assigneeId={task.assignee_id}
        cleaners={cleaners}
        allowedNext={CLEANING_TASK_NEXT[task.status]}
      />
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
