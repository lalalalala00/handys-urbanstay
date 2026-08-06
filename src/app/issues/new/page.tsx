import { getRoomsForSelect } from "@/lib/queries";
import { NewIssueForm } from "@/components/issue/NewIssueForm";

export const dynamic = "force-dynamic";

export default async function NewIssuePage({
  searchParams,
}: {
  searchParams: Promise<{
    branch?: string;
    category?: string;
    reporter?: string;
  }>;
}) {
  const { branch, category, reporter } = await searchParams;
  const rooms = await getRoomsForSelect();
  const isCleaningIssue = category === "cleaning";

  return (
    <div className="flex flex-col gap-6">
      <header>
        <h1 className="text-lg font-semibold">
          {isCleaningIssue ? "청소 문제 접수" : "운영 이슈 등록"}
        </h1>
        <p className="mt-1 text-xs text-subtext">
          {isCleaningIssue
            ? "청소 불량이나 재청소가 필요한 예외 상황을 등록합니다."
            : "시설·게스트·청소 문제를 접수하고 처리 담당자를 연결합니다."}
        </p>
      </header>
      <NewIssueForm
        rooms={rooms}
        initialBranch={branch}
        initialCategory={category}
        initialReporter={reporter}
      />
    </div>
  );
}
