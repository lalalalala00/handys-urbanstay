import { NewRoomForm } from "@/components/room/NewRoomForm";

export const dynamic = "force-dynamic";

export default async function NewRoomPage({
  searchParams,
}: {
  searchParams: Promise<{ branch?: string }>;
}) {
  const { branch } = await searchParams;

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-lg font-semibold">객실 등록</h1>
      <NewRoomForm initialBranch={branch} />
    </div>
  );
}
