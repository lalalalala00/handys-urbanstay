import type { CleaningTaskStatus, IssueStatus } from "./types";

// The canonical step order for each status, used by ProgressTimeline and to
// tell forward (future) transitions apart from backward (past) ones in StatusChangeButtons.
export const CLEANING_STEPS: CleaningTaskStatus[] = [
  "unassigned",
  "assigned",
  "cleaning",
  "inspection",
  "done",
];

export const ISSUE_STEPS: IssueStatus[] = [
  "new",
  "checking",
  "assigned",
  "in_progress",
  "inspection",
  "done",
];

// Allowed forward transitions. `inspection -> cleaning` covers a failed
// inspection (재청소); everything else only moves forward.
export const CLEANING_TASK_NEXT: Record<CleaningTaskStatus, CleaningTaskStatus[]> = {
  unassigned: ["assigned"],
  assigned: ["cleaning", "unassigned"],
  cleaning: ["inspection"],
  inspection: ["done", "cleaning"],
  done: [],
};

export const ISSUE_STATUS_NEXT: Record<IssueStatus, IssueStatus[]> = {
  new: ["checking", "assigned"],
  checking: ["assigned"],
  assigned: ["in_progress"],
  in_progress: ["inspection", "done"],
  inspection: ["done"],
  done: [],
};

export function isValidCleaningTransition(
  from: CleaningTaskStatus,
  to: CleaningTaskStatus
): boolean {
  return CLEANING_TASK_NEXT[from].includes(to);
}

export function isValidIssueTransition(from: IssueStatus, to: IssueStatus): boolean {
  return ISSUE_STATUS_NEXT[from].includes(to);
}
