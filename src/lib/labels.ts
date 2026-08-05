import type {
  CleaningTaskStatus,
  IssueCategory,
  IssueStatus,
  IssueUrgency,
  StaffRole,
} from "./types";
import type { RoomDisplayStatus } from "./roomDisplayStatus";

export const REPORTER_TYPE_LABEL: Record<
  "guest" | "cleaner" | "manager" | "facility",
  string
> = {
  guest: "게스트",
  cleaner: "크루",
  manager: "운영자",
  facility: "시설",
};

// Short actor-role labels for the room activity timeline (distinct wording
// from STAFF_ROLE_LABEL, which is used for staff-list/assignment UI).
export const ACTIVITY_ACTOR_ROLE_LABEL: Record<StaffRole, string> = {
  cleaner: "크루",
  manager: "운영자",
  facility: "시설",
};

export const ROOM_DISPLAY_STATUS_LABEL: Record<RoomDisplayStatus, string> = {
  occupied: "투숙 중",
  dirty: "청소 필요",
  checkin_due: "입실 예정",
  ready: "입실 가능",
  blocked: "판매 중지",
};

export const CLEANING_STATUS_LABEL: Record<CleaningTaskStatus, string> = {
  unassigned: "미배정",
  assigned: "배정 완료",
  cleaning: "청소 중",
  inspection: "검수 대기",
  done: "완료",
};

export const ISSUE_STATUS_LABEL: Record<IssueStatus, string> = {
  new: "신규 접수",
  checking: "접수 확인",
  assigned: "담당자 배정",
  in_progress: "처리 중",
  inspection: "완료 확인",
  done: "완료",
};

export const ISSUE_CATEGORY_LABEL: Record<IssueCategory, string> = {
  cleaning: "청소 불량",
  facility: "시설(냉난방/전기)",
  access: "출입(도어락)",
  amenity: "비품",
  environment: "환경(소음/냄새)",
  other: "기타",
};

export const ISSUE_URGENCY_LABEL: Record<IssueUrgency, string> = {
  urgent: "긴급",
  normal: "보통",
  low: "낮음",
};

export const STAFF_ROLE_LABEL: Record<StaffRole, string> = {
  cleaner: "청소",
  facility: "시설",
  manager: "매니저",
};
