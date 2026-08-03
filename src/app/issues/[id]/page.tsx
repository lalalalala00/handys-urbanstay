import Link from "next/link";
import { notFound } from "next/navigation";
import { getIssueById, getStaffList } from "@/lib/queries";
import { IssueStatusBadge, RoomStatusBadge, UrgencyBadge } from "@/components/StatusBadges";
import { ISSUE_CATEGORY_LABEL } from "@/lib/labels";
import { formatDateTime } from "@/lib/format";
import { ISSUE_STATUS_NEXT } from "@/lib/transitions";
import { CATEGORY_DEFAULT_ROLE } from "@/lib/types";
import { IssueActions } from "@/components/IssueActions";

export const dynamic = "force-dynamic";

export default async function IssueDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  let issue;
  try {
    issue = await getIssueById(id);
  } catch {
    notFound();
  }
  if (!issue || !issue.room) notFound();

  const staffList = await getStaffList();
  const suggestedRole = CATEGORY_DEFAULT_ROLE[issue.category as keyof typeof CATEGORY_DEFAULT_ROLE];

  return (
    <div className="flex flex-col gap-6">
      <div>
        <Link href="/issues" className="text-xs text-gray-500 hover:underline">
          ← 객실 이슈 목록
        </Link>
        <h1 className="mt-2 text-lg font-semibold">
          {issue.room.branch} {issue.room.room_number}호 이슈
        </h1>
      </div>

      <div className="grid grid-cols-2 gap-4 rounded-lg border border-black/10 p-5 sm:grid-cols-4 dark:border-white/10">
        <Field label="객실 상태">
          <RoomStatusBadge status={issue.room.status} />
        </Field>
        <Field label="처리 상태">
          <IssueStatusBadge status={issue.status} />
        </Field>
        <Field label="유형">{ISSUE_CATEGORY_LABEL[issue.category as keyof typeof ISSUE_CATEGORY_LABEL]}</Field>
        <Field label="긴급도">
          <UrgencyBadge urgency={issue.urgency} />
        </Field>
        <Field label="신고자">{issue.reporter_type}</Field>
        <Field label="접수 시간">{formatDateTime(issue.created_at)}</Field>
        <Field label="다음 체크인">{formatDateTime(issue.room.next_checkin_at)}</Field>
        <Field label="담당자">{issue.assignee?.name ?? "미배정"}</Field>
      </div>

      <div className="rounded-lg border border-black/10 p-5 dark:border-white/10">
        <div className="mb-2 text-sm font-medium">신고 내용</div>
        <p className="text-sm whitespace-pre-wrap">{issue.description}</p>
        {(issue.ai_suggested_category || issue.ai_suggested_urgency) && (
          <p className="mt-3 text-xs text-gray-500 dark:text-gray-400">
            AI 추천값 (참고용): 유형{" "}
            {issue.ai_suggested_category
              ? ISSUE_CATEGORY_LABEL[issue.ai_suggested_category as keyof typeof ISSUE_CATEGORY_LABEL]
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
        allowedNext={ISSUE_STATUS_NEXT[issue.status as keyof typeof ISSUE_STATUS_NEXT]}
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
