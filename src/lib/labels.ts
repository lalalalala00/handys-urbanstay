import type {
  CleaningTaskStatus,
  IssueCategory,
  IssueStatus,
  IssueUrgency,
  RoomStatus,
} from "./types";

export const ROOM_STATUS_LABEL: Record<RoomStatus, string> = {
  occupied: "투숙중",
  dirty: "청소필요",
  assigned: "배정완료",
  cleaning: "청소중",
  inspection: "검수대기",
  issue: "이상신고",
  ready: "판매가능",
};

export const CLEANING_STATUS_LABEL: Record<CleaningTaskStatus, string> = {
  unassigned: "미배정",
  assigned: "배정완료",
  cleaning: "진행중",
  inspection: "검수대기",
  done: "완료",
};

export const ISSUE_STATUS_LABEL: Record<IssueStatus, string> = {
  new: "신규접수",
  checking: "확인중",
  assigned: "담당자배정",
  in_progress: "처리중",
  inspection: "검수대기",
  done: "처리완료",
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
