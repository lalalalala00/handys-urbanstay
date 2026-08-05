import { isToday } from "./format";
import type { CleaningTask, Room } from "./types";

export type RoomDisplayStatus =
  | "occupied"
  | "dirty"
  | "checkin_due"
  | "ready"
  | "blocked";

export function getRoomDisplayStatus(
  room: Room,
  cleaningTask?: CleaningTask | null
): RoomDisplayStatus {
  if (room.operation_status === "blocked") return "blocked";
  if (room.occupancy_status === "occupied") return "occupied";
  // Cleaning progress belongs to the cleaning-task domain. Until the task is
  // finished, the room-level answer stays the same: this room is not ready.
  if (cleaningTask && cleaningTask.status !== "done") return "dirty";
  if (isToday(room.next_checkin_at)) return "checkin_due";
  return "ready";
}

/** Required operations order: blocked → dirty → check-in due → occupied → ready. */
export const ROOM_DISPLAY_STATUS_RANK: Record<RoomDisplayStatus, number> = {
  blocked: 0,
  dirty: 1,
  checkin_due: 2,
  occupied: 3,
  ready: 4,
};
