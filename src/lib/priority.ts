import type { CleaningTask, Room } from "./types";

// A room is flagged "at risk" once its buffer to the next check-in drops
// below this many minutes. Chosen as a rough safety margin for a delayed
// start, not a measured figure — worth tuning once there's real data.
const RISK_THRESHOLD_MINUTES = 30;

export type RiskLevel = "urgent" | "warning" | "ok" | "none";

export interface RoomPriority {
  bufferMinutes: number | null;
  riskLevel: RiskLevel;
}

function remainingCleaningMinutes(task: CleaningTask | undefined): number {
  if (!task || task.status === "done") return 0;
  if (task.status === "unassigned" || task.status === "assigned") {
    return task.estimated_minutes;
  }
  if (task.status === "inspection") return 0;
  // cleaning: subtract time already spent, floor at 0
  if (task.started_at) {
    const elapsed = (Date.now() - new Date(task.started_at).getTime()) / 60000;
    return Math.max(task.estimated_minutes - elapsed, 0);
  }
  return task.estimated_minutes;
}

/**
 * Buffer = time left until next check-in − time still needed to finish
 * cleaning. Negative buffer means the room won't be ready in time.
 */
export function calcRoomPriority(
  room: Room,
  cleaningTask?: CleaningTask
): RoomPriority {
  if (!room.next_checkin_at) {
    return { bufferMinutes: null, riskLevel: "none" };
  }

  const minutesUntilCheckin =
    (new Date(room.next_checkin_at).getTime() - Date.now()) / 60000;
  const remaining = remainingCleaningMinutes(cleaningTask);
  const bufferMinutes = Math.round(minutesUntilCheckin - remaining);

  let riskLevel: RiskLevel = "ok";
  if (bufferMinutes < 0) riskLevel = "urgent";
  else if (bufferMinutes <= RISK_THRESHOLD_MINUTES) riskLevel = "warning";

  return { bufferMinutes, riskLevel };
}

const RISK_RANK: Record<RiskLevel, number> = {
  urgent: 0,
  warning: 1,
  ok: 2,
  none: 3,
};

/**
 * Sort key for the dashboard: risk level first (urgent → none), then an
 * unassigned cleaning task bumps the room up within its risk tier, then by
 * buffer time ascending.
 */
export function roomSortKey(
  room: Room,
  cleaningTask: CleaningTask | undefined,
  priority: RoomPriority
): [number, number, number] {
  const unassignedPenalty = cleaningTask?.status === "unassigned" ? 0 : 1;
  const buffer = priority.bufferMinutes ?? Number.POSITIVE_INFINITY;
  return [RISK_RANK[priority.riskLevel], unassignedPenalty, buffer];
}
