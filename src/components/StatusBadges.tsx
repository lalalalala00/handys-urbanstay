import { Badge, type Tone } from "./Badge";
import {
  CLEANING_STATUS_LABEL,
  ISSUE_STATUS_LABEL,
  ISSUE_URGENCY_LABEL,
  ROOM_DISPLAY_STATUS_LABEL,
} from "@/lib/labels";
import type { CleaningTaskStatus, IssueStatus, IssueUrgency } from "@/lib/types";
import type { RoomDisplayStatus } from "@/lib/roomDisplayStatus";
import type { RiskLevel } from "@/lib/priority";

const ROOM_TONE: Record<RoomDisplayStatus, Tone> = {
  occupied: "neutral",
  cleaning: "info",
  inspection: "warning",
  dirty: "danger",
  checkin_due: "info",
  ready: "success",
  blocked: "danger",
};

export const CLEANING_TONE: Record<CleaningTaskStatus, Tone> = {
  unassigned: "danger",
  assigned: "info",
  cleaning: "info",
  inspection: "warning",
  done: "success",
};

export const ISSUE_STATUS_TONE: Record<IssueStatus, Tone> = {
  new: "danger",
  checking: "warning",
  assigned: "info",
  in_progress: "info",
  inspection: "warning",
  done: "success",
};

const URGENCY_TONE: Record<IssueUrgency, Tone> = {
  urgent: "danger",
  normal: "warning",
  low: "neutral",
};

const RISK_TONE: Record<RiskLevel, Tone> = {
  urgent: "danger",
  warning: "warning",
  ok: "success",
  none: "neutral",
};

export function RoomStatusBadge({ status }: { status: RoomDisplayStatus }) {
  return <Badge tone={ROOM_TONE[status]}>{ROOM_DISPLAY_STATUS_LABEL[status]}</Badge>;
}

export function CleaningStatusBadge({ status }: { status: CleaningTaskStatus }) {
  return <Badge tone={CLEANING_TONE[status]}>{CLEANING_STATUS_LABEL[status]}</Badge>;
}

export function IssueStatusBadge({ status }: { status: IssueStatus }) {
  return <Badge tone={ISSUE_STATUS_TONE[status]}>{ISSUE_STATUS_LABEL[status]}</Badge>;
}

export function UrgencyBadge({ urgency }: { urgency: IssueUrgency }) {
  return <Badge tone={URGENCY_TONE[urgency]}>{ISSUE_URGENCY_LABEL[urgency]}</Badge>;
}

export function RiskBadge({ level, label }: { level: RiskLevel; label: string }) {
  return <Badge tone={RISK_TONE[level]}>{label}</Badge>;
}
