"use client";

import { AvailableCrewList } from "@/components/cleaning/AvailableCrewList";

export function CleaningCrewAssignment({
  taskId,
  checkinMinutes,
  onAssigned,
}: {
  taskId: string;
  checkinMinutes: number | null;
  onAssigned?: (crewName: string) => void;
}) {
  return (
    <section className="rounded-xl border border-black/10 bg-white/70 p-5 dark:border-white/10 dark:bg-white/[0.03]">
      <div className="mb-4">
        <h2 className="text-sm font-semibold">크루 배정</h2>
        <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
          위치와 작업량을 기준으로 배정 가능한 크루를 추천합니다.
        </p>
      </div>

      <AvailableCrewList taskId={taskId} checkinMinutes={checkinMinutes} onAssigned={onAssigned} />
    </section>
  );
}
