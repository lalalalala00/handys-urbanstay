import { getRoomsForSelect, getStaffList } from "@/lib/queries";
import { NewCleaningTaskForm } from "@/components/NewCleaningTaskForm";

export const dynamic = "force-dynamic";

export default async function NewCleaningTaskPage({
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
    <div className="flex flex-col gap-6">
      <h1 className="text-lg font-semibold">청소 작업 등록</h1>
      <NewCleaningTaskForm
        rooms={rooms}
        cleaners={cleaners}
        initialBranch={branch}
      />
    </div>
  );
}
