import { IssueStatusBadge, RoomStatusBadge, UrgencyBadge } from "@/components/StatusBadges";
import { IssueActions } from "@/components/IssueActions";
import { ISSUE_CATEGORY_LABEL } from "@/lib/labels";
import { formatDateTime } from "@/lib/format";
import { ISSUE_STATUS_NEXT } from "@/lib/transitions";
import { CATEGORY_DEFAULT_ROLE } from "@/lib/types";
import type { Issue, Room, Staff } from "@/lib/types";

export function IssueDetail({
  issue,
  room,
  staffList,
}: {
  issue: Issue;
  room: Room;
  staffList: Staff[];
}) {
  const suggestedRole = CATEGORY_DEFAULT_ROLE[issue.category];

  return (
    <div className="flex flex-col gap-6">
      <div>
        <div className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400">
          <span aria-hidden>📍</span>
          <span>{room.branch}</span>
        </div>
        <h2 className="mt-0.5 text-lg font-semibold">{room.room_number}호 이슈</h2>
      </div>

      <div className="grid grid-cols-2 gap-4 rounded-lg border border-black/10 p-4 text-sm sm:grid-cols-4 dark:border-white/10">
        <Field label="객실 상태">
          <RoomStatusBadge status={room.status} />
        </Field>
        <Field label="처리 상태">
          <IssueStatusBadge status={issue.status} />
        </Field>
        <Field label="유형">{ISSUE_CATEGORY_LABEL[issue.category]}</Field>
        <Field label="긴급도">
          <UrgencyBadge urgency={issue.urgency} />
        </Field>
        <Field label="신고자">{issue.reporter_type}</Field>
        <Field label="접수 시간">{formatDateTime(issue.created_at)}</Field>
        <Field label="다음 체크인">{formatDateTime(room.next_checkin_at)}</Field>
        <Field label="담당자">{issue.assignee?.name ?? "미배정"}</Field>
      </div>

      <div className="rounded-lg border border-black/10 p-4 dark:border-white/10">
        <div className="mb-2 text-sm font-medium">신고 내용</div>
        <p className="text-sm whitespace-pre-wrap">{issue.description}</p>
        {(issue.ai_suggested_category || issue.ai_suggested_urgency) && (
          <p className="mt-3 text-xs text-gray-500 dark:text-gray-400">
            AI 추천값 (참고용): 유형{" "}
            {issue.ai_suggested_category
              ? ISSUE_CATEGORY_LABEL[issue.ai_suggested_category]
              : "-"}{" "}
            / 긴급도 {issue.ai_suggested_urgency ?? "-"} — 운영자가 위 값으로 최종 확정했습니다.
          </p>
        )}
      </div>

      <IssueActions
        issueId={issue.id}
        status={issue.status}
        assigneeId={issue.assignee_id}
        category={issue.category}
        urgency={issue.urgency}
        staffList={staffList}
        suggestedRole={suggestedRole}
        allowedNext={ISSUE_STATUS_NEXT[issue.status]}
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
