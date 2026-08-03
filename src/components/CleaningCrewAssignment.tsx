"use client";

import { AvailableCrewList } from "./AvailableCrewList";

export function CleaningCrewAssignment({
  taskId,
  checkinMinutes,
}: {
  taskId: string;
  checkinMinutes: number | null;
}) {
  return (
    <div className="rounded-lg border border-black/10 p-4 dark:border-white/10">
      <div className="mb-2 text-sm font-medium">크루 배정</div>
      <AvailableCrewList taskId={taskId} checkinMinutes={checkinMinutes} />
    </div>
  );
}
