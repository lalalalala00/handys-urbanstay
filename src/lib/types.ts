export type RoomStatus =
  | "occupied"
  | "dirty"
  | "assigned"
  | "cleaning"
  | "inspection"
  | "issue"
  | "ready";

export type CleaningTaskStatus =
  | "unassigned"
  | "assigned"
  | "cleaning"
  | "inspection"
  | "done";

export type IssueCategory =
  | "cleaning"
  | "facility"
  | "access"
  | "amenity"
  | "environment"
  | "other";

export type IssueUrgency = "low" | "normal" | "urgent";

export type IssueStatus =
  | "new"
  | "checking"
  | "assigned"
  | "in_progress"
  | "inspection"
  | "done";

export type StaffRole = "cleaner" | "facility" | "manager";

export type PaymentStatus = "paid" | "unpaid";

export interface Staff {
  id: string;
  name: string;
  role: StaffRole;
}

export interface Room {
  id: string;
  branch: string;
  room_number: string;
  status: RoomStatus;
  checkout_at: string | null;
  next_checkin_at: string | null;
  guest_name: string | null;
  guest_phone: string | null;
  guest_count: number | null;
  nights: number | null;
  payment_status: PaymentStatus | null;
  payment_amount: number | null;
  door_lock_code: string | null;
}

export interface CleaningTask {
  id: string;
  room_id: string;
  status: CleaningTaskStatus;
  assignee_id: string | null;
  estimated_minutes: number;
  started_at: string | null;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
  room?: Room;
  assignee?: Staff | null;
}

export interface Issue {
  id: string;
  room_id: string;
  category: IssueCategory;
  description: string;
  reporter_type: "guest" | "cleaner" | "manager" | "facility";
  urgency: IssueUrgency;
  status: IssueStatus;
  assignee_id: string | null;
  ai_suggested_category: IssueCategory | null;
  ai_suggested_urgency: IssueUrgency | null;
  created_at: string;
  updated_at: string;
  room?: Room;
  assignee?: Staff | null;
}

// Category -> default assignee role, per the report-to-owner mapping in the
// project spec (e.g. heating/lighting issues go to facility staff).
export const CATEGORY_DEFAULT_ROLE: Record<IssueCategory, StaffRole> = {
  cleaning: "cleaner",
  facility: "facility",
  access: "facility",
  amenity: "cleaner",
  environment: "facility",
  other: "manager",
};
