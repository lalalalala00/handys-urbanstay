import { NewRoomForm } from "@/components/room/NewRoomForm";
import { Modal } from "@/components/common/Modal";

export const dynamic = "force-dynamic";

export default async function NewRoomModal({
  searchParams,
}: {
  searchParams: Promise<{ branch?: string }>;
}) {
  const { branch } = await searchParams;

  return (
    <Modal>
      <h1 className="mb-6 text-lg font-semibold">객실 등록</h1>
      <NewRoomForm initialBranch={branch} />
    </Modal>
  );
}
