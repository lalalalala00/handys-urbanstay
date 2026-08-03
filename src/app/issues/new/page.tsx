import { getRoomsForSelect } from "@/lib/queries";
import { NewIssueForm } from "@/components/NewIssueForm";

export const dynamic = "force-dynamic";

export default async function NewIssuePage() {
  const rooms = await getRoomsForSelect();

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-lg font-semibold">객실 이슈 등록</h1>
      <NewIssueForm rooms={rooms} />
    </div>
  );
}
