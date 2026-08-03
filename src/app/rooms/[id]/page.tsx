import Link from "next/link";
import { notFound } from "next/navigation";
import { getRoomDetail } from "@/lib/queries";
import { RoomDetail } from "@/components/RoomDetail";

export const dynamic = "force-dynamic";

export default async function RoomDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  let detail;
  try {
    detail = await getRoomDetail(id);
  } catch {
    notFound();
  }
  if (!detail.room) notFound();

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
        operator={detail.operator}
        activity={detail.activity}
      />
    </div>
  );
}
