import Link from "next/link";
import { notFound } from "next/navigation";
import { getIssueById, getStaffList, getRoomCrew } from "@/lib/queries";
import { IssueDetail } from "@/components/IssueDetail";

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
  const crew = await getRoomCrew(issue.room_id);

  return (
    <div className="flex flex-col gap-6">
      <Link href="/issues" className="text-xs text-gray-500 hover:underline">
        ← 운영 이슈 목록
      </Link>
      <IssueDetail
        issue={issue}
        room={issue.room}
        staffList={staffList}
        crew={crew}
        roomOpenIssueCount={issue.roomOpenIssueCount}
      />
    </div>
  );
}
