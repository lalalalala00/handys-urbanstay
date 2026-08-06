import { notFound } from "next/navigation";
import { getCleaningTaskById, getStaffList } from "@/lib/queries";
import { CleaningTaskDetail } from "@/components/CleaningTaskDetail";
import { Modal } from "@/components/Modal";

export const dynamic = "force-dynamic";

export default async function CleaningTaskModal({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  let task;
  let staffList;
  try {
    [task, staffList] = await Promise.all([
      getCleaningTaskById(id),
      getStaffList(),
    ]);
  } catch {
    notFound();
  }
  if (!task || !task.room) notFound();

  const cleaners = staffList.filter((s) => s.role === "cleaner");
  const managers = staffList.filter((s) => s.role === "manager");

  return (
    <Modal wide>
      <CleaningTaskDetail
        task={task}
        room={task.room}
        cleaners={cleaners}
        managers={managers}
        roomOpenIssueCount={task.roomOpenIssueCount}
        roomOpenIssues={task.roomOpenIssues}
      />
    </Modal>
  );
}
