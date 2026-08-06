import { getRoomsForSelect } from "@/lib/queries";
import { NewIssueForm } from "@/components/issue/NewIssueForm";

export const dynamic = "force-dynamic";

export default async function NewIssuePage({
  searchParams,
}: {
  searchParams: Promise<{ branch?: string }>;
}) {
  const { branch } = await searchParams;
  const rooms = await getRoomsForSelect();

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-lg font-semibold">운영 이슈 등록</h1>
      <NewIssueForm rooms={rooms} initialBranch={branch} />
    </div>
  );
}
