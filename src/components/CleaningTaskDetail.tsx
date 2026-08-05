"use client";
import { useState } from "react";
import Image from "next/image";
import {
  CleaningStatusBadge,
  RiskBadge,
  RoomStatusBadge,
} from "@/components/StatusBadges";
import { ProgressTimeline } from "@/components/ProgressTimeline";
import { CleaningTaskActions } from "@/components/CleaningTaskActions";
import { CleaningCrewAssignment } from "@/components/CleaningCrewAssignment";
import { CleaningCrewReassignment } from "@/components/CleaningCrewReassignment";
import { CleaningInspectionPanel } from "@/components/CleaningInspectionPanel";
import { CrewPhoneSimulator } from "@/components/CrewPhoneSimulator";
import { RoomModalHeader } from "@/components/RoomModalHeader";
import { ActionPanel, ActionSection } from "@/components/ActionPanel";
import { CLEANING_STATUS_LABEL } from "@/lib/labels";
import { formatBuffer, formatDateTime, minutesUntil } from "@/lib/format";
import { calcRoomPriority } from "@/lib/priority";
import { CLEANING_TASK_NEXT, CLEANING_STEPS } from "@/lib/transitions";
import { getRoomDisplayStatus } from "@/lib/roomDisplayStatus";
import type { CleaningTask, Room, Staff } from "@/lib/types";
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
  roomOpenIssueCount,
}: {
  task: CleaningTask;
  room: Room;
  cleaners: Staff[];
  managers: Staff[];
  roomOpenIssueCount: number;
}) {
  const priority = calcRoomPriority(room, task);
  const checkinMinutes = minutesUntil(room.next_checkin_at);
  const manualAllowedNext = CLEANING_TASK_NEXT[task.status].filter(
    (next) => !AUTO_HANDLED_TRANSITIONS[task.status]?.includes(next)
  );
  const defaultManager =
    managers.find((manager) => manager.branch === room.branch) ?? null;
  const [managerName, setManagerName] = useState<string | null>(
    defaultManager?.name ?? null
  );
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [confirmingCrewName, setConfirmingCrewName] = useState<string | null>(
    null
  );
  return (
    <div className="flex flex-col gap-6">
      <RoomModalHeader
        room={room}
        task={task}
        operatorName={managerName}
        crewName={task.assignee?.name ?? null}
        titleSuffix="청소"
        operationControl={{
          roomOpenIssueCount,
          suggestedNote: "청소 작업 확인 필요",
        }}
      />
      <div className="rounded-xl border border-black/10 bg-white/70 px-5 py-4 dark:border-white/10 dark:bg-white/[0.03]">
        <ProgressTimeline
          steps={CLEANING_STEPS}
          labelMap={CLEANING_STATUS_LABEL}
          current={task.status}
        />
      </div>
      <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(320px,1fr)]">
        <main className="flex min-w-0 flex-col gap-5">
          <section className="rounded-xl border border-black/10 bg-white/70 p-5 dark:border-white/10 dark:bg-white/[0.03]">
            <div className="mb-5 flex items-center justify-between">
              <div>
                <h2 className="text-sm font-semibold">청소 정보</h2>
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  객실 일정과 현재 청소 진행 상태입니다.
                </p>
              </div>
              <CleaningStatusBadge status={task.status} />
            </div>
            <div className="grid grid-cols-2 gap-x-5 gap-y-5 sm:grid-cols-4">
              <Field label="객실 상태">
                <RoomStatusBadge status={getRoomDisplayStatus(room, task)} />
              </Field>
              <Field label="여유 시간">
                <RiskBadge
                  level={priority.riskLevel}
                  label={formatBuffer(priority.bufferMinutes)}
                />
              </Field>
              <Field label="예상 소요 시간"> {task.estimated_minutes}분 </Field>
              <Field label="배정 크루">{task.assignee?.name ?? "미배정"}</Field>
              <Field label="체크아웃">{formatDateTime(room.checkout_at)}</Field>
              <Field label="다음 체크인">
                {formatDateTime(room.next_checkin_at)}
              </Field>
              <Field label="청소 시작">{formatDateTime(task.started_at)}</Field>
              <Field label="검수 담당자"> {managerName ?? "미배정"} </Field>
            </div>
          </section>
          {task.status === "unassigned" && (
            <CleaningCrewAssignment
              taskId={task.id}
              checkinMinutes={checkinMinutes}
              onAssigned={setConfirmingCrewName}
            />
          )}
          <CleaningScheduleSummary
            priority={priority}
            room={room}
            task={task}
          />
          {task.status === "inspection" && (
            <section className="rounded-xl border border-black/10 bg-white/70 p-5 dark:border-white/10 dark:bg-white/[0.03]">
              <div className="mb-4">
                <h2 className="text-sm font-semibold">청소 완료 사진</h2>
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  현장 크루가 등록한 청소 완료 사진입니다.
                </p>
              </div>
              {photoUrl ? (
                <div className="overflow-hidden rounded-xl border border-black/10 dark:border-white/10">
                  <Image
                    src={photoUrl}
                    alt="청소 완료 사진"
                    width={1200}
                    height={720}
                    unoptimized
                    className="max-h-[360px] w-full object-cover"
                  />
                </div>
              ) : (
                <div className="flex min-h-40 items-center justify-center rounded-xl border border-dashed border-black/15 bg-black/[0.02] dark:border-white/15 dark:bg-white/[0.02]">
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    등록된 완료 사진이 없습니다.
                  </p>
                </div>
              )}
            </section>
          )}
        </main>
        <div className="lg:sticky lg:top-6">
          <ActionPanel>
            {task.status !== "unassigned" && (
              <ActionSection
                number={1}
                title="배정 크루"
                description="현재 배정된 크루를 확인하거나 변경합니다."
                complete
                summary={`배정 크루 · ${task.assignee?.name ?? "미배정"}`}
              >
                <CleaningCrewReassignment
                  taskId={task.id}
                  assigneeId={task.assignee_id}
                  cleaners={cleaners}
                />
              </ActionSection>
            )}
            <ActionSection
              number={task.status === "unassigned" ? 1 : 2}
              title="청소 상태"
              description="청소 진행 상황에 맞게 현재 상태를 관리합니다."
              complete={task.status === "done"}
              summary={`청소 상태 · ${CLEANING_STATUS_LABEL[task.status]}`}
            >
              <CleaningTaskActions
                taskId={task.id}
                status={task.status}
                allowedNext={manualAllowedNext}
              />
            </ActionSection>
            <ActionSection
              number={task.status === "unassigned" ? 2 : 3}
              title={
                task.status === "inspection"
                  ? "운영자 검수"
                  : task.status === "done"
                  ? "검수 완료"
                  : "청소 완료 처리"
              }
              description={getInspectionDescription(task.status)}
              complete={task.status === "done"}
              summary={`검수 완료 · ${managerName ?? "미배정"}`}
            >
              <CleaningInspectionPanel
                taskId={task.id}
                status={task.status}
                managers={managers}
                defaultManager={defaultManager}
                managerName={managerName}
                onManagerChange={setManagerName}
                photoUrl={photoUrl}
                onPhotoChange={setPhotoUrl}
              />
            </ActionSection>
          </ActionPanel>
        </div>
      </div>
      {confirmingCrewName && (
        <CrewPhoneSimulator
          taskId={task.id}
          crewName={confirmingCrewName}
          room={room}
          estimatedMinutes={task.estimated_minutes}
          onDone={() => setConfirmingCrewName(null)}
        />
      )}
    </div>
  );
}
function CleaningScheduleSummary({
  priority,
  room,
  task,
}: {
  priority: ReturnType<typeof calcRoomPriority>;
  room: Room;
  task: CleaningTask;
}) {
  if (task.status === "done") {
    return (
      <section className="rounded-xl border border-success-border bg-success-bg p-5">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h2 className="text-sm font-semibold text-success-text">
              일정 요약
            </h2>
            <p className="mt-2 text-sm leading-6 text-success-text/80">
              청소와 검수가 모두 완료되어{" "}
              <strong className="font-semibold text-success-text">
                입실 가능
              </strong>{" "}
              상태입니다.
            </p>
          </div>
          <span className="shrink-0 rounded-full bg-white/70 px-3 py-1 text-xs font-semibold text-success-text dark:bg-black/20">
            입실 가능
          </span>
        </div>
      </section>
    );
  }

  const isUrgent =
    priority.riskLevel === "urgent" || priority.riskLevel === "warning";
  return (
    <section
      className={[
        "rounded-xl border p-5",
        isUrgent
          ? "border-red-200 bg-red-50/70 dark:border-red-900/50 dark:bg-red-950/20"
          : "border-primary/15 bg-primary/[0.04]",
      ].join(" ")}
    >
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="text-sm font-semibold">일정 요약</h2>
          <p className="mt-2 text-sm leading-6 text-foreground/80">
            다음 체크인은
            <strong className="font-semibold text-foreground">
              {formatDateTime(room.next_checkin_at)}
            </strong>
            이며, 예상 청소 시간은
            <strong className="font-semibold text-foreground">
              {task.estimated_minutes}분
            </strong>
            입니다.
          </p>
        </div>
        <RiskBadge
          level={priority.riskLevel}
          label={formatBuffer(priority.bufferMinutes)}
        />
      </div>
      {isUrgent && (
        <p className="mt-3 text-xs font-medium text-red-600 dark:text-red-400">
          체크인 일정이 가까워 빠른 배정과 진행 확인이 필요합니다.
        </p>
      )}
    </section>
  );
}
function getInspectionDescription(status: CleaningTask["status"]) {
  switch (status) {
    case "cleaning":
      return "완료 사진을 등록하면 운영자 검수 단계로 전환됩니다.";
    case "inspection":
      return "완료 사진을 확인한 뒤 담당자가 최종 승인합니다.";
    case "done":
      return "청소와 운영자 검수가 모두 완료되었습니다.";
    default:
      return "청소 시작 후 완료 사진과 검수를 진행합니다.";
  }
}
function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="min-w-0">
      <div className="text-xs text-gray-500 dark:text-gray-400">{label}</div>
      <div className="mt-1.5 text-sm font-medium"> {children} </div>
    </div>
  );
}
