"use client";

import { useState } from "react";
import { CleaningStatusBadge, RiskBadge, RoomStatusBadge } from "@/components/StatusBadges";
import { ProgressTimeline } from "@/components/ProgressTimeline";
import { CleaningTaskActions } from "@/components/CleaningTaskActions";
import { CleaningCrewAssignment } from "@/components/CleaningCrewAssignment";
import { CleaningCrewReassignment } from "@/components/CleaningCrewReassignment";
import { CleaningInspectionPanel } from "@/components/CleaningInspectionPanel";
import { RoomModalHeader } from "@/components/RoomModalHeader";
import { ActionPanel, ActionDivider } from "@/components/ActionPanel";
import { CLEANING_STATUS_LABEL } from "@/lib/labels";
import { formatBuffer, formatDateTime, minutesUntil } from "@/lib/format";
import { calcRoomPriority } from "@/lib/priority";
import { CLEANING_TASK_NEXT, CLEANING_STEPS } from "@/lib/transitions";
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
}: {
  task: CleaningTask;
  room: Room;
  cleaners: Staff[];
  managers: Staff[];
}) {
  const priority = calcRoomPriority(room, task);
  const checkinMinutes = minutesUntil(room.next_checkin_at);
  const manualAllowedNext = CLEANING_TASK_NEXT[task.status].filter(
    (next) => !AUTO_HANDLED_TRANSITIONS[task.status]?.includes(next)
  );
  const defaultManager = managers.find((m) => m.branch === room.branch) ?? null;
  const [managerName, setManagerName] = useState<string | null>(defaultManager?.name ?? null);

  return (
    <div className="flex flex-col gap-6">
      <RoomModalHeader
        room={room}
        operatorName={managerName}
        crewName={task.assignee?.name ?? null}
      />

      <ProgressTimeline steps={CLEANING_STEPS} labelMap={CLEANING_STATUS_LABEL} current={task.status} />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[2fr_1fr]">
        <div className="flex flex-col gap-6">
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

          {task.status === "unassigned" && (
            <CleaningCrewAssignment taskId={task.id} checkinMinutes={checkinMinutes} />
          )}
        </div>

        <ActionPanel>
          {task.status !== "unassigned" && (
            <>
              <CleaningCrewReassignment
                taskId={task.id}
                assigneeId={task.assignee_id}
                cleaners={cleaners}
              />

              <ActionDivider />
            </>
          )}

          <CleaningTaskActions
            taskId={task.id}
            status={task.status}
            allowedNext={manualAllowedNext}
          />

          <ActionDivider />

          <CleaningInspectionPanel
            taskId={task.id}
            status={task.status}
            managers={managers}
            defaultManager={defaultManager}
            managerName={managerName}
            onManagerChange={setManagerName}
          />
        </ActionPanel>
      </div>
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
