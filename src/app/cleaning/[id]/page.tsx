import Link from "next/link";
import { notFound } from "next/navigation";
import { getCleaningTaskById, getStaffList } from "@/lib/queries";
import { CleaningTaskDetail } from "@/components/CleaningTaskDetail";

export const dynamic = "force-dynamic";

export default async function CleaningTaskDetailPage({
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
    <div className="flex flex-col gap-6">
      <Link href="/cleaning" className="text-xs text-gray-500 hover:underline">
        ← 청소 작업 목록
      </Link>
      <CleaningTaskDetail
        task={task}
        room={task.room}
        cleaners={cleaners}
        managers={managers}
        roomOpenIssueCount={task.roomOpenIssueCount}
      />
    </div>
  );
}
