import { notFound } from "next/navigation";
import { getCleaningTaskById, getStaffList, getRoomOperator } from "@/lib/queries";
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
  try {
    task = await getCleaningTaskById(id);
  } catch {
    notFound();
  }
  if (!task || !task.room) notFound();

  const staffList = await getStaffList();
  const cleaners = staffList.filter((s) => s.role === "cleaner");
  const managers = staffList.filter((s) => s.role === "manager");
  const operator = await getRoomOperator(task.room_id);

  return (
    <Modal>
      <CleaningTaskDetail
        task={task}
        room={task.room}
        cleaners={cleaners}
        managers={managers}
        operator={operator}
      />
    </Modal>
  );
}
