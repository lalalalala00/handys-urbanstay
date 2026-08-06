"use client";

import { useState } from "react";
import {
  IssueStatusBadge,
  UrgencyBadge,
} from "@/components/common/StatusBadges";
import {
  IssueClassificationAction,
  IssueStatusAction,
} from "@/components/issue/IssueActions";
import { IssueCrewAssignment } from "@/components/issue/IssueCrewAssignment";
import { IssueManagerAssignment } from "@/components/issue/IssueManagerAssignment";
import { IssueChat } from "@/components/issue/IssueChat";
import { RoomModalHeader } from "@/components/common/RoomModalHeader";
import { ProgressTimeline } from "@/components/common/ProgressTimeline";
import { ActionPanel, ActionSection } from "@/components/common/ActionPanel";
import {
  ISSUE_CATEGORY_LABEL,
  REPORTER_TYPE_LABEL,
  ISSUE_STATUS_LABEL,
  ISSUE_URGENCY_LABEL,
} from "@/lib/labels";
import { formatDateTime } from "@/lib/format";
import { ISSUE_STATUS_NEXT, ISSUE_STEPS } from "@/lib/transitions";
import { CATEGORY_DEFAULT_ROLE } from "@/lib/types";
import type { Issue, Room, Staff } from "@/lib/types";

export function IssueDetail({
  issue,
  room,
  staffList,
  cleaningCrewName,
  roomOpenIssueCount,
}: {
  issue: Issue;
  room: Room;
  staffList: Staff[];
  cleaningCrewName: string | null;
  roomOpenIssueCount: number;
}) {
  const suggestedRole = CATEGORY_DEFAULT_ROLE[issue.category];

  const managers = staffList.filter((staff) => staff.role === "manager");

  const defaultManager =
    managers.find((manager) => manager.branch === room.branch) ?? null;

  const [managerName, setManagerName] = useState<string | null>(
    defaultManager?.name ?? null
  );

  return (
    <div className="flex flex-col gap-6">
      <RoomModalHeader
        room={room}
        operatorName={managerName}
        cleaningCrewName={cleaningCrewName}
        issueCrewName={issue.assignee?.name ?? null}
        titleSuffix="이슈"
        operationControl={{
          roomOpenIssueCount,
        }}
      />

      <div className="rounded-xl border border-black/10 bg-white/70 px-5 py-4 dark:border-white/10 dark:bg-white/[0.03]">
        <ProgressTimeline
          steps={ISSUE_STEPS}
          labelMap={ISSUE_STATUS_LABEL}
          current={issue.status}
        />
      </div>

      <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(320px,1fr)]">
        <main className="flex min-w-0 flex-col gap-5">
          <section className="rounded-xl border border-black/10 bg-white/70 p-5 dark:border-white/10 dark:bg-white/[0.03]">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-sm font-semibold">이슈 정보</h2>
              <IssueStatusBadge status={issue.status} />
            </div>

            <div className="grid grid-cols-2 gap-x-5 gap-y-5 sm:grid-cols-3">
              <Field label="이슈 유형">
                {ISSUE_CATEGORY_LABEL[issue.category]}
              </Field>

              <Field label="긴급도">
                <UrgencyBadge urgency={issue.urgency} />
              </Field>

              <Field label="신고자">
                {REPORTER_TYPE_LABEL[issue.reporter_type]}
              </Field>

              <Field label="접수 시간">
                {formatDateTime(issue.created_at)}
              </Field>

              <Field label="다음 체크인">
                {formatDateTime(room.next_checkin_at)}
              </Field>

              <Field label="배정 크루">
                {issue.assignee?.name ?? "미배정"}
              </Field>
            </div>
          </section>
          <section className="rounded-xl border border-primary/15 bg-primary/[0.04] p-5">
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-semibold">AI 요약</h2>

              <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-semibold text-primary">
                BETA
              </span>
            </div>

            <p className="mt-3 text-sm leading-6 text-foreground/80">
              {room.room_number}호에서{" "}
              <strong className="font-semibold text-foreground">
                {ISSUE_CATEGORY_LABEL[issue.category]}
              </strong>{" "}
              이슈가 접수되었습니다. 신고자는{" "}
              <strong className="font-semibold text-foreground">
                {REPORTER_TYPE_LABEL[issue.reporter_type]}
              </strong>
              이며, 접수 내용은 &ldquo;{issue.description}&rdquo;입니다. 현재{" "}
              <strong className="font-semibold text-foreground">
                {ISSUE_STATUS_LABEL[issue.status]}
              </strong>{" "}
              상태입니다.{" "}
              {issue.urgency === "urgent"
                ? "긴급도가 높아 우선적인 확인과 조치가 필요합니다."
                : "긴급도가 높지 않아 접수 순서에 따라 처리할 수 있습니다."}
            </p>

            <p className="mt-3 text-[11px] text-gray-400 dark:text-gray-500">
              AI 요약은 참고용이며 실제 상황과 다를 수 있습니다.
            </p>
          </section>
          <section className="rounded-xl border border-black/10 bg-white/70 p-5 dark:border-white/10 dark:bg-white/[0.03]">
            <h2 className="text-sm font-semibold">신고 내용</h2>

            <p className="mt-3 whitespace-pre-wrap text-sm leading-6">
              {issue.description}
            </p>

            {(issue.ai_suggested_category || issue.ai_suggested_urgency) && (
              <div className="mt-4 rounded-lg bg-black/[0.03] px-3 py-2.5 text-xs leading-5 text-gray-500 dark:bg-white/5 dark:text-gray-400">
                AI 추천값 · 유형{" "}
                {issue.ai_suggested_category
                  ? ISSUE_CATEGORY_LABEL[issue.ai_suggested_category]
                  : "-"}{" "}
                / 긴급도 {issue.ai_suggested_urgency ?? "-"}
              </div>
            )}
          </section>
          <IssueChat issue={issue} />
        </main>

        <div className="lg:sticky lg:top-6">
          <ActionPanel>
            <ActionSection
              number={1}
              title="크루 배정"
              description="현장 확인 또는 조치를 진행할 크루를 지정합니다."
              complete={Boolean(issue.assignee_id)}
              summary={`크루 배정 · ${issue.assignee?.name ?? "미배정"}`}
            >
              <IssueCrewAssignment
                issueId={issue.id}
                assigneeId={issue.assignee_id}
                staffList={staffList}
                suggestedRole={suggestedRole}
              />
            </ActionSection>

            <ActionSection
              number={2}
              title="분류 및 긴급도"
              description="신고 내용을 확인한 뒤 최종 분류를 설정합니다."
              complete={Boolean(issue.assignee_id)}
              summary={`${ISSUE_CATEGORY_LABEL[issue.category]} · ${
                ISSUE_URGENCY_LABEL[issue.urgency]
              }`}
            >
              <IssueClassificationAction
                issueId={issue.id}
                category={issue.category}
                urgency={issue.urgency}
              />
            </ActionSection>

            <ActionSection
              number={3}
              title="처리 상태"
              description="실제 업무 진행 상황에 맞게 단계를 변경합니다."
              complete={issue.status === "done"}
              summary={`처리 상태 · ${ISSUE_STATUS_LABEL[issue.status]}`}
            >
              <IssueStatusAction
                issueId={issue.id}
                status={issue.status}
                allowedNext={ISSUE_STATUS_NEXT[issue.status]}
              />
            </ActionSection>

            <ActionSection
              number={4}
              title="운영 담당자"
              description="이슈를 최종 관리할 운영 담당자를 지정합니다."
              complete={issue.status === "done"}
              summary={`운영 담당자 · ${managerName ?? "미배정"}`}
            >
              <IssueManagerAssignment
                managers={managers}
                defaultManager={defaultManager}
                managerName={managerName}
                onManagerChange={setManagerName}
              />
            </ActionSection>
          </ActionPanel>
        </div>
      </div>
    </div>
  );
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

      <div className="mt-1.5 truncate text-sm font-medium">{children}</div>
    </div>
  );
}
