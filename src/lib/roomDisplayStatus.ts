import { isToday } from "./format";
import type { CleaningTask, Room } from "./types";

export type RoomDisplayStatus =
  | "occupied"
  | "cleaning"
  | "inspection"
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
  if (cleaningTask?.status === "cleaning") return "cleaning";
  if (cleaningTask?.status === "inspection") return "inspection";
  if (cleaningTask && cleaningTask.status !== "done") return "dirty";
  if (isToday(room.next_checkin_at)) return "checkin_due";
  return "ready";
}

export type RoomStatusBucket = "normal" | "urgent" | "inspection" | "assigned";

export const ROOM_STATUS_BUCKET: Record<RoomDisplayStatus, RoomStatusBucket> = {
  ready: "normal",
  checkin_due: "normal",
  occupied: "normal",
  blocked: "urgent",
  dirty: "urgent",
  inspection: "inspection",
  cleaning: "assigned",
};
