import { CleaningStatusBadge, RiskBadge, RoomStatusBadge } from "@/components/StatusBadges";
import { CleaningProgressTimeline } from "@/components/CleaningProgressTimeline";
import { CleaningTaskActions } from "@/components/CleaningTaskActions";
import { CleaningInspectionPanel } from "@/components/CleaningInspectionPanel";
import { RoomModalHeader } from "@/components/RoomModalHeader";
import { formatBuffer, formatDateTime, minutesUntil } from "@/lib/format";
import { calcRoomPriority } from "@/lib/priority";
import { CLEANING_TASK_NEXT } from "@/lib/transitions";
import type { CleaningTask, Room, Staff } from "@/lib/types";

// These transitions now happen automatically via dedicated actions
// (crew assignment, complete-with-photo, manager confirm) instead of the
// generic status-change buttons.
const AUTO_HANDLED_TRANSITIONS: Record<string, string[]> = {
  unassigned: ["assigned"],
  cleaning: ["inspection"],
  inspection: ["done"],
};

export function CleaningTaskDetail({
  task,
  room,
  cleaners,
  managers,
  operator,
}: {
  task: CleaningTask;
  room: Room;
  cleaners: Staff[];
  managers: Staff[];
  operator: Staff | null;
}) {
  const priority = calcRoomPriority(room, task);
  const checkinMinutes = minutesUntil(room.next_checkin_at);
  const manualAllowedNext = CLEANING_TASK_NEXT[task.status].filter(
    (next) => !AUTO_HANDLED_TRANSITIONS[task.status]?.includes(next)
  );
  const defaultManager = managers.find((m) => m.branch === room.branch) ?? null;

  return (
    <div className="flex flex-col gap-6">
      <RoomModalHeader room={room} operator={operator} crewName={task.assignee?.name ?? null} />

      <CleaningProgressTimeline status={task.status} />

      <div className="grid grid-cols-2 gap-4 rounded-lg border border-black/10 p-4 text-sm sm:grid-cols-4 dark:border-white/10">
        <Field label="객실 상태">
          <RoomStatusBadge status={room.status} />
        </Field>
        <Field label="청소 상태">
          <CleaningStatusBadge status={task.status} />
        </Field>
        <Field label="여유 시간">
          <RiskBadge level={priority.riskLevel} label={formatBuffer(priority.bufferMinutes)} />
        </Field>
        <Field label="예상 소요 시간">{task.estimated_minutes}분</Field>
        <Field label="체크아웃">{formatDateTime(room.checkout_at)}</Field>
        <Field label="다음 체크인">{formatDateTime(room.next_checkin_at)}</Field>
        <Field label="청소 시작">{formatDateTime(task.started_at)}</Field>
        <Field label="크루">{task.assignee?.name ?? "미배정"}</Field>
      </div>

      <CleaningTaskActions
        taskId={task.id}
        status={task.status}
        assigneeId={task.assignee_id}
        cleaners={cleaners}
        allowedNext={manualAllowedNext}
        checkinMinutes={checkinMinutes}
      />

      <CleaningInspectionPanel
        taskId={task.id}
        status={task.status}
        managers={managers}
        defaultManager={defaultManager}
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
