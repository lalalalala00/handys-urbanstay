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

// "assigned" is intentionally not a manually selectable target here — it
// only happens as a side effect of actually assigning a crew (see the
// crew-assignment branch in PATCH /api/issues/[id]), so the status can't
// drift ahead of who's actually on it.
//
// in_progress -> inspection -> done is a two-actor handoff: the crew marks
// their work done (-> inspection, "처리 완료"), then the issue's manager
// confirms (-> done). Each state only ever offers one forward option so
// there's never a choice between two "done-ish" buttons at once.
export const ISSUE_STATUS_NEXT: Record<IssueStatus, IssueStatus[]> = {
  new: ["checking"],
  checking: [],
  assigned: ["in_progress"],
  in_progress: ["inspection"],
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
