import { notFound } from "next/navigation";
import { getRoomDetail } from "@/lib/queries";
import { RoomDetail } from "@/components/RoomDetail";
import { Modal } from "@/components/Modal";

export const dynamic = "force-dynamic";

export default async function RoomModal({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ view?: string }>;
}) {
  const { id } = await params;
  const { view } = await searchParams;

  let detail;
  try {
    detail = await getRoomDetail(id);
  } catch {
    notFound();
  }
  if (!detail.room) notFound();

  return (
    <Modal wide>
      <RoomDetail
        room={detail.room}
        task={detail.task}
        issues={detail.issues}
        priority={detail.priority}
        operator={detail.operator}
        activity={detail.activity}
        compact={view === "compact"}
      />
    </Modal>
  );
}
