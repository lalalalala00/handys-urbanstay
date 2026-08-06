import { formatBuffer, formatRelative } from "./format";
import { cleaningNextActionLabel, issueNextActionLabel } from "./labels";
import type { DashboardWorkItem } from "./queries";
import type { CleaningTask } from "./types";

export type WorkTone = "danger" | "warning" | "info";

export const WORK_TONE_CLASSES: Record<
  WorkTone,
  { card: string; icon: string; badge: string; button: string }
> = {
  danger: {
    card: "border-danger-border bg-danger-bg/45",
    icon: "bg-danger-bg text-danger-text",
    badge: "bg-danger-bg text-danger-text",
    button:
      "border-danger-border bg-card text-danger-text hover:bg-danger-bg",
  },
  warning: {
    card: "border-warning-border bg-warning-bg/45",
    icon: "bg-warning-bg text-warning-text",
    badge: "bg-warning-bg text-warning-text",
    button:
      "border-warning-border bg-card text-warning-text hover:bg-warning-bg",
  },
  info: {
    card: "border-info-border bg-info-bg/40",
    icon: "bg-info-bg text-info-text",
    badge: "bg-info-bg text-info-text",
    button: "border-info-border bg-card text-info-text hover:bg-info-bg",
  },
};

export function workTone(item: DashboardWorkItem): WorkTone {
  if (item.priorityTier <= 2) return "danger";
  if (item.priorityTier === 3) return "warning";
  return "info";
}

export function workBadge(item: DashboardWorkItem): string {
  if (item.kind === "issue") {
    return item.issue?.urgency === "urgent" ? "긴급 이슈" : "운영 이슈";
  }
  if (item.priorityTier === 0) return "체크인 임박";
  if (item.priorityTier === 2) return formatBuffer(item.priority?.bufferMinutes ?? null);
  if (item.task?.status === "inspection") return "검수 대기";
  if (item.task?.status === "unassigned") return "미배정";
  return "청소 작업";
}

export function workSummary(item: DashboardWorkItem): string {
  if (item.kind === "issue") return item.issue?.description ?? "이슈 내용 없음";
  if (!item.room.next_checkin_at) return "다음 체크인 일정 없음";
  return `체크인 ${formatRelative(item.room.next_checkin_at)}`;
}

export function workHref(item: DashboardWorkItem): string {
  if (item.kind === "issue") return `/issues/${item.issue!.id}`;
  return `/cleaning/${item.task!.id}`;
}

export function workActionLabel(item: DashboardWorkItem): string {
  if (item.kind === "cleaning" && item.task) {
    return cleaningNextActionLabel(item.task.status) ?? "확인하기";
  }
  if (item.kind === "issue" && item.issue) {
    return issueNextActionLabel(
      item.issue.status,
      Boolean(item.issue.assignee_id)
    ) ?? "확인하기";
  }
  return "확인하기";
}

export function assigneeName(task: CleaningTask | null) {
  if (!task) return "-";
  return task.assignee?.name ?? "미배정";
}

export function workAssigneeName(item: DashboardWorkItem): string {
  if (item.kind === "cleaning") return assigneeName(item.task);
  return item.issue?.assignee?.name ?? "담당자 미배정";
}
