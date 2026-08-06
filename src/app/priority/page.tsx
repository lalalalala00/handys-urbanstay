import Link from "next/link";
import { getPriorityWorkItems } from "@/lib/queries";
import { ClickableTableRow } from "@/components/common/ClickableTableRow";
import { CleaningIcon, IssueIcon } from "@/components/common/icons";
import {
  WORK_TONE_CLASSES,
  workActionLabel,
  workAssigneeName,
  workBadge,
  workHref,
  workSummary,
  workTone,
} from "@/lib/workItemPresentation";

export const dynamic = "force-dynamic";

export default async function PriorityWorkPage({
  searchParams,
}: {
  searchParams: Promise<{ branch?: string; region?: string }>;
}) {
  const { branch, region } = await searchParams;
  const allItems = await getPriorityWorkItems({ branch, region });
  const items = allItems.filter((item) => item.priorityTier <= 2);

  return (
    <div className="flex flex-col gap-5">
      <header>
        <div className="flex items-center gap-2">
          <h1 className="text-lg font-semibold">즉시 처리</h1>
          <span className="rounded-full bg-danger-bg px-2 py-0.5 text-[11px] font-semibold text-danger-text">
            {items.length}
          </span>
        </div>
        <p className="mt-1 text-xs text-subtext">
          체크인 임박·청소 지연·긴급 이슈를 하나의 우선순위로 정렬해 확인합니다.
        </p>
      </header>

      <div className="overflow-hidden rounded-xl border border-card-border bg-card">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-sm">
            <thead className="bg-black/[0.02] text-left text-xs text-subtext">
              <tr>
                <th className="px-4 py-3 font-medium">객실</th>
                <th className="px-4 py-3 font-medium">유형</th>
                <th className="px-4 py-3 font-medium">내용</th>
                <th className="px-4 py-3 font-medium">담당자</th>
                <th className="w-24 px-4 py-3 font-medium"><span className="sr-only">액션</span></th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => {
                const tone = WORK_TONE_CLASSES[workTone(item)];
                const Icon = item.kind === "cleaning" ? CleaningIcon : IssueIcon;
                return (
                  <ClickableTableRow
                    key={item.id}
                    href={workHref(item)}
                    className="border-t border-card-border transition-colors hover:bg-black/[0.02] dark:hover:bg-white/[0.025]"
                  >
                    <td className="px-4 py-3">
                      <Link
                        href={`/rooms/${item.room.id}`}
                        className="font-semibold hover:text-primary"
                      >
                        {item.room.branch} · {item.room.room_number}호
                      </Link>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-semibold ${tone.badge}`}
                      >
                        <Icon className="h-3 w-3" />
                        {workBadge(item)}
                      </span>
                    </td>
                    <td className="max-w-md px-4 py-3">
                      <p className="line-clamp-1 text-foreground/75">{workSummary(item)}</p>
                    </td>
                    <td className="px-4 py-3 text-subtext">{workAssigneeName(item)}</td>
                    <td className="px-4 py-3 text-right">
                      <Link
                        href={workHref(item)}
                        className="inline-flex text-xs font-semibold text-primary hover:underline"
                      >
                        {workActionLabel(item)}
                      </Link>
                    </td>
                  </ClickableTableRow>
                );
              })}
              {items.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-10 text-center text-sm text-subtext">
                    지금 바로 처리할 긴급 작업이 없습니다.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
