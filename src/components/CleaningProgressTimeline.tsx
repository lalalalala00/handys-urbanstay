import { CLEANING_STATUS_LABEL } from "@/lib/labels";
import type { CleaningTaskStatus } from "@/lib/types";

const STEPS: CleaningTaskStatus[] = [
  "unassigned",
  "assigned",
  "cleaning",
  "inspection",
  "done",
];

export function CleaningProgressTimeline({ status }: { status: CleaningTaskStatus }) {
  const currentIndex = STEPS.indexOf(status);

  return (
    <div className="flex w-full">
      {STEPS.map((step, i) => {
        const isDone = i < currentIndex;
        const isCurrent = i === currentIndex;
        const leftFilled = i > 0 && i - 1 < currentIndex;
        const rightFilled = i < STEPS.length - 1 && i < currentIndex;

        return (
          <div key={step} className="flex flex-1 flex-col items-center">
            <div className="flex w-full items-center">
              <div
                className={`h-0.5 flex-1 ${
                  i === 0
                    ? "invisible"
                    : leftFilled
                      ? "bg-foreground"
                      : "bg-black/10 dark:bg-white/10"
                }`}
              />
              <div
                className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[11px] font-semibold ${
                  isDone
                    ? "bg-foreground text-background"
                    : isCurrent
                      ? "bg-foreground text-background ring-4 ring-foreground/15"
                      : "bg-black/10 text-gray-500 dark:bg-white/10 dark:text-gray-400"
                }`}
              >
                {isDone ? "✓" : i + 1}
              </div>
              <div
                className={`h-0.5 flex-1 ${
                  i === STEPS.length - 1
                    ? "invisible"
                    : rightFilled
                      ? "bg-foreground"
                      : "bg-black/10 dark:bg-white/10"
                }`}
              />
            </div>
            <div
              className={`mt-1.5 text-center text-[11px] ${
                isCurrent
                  ? "font-semibold text-foreground"
                  : "text-gray-500 dark:text-gray-400"
              }`}
            >
              {CLEANING_STATUS_LABEL[step]}
            </div>
          </div>
        );
      })}
    </div>
  );
}
