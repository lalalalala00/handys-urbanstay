import { getRoomsForSelect, getStaffList } from "@/lib/queries";
import { NewCleaningTaskForm } from "@/components/cleaning/NewCleaningTaskForm";
import { Modal } from "@/components/common/Modal";

export const dynamic = "force-dynamic";

export default async function NewCleaningTaskModal({
  searchParams,
}: {
  searchParams: Promise<{ branch?: string }>;
}) {
  const { branch } = await searchParams;
  const [rooms, staff] = await Promise.all([
    getRoomsForSelect(),
    getStaffList(),
  ]);
  const cleaners = staff.filter((s) => s.role === "cleaner");

  return (
    <Modal>
      <h1 className="mb-6 text-lg font-semibold">청소 작업 등록</h1>
      <NewCleaningTaskForm
        rooms={rooms}
        cleaners={cleaners}
        initialBranch={branch}
      />
    </Modal>
  );
}
