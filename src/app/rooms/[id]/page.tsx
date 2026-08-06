import Link from "next/link";
import { notFound } from "next/navigation";
import { getRoomDetail, getStaffList } from "@/lib/queries";
import { RoomDetail } from "@/components/room/RoomDetail";

export const dynamic = "force-dynamic";

export default async function RoomDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ view?: string }>;
}) {
  const { id } = await params;
  const { view } = await searchParams;

  let detail;
  let staffList;
  try {
    [detail, staffList] = await Promise.all([getRoomDetail(id), getStaffList()]);
  } catch {
    notFound();
  }
  if (!detail.room) notFound();

  const managers = staffList.filter((s) => s.role === "manager");

  return (
    <div className="flex flex-col gap-6">
      <Link href="/" className="text-xs text-gray-500 hover:underline">
        ← 대시보드
      </Link>
      <RoomDetail
        room={detail.room}
        task={detail.task}
        issues={detail.issues}
        priority={detail.priority}
        managers={managers}
        activity={detail.activity}
        compact={view === "compact"}
      />
    </div>
  );
}
