import { notFound } from "next/navigation";
import { getIssueById, getStaffList, getRoomCrew } from "@/lib/queries";
import { IssueDetail } from "@/components/IssueDetail";
import { Modal } from "@/components/Modal";

export const dynamic = "force-dynamic";

export default async function IssueModal({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  let issue;
  let staffList;
  try {
    [issue, staffList] = await Promise.all([
      getIssueById(id),
      getStaffList(),
    ]);
  } catch {
    notFound();
  }
  if (!issue || !issue.room) notFound();

  const crew = await getRoomCrew(issue.room_id);

  return (
    <Modal wide>
      <IssueDetail
        issue={issue}
        room={issue.room}
        staffList={staffList}
        crew={crew}
        roomOpenIssueCount={issue.roomOpenIssueCount}
      />
    </Modal>
  );
}
