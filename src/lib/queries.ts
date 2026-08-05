import { getSupabaseServerClient } from "./supabase-server";
import { calcRoomPriority, roomSortKey, type RoomPriority } from "./priority";
import { branchesInRegion } from "./regions";
import { isToday } from "./format";
import { ACTIVITY_ACTOR_ROLE_LABEL, REPORTER_TYPE_LABEL } from "./labels";
import {
  getRoomDisplayStatus,
  ROOM_DISPLAY_STATUS_RANK,
  type RoomDisplayStatus,
} from "./roomDisplayStatus";
import type { CleaningTask, Issue, Room, Staff } from "./types";

const CLEANING_EVENT_LABEL: Record<CleaningTask["status"], string> = {
  unassigned: "크루 배정 요청",
  assigned: "크루 배정 완료",
  cleaning: "청소 시작",
  inspection: "검수 대기",
  done: "청소 완료",
};

const CLEANING_EVENT_CATEGORY: Record<CleaningTask["status"], "assignment" | "cleaning"> = {
  unassigned: "assignment",
  assigned: "assignment",
  cleaning: "cleaning",
  inspection: "cleaning",
  done: "cleaning",
};

const ISSUE_EVENT_LABEL: Record<Issue["status"], string> = {
  new: "이상 신고 접수",
  checking: "이상 신고 확인 중",
  assigned: "이상 신고 담당자 배정",
  in_progress: "이상 신고 처리 중",
  inspection: "이상 신고 검수 대기",
  done: "이상 신고 처리 완료",
};

export type ActivityCategory = "assignment" | "cleaning" | "issue";

export type ActivityItem = {
  id: string;
  room: string;
  action: string;
  time: Date;
  done: boolean;
  category: ActivityCategory;
};

export type DashboardWorkItem = {
  id: string;
  kind: "cleaning" | "issue";
  room: Room;
  task: CleaningTask | null;
  issue: Issue | null;
  priority: RoomPriority | null;
  priorityTier: number;
};

export async function getDashboardData(filter?: { branch?: string; region?: string }) {
  const supabase = getSupabaseServerClient();

  const branch = filter?.branch;
  const regionBranches = !branch && filter?.region ? branchesInRegion(filter.region) : [];

  let roomsQuery = supabase.from("rooms").select("*");
  if (branch) {
    roomsQuery = roomsQuery.eq("branch", branch);
  } else if (regionBranches.length > 0) {
    roomsQuery = roomsQuery.in("branch", regionBranches);
  }
  const [roomsRes, tasksRes, issuesRes, allIssuesRes, staffRes] = await Promise.all([
    roomsQuery,
    supabase
      .from("cleaning_tasks")
      .select("*, room:rooms(id, branch, room_number), assignee:staff(id, name, role)")
      .order("created_at", { ascending: false }),
    supabase
      .from("issues")
      .select(
        "*, room:rooms(id, branch, room_number), assignee:staff(id, name, role)"
      )
      .neq("status", "done")
      .order("created_at", { ascending: true }),
    supabase
      .from("issues")
      .select(
        "*, room:rooms(id, branch, room_number), assignee:staff(id, name, role)"
      )
      .order("updated_at", { ascending: false })
      .limit(50),
    supabase.from("staff").select("*").eq("role", "cleaner").order("name"),
  ]);

  const firstError =
    roomsRes.error || tasksRes.error || issuesRes.error || allIssuesRes.error || staffRes.error;
  if (firstError) throw new Error(firstError.message);

  const rooms = (roomsRes.data ?? []) as Room[];
  const roomIds = new Set(rooms.map((r) => r.id));
  const tasks = ((tasksRes.data ?? []) as CleaningTask[]).filter((t) =>
    roomIds.has(t.room_id)
  );
  const issues = ((issuesRes.data ?? []) as Issue[])
    .filter((i) => roomIds.has(i.room_id))
    .sort(compareIssues);
  const allIssues = ((allIssuesRes.data ?? []) as Issue[]).filter((i) =>
    roomIds.has(i.room_id)
  );
  const cleaners = (staffRes.data ?? []) as Staff[];

  const latestTaskByRoom = new Map<string, CleaningTask>();
  for (const task of tasks) {
    if (!latestTaskByRoom.has(task.room_id)) {
      latestTaskByRoom.set(task.room_id, task);
    }
  }

  const roomsWithPriority = rooms.map((room) => {
    const task = latestTaskByRoom.get(room.id);
    const priority = calcRoomPriority(room, task);
    return { room, task: task ?? null, priority };
  });

  const roomsByPriority = [...roomsWithPriority].sort((a, b) => {
    const statusDifference =
      ROOM_DISPLAY_STATUS_RANK[getRoomDisplayStatus(a.room, a.task)] -
      ROOM_DISPLAY_STATUS_RANK[getRoomDisplayStatus(b.room, b.task)];
    if (statusDifference !== 0) return statusDifference;

    const ka = roomSortKey(a.room, a.task ?? undefined, a.priority);
    const kb = roomSortKey(b.room, b.task ?? undefined, b.priority);
    for (let i = 0; i < ka.length; i++) {
      if (ka[i] !== kb[i]) return ka[i] - kb[i];
    }
    return 0;
  });

  const cleaningTasksByPriority = [...roomsWithPriority]
    .filter((item) => item.task && item.task.status !== "done")
    .sort(compareCleaningRoomItems);

  const roomById = new Map(rooms.map((room) => [room.id, room]));
  const priorityWorkItems = buildDashboardWorkItems(
    roomsWithPriority,
    issues,
    roomById
  );

  const attentionRoomIds = new Set<string>();
  for (const item of roomsWithPriority) {
    if (
      item.room.operation_status === "blocked" ||
      item.task?.status === "unassigned" ||
      item.task?.status === "inspection" ||
      item.priority.riskLevel === "urgent" ||
      item.priority.riskLevel === "warning"
    ) {
      attentionRoomIds.add(item.room.id);
    }
  }
  for (const issue of issues) attentionRoomIds.add(issue.room_id);

  const latestTasks = Array.from(latestTaskByRoom.values());
  const crew = cleaners.map((member) => {
    const activeTasks = latestTasks.filter(
      (task) => task.assignee_id === member.id && task.status !== "done"
    );
    const activeTask =
      activeTasks.find((task) => task.status === "cleaning") ??
      activeTasks.find((task) => task.status === "inspection") ??
      activeTasks.find((task) => task.status === "assigned") ??
      null;

    return {
      staff: member,
      working:
        activeTask?.status === "cleaning" || activeTask?.status === "inspection",
      activeCount: activeTasks.length,
      completedCount: tasks.filter(
        (task) =>
          task.assignee_id === member.id &&
          task.status === "done" &&
          Boolean(task.completed_at) &&
          isToday(task.completed_at)
      ).length,
      branch: activeTask?.room?.branch ?? null,
    };
  });

  const summary = {
    normal: rooms.length - attentionRoomIds.size,
    immediate: priorityWorkItems.filter((item) => item.priorityTier <= 2).length,
    inspection: roomsWithPriority.filter(
      (item) => item.task?.status === "inspection"
    ).length,
    unassigned: roomsWithPriority.filter(
      (item) => item.task?.status === "unassigned"
    ).length,
    guestInquiries: issues.filter((issue) => issue.reporter_type === "guest").length,
  };

  const activityHistory: ActivityItem[] = [
    ...tasks.map((task) => {
      const room = task.room ? `${task.room.branch} ${task.room.room_number}호` : "객실";
      const time =
        task.status === "done" && task.completed_at
          ? task.completed_at
          : task.status === "cleaning" && task.started_at
            ? task.started_at
            : task.updated_at;
      return {
        id: `task-${task.id}`,
        room,
        action: CLEANING_EVENT_LABEL[task.status],
        time: new Date(time),
        done: task.status === "done",
        category: CLEANING_EVENT_CATEGORY[task.status],
      };
    }),
    ...allIssues.map((issue) => {
      const room = issue.room
        ? `${issue.room.branch} ${issue.room.room_number}호`
        : "객실";
      return {
        id: `issue-${issue.id}`,
        room,
        action: ISSUE_EVENT_LABEL[issue.status],
        time: new Date(issue.updated_at),
        done: issue.status === "done",
        category: "issue" as const,
      };
    }),
  ].sort((a, b) => b.time.getTime() - a.time.getTime());

  const activity = activityHistory.slice(0, 5);

  return {
    summary,
    priorityWorkItems,
    roomsByPriority,
    cleaningTasksByPriority,
    openIssues: issues,
    crew,
    activity,
    activityHistory,
    totalRooms: rooms.length,
  };
}

type RoomPriorityItem = {
  room: Room;
  task: CleaningTask | null;
  priority: RoomPriority;
};

const CLEANING_STATUS_RANK: Record<CleaningTask["status"], number> = {
  unassigned: 0,
  assigned: 1,
  cleaning: 1,
  inspection: 2,
  done: 3,
};

function compareCleaningRoomItems(a: RoomPriorityItem, b: RoomPriorityItem) {
  const statusDifference =
    CLEANING_STATUS_RANK[a.task?.status ?? "done"] -
    CLEANING_STATUS_RANK[b.task?.status ?? "done"];
  if (statusDifference !== 0) return statusDifference;

  const ka = roomSortKey(a.room, a.task ?? undefined, a.priority);
  const kb = roomSortKey(b.room, b.task ?? undefined, b.priority);
  for (let index = 0; index < ka.length; index += 1) {
    if (ka[index] !== kb[index]) return ka[index] - kb[index];
  }
  return 0;
}

const ISSUE_STATUS_RANK: Record<Issue["status"], number> = {
  new: 0,
  checking: 1,
  assigned: 2,
  in_progress: 3,
  inspection: 4,
  done: 5,
};

function compareIssues(a: Issue, b: Issue) {
  const urgencyDifference = URGENCY_RANK[a.urgency] - URGENCY_RANK[b.urgency];
  if (urgencyDifference !== 0) return urgencyDifference;

  const statusDifference = ISSUE_STATUS_RANK[a.status] - ISSUE_STATUS_RANK[b.status];
  if (statusDifference !== 0) return statusDifference;

  return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
}

function buildDashboardWorkItems(
  roomsWithPriority: RoomPriorityItem[],
  issues: Issue[],
  roomById: Map<string, Room>
): DashboardWorkItem[] {
  const cleaningItems: DashboardWorkItem[] = roomsWithPriority
    .filter((item) => item.task && item.task.status !== "done")
    .map((item) => {
      const minutesToCheckin = item.room.next_checkin_at
        ? (new Date(item.room.next_checkin_at).getTime() - Date.now()) / 60_000
        : null;
      const isCheckinImminent =
        minutesToCheckin !== null && minutesToCheckin >= 0 && minutesToCheckin <= 60;

      const priorityTier = isCheckinImminent
        ? 0
        : item.priority.bufferMinutes !== null && item.priority.bufferMinutes < 0
          ? 2
          : item.task?.status === "inspection"
            ? 3
            : 4;

      return {
        id: `cleaning-${item.task!.id}`,
        kind: "cleaning" as const,
        room: item.room,
        task: item.task,
        issue: null,
        priority: item.priority,
        priorityTier,
      };
    });

  const issueItems: DashboardWorkItem[] = issues.flatMap((issue) => {
    const room = roomById.get(issue.room_id);
    if (!room) return [];
    return [
      {
        id: `issue-${issue.id}`,
        kind: "issue" as const,
        room,
        task: null,
        issue,
        priority: null,
        priorityTier: issue.urgency === "urgent" ? 1 : 4,
      },
    ];
  });

  return [...cleaningItems, ...issueItems].sort((a, b) => {
    if (a.priorityTier !== b.priorityTier) return a.priorityTier - b.priorityTier;

    if (a.kind === "cleaning" && b.kind === "cleaning") {
      return (a.priority?.bufferMinutes ?? Number.POSITIVE_INFINITY) -
        (b.priority?.bufferMinutes ?? Number.POSITIVE_INFINITY);
    }
    if (a.kind === "issue" && b.kind === "issue") {
      return compareIssues(a.issue!, b.issue!);
    }
    return a.kind === "cleaning" ? -1 : 1;
  });
}

export async function getOpenAlertsCount() {
  const supabase = getSupabaseServerClient();
  const { count, error } = await supabase
    .from("issues")
    .select("id", { count: "exact", head: true })
    .neq("status", "done");
  if (error) throw new Error(error.message);
  return count ?? 0;
}

export async function getCleaningTasksList(filter?: { branch?: string; region?: string }) {
  const supabase = getSupabaseServerClient();
  const { data, error } = await supabase
    .from("cleaning_tasks")
    .select("*, room:rooms(*), assignee:staff(id, name, role)")
    .order("created_at", { ascending: false });

  if (error) throw new Error(error.message);

  const branch = filter?.branch;
  const regionBranches = !branch && filter?.region ? branchesInRegion(filter.region) : [];
  const allowedBranches = branch ? [branch] : regionBranches;

  let tasks = (data ?? []) as CleaningTask[];
  if (allowedBranches.length > 0) {
    tasks = tasks.filter((t) => t.room && allowedBranches.includes(t.room.branch));
  }

  const withPriority = tasks
    .filter((t) => t.room)
    .map((task) => ({ task, priority: calcRoomPriority(task.room!, task) }));

  withPriority.sort((a, b) => {
    const statusDifference =
      CLEANING_STATUS_RANK[a.task.status] - CLEANING_STATUS_RANK[b.task.status];
    if (statusDifference !== 0) return statusDifference;

    const ka = roomSortKey(a.task.room!, a.task, a.priority);
    const kb = roomSortKey(b.task.room!, b.task, b.priority);
    for (let i = 0; i < ka.length; i++) {
      if (ka[i] !== kb[i]) return ka[i] - kb[i];
    }
    return 0;
  });

  return withPriority.map(({ task, priority }) => ({ ...task, priority }));
}

export async function getCleaningTaskById(id: string) {
  const supabase = getSupabaseServerClient();
  const { data, error } = await supabase
    .from("cleaning_tasks")
    .select("*, room:rooms(*), assignee:staff(id, name, role)")
    .eq("id", id)
    .single();
  if (error) throw new Error(error.message);
  return data as CleaningTask;
}

const URGENCY_RANK: Record<string, number> = { urgent: 0, normal: 1, low: 2 };

export async function getIssuesList(filter?: { branch?: string; region?: string }) {
  const supabase = getSupabaseServerClient();
  const { data, error } = await supabase
    .from("issues")
    .select(
      "*, room:rooms(id, branch, room_number, next_checkin_at), assignee:staff(id, name, role)"
    )
    .order("created_at", { ascending: false });

  if (error) throw new Error(error.message);

  const branch = filter?.branch;
  const regionBranches = !branch && filter?.region ? branchesInRegion(filter.region) : [];
  const allowedBranches = branch ? [branch] : regionBranches;

  let issues = (data ?? []) as Issue[];
  if (allowedBranches.length > 0) {
    issues = issues.filter((i) => i.room && allowedBranches.includes(i.room.branch));
  }

  return issues.sort(compareIssues);
}

export async function getIssueById(id: string) {
  const supabase = getSupabaseServerClient();
  const { data, error } = await supabase
    .from("issues")
    .select("*, room:rooms(*), assignee:staff(id, name, role)")
    .eq("id", id)
    .single();
  if (error) throw new Error(error.message);
  const issue = data as Issue;

  const { count, error: openCountError } = await supabase
    .from("issues")
    .select("id", { count: "exact", head: true })
    .eq("room_id", issue.room_id)
    .neq("status", "done");
  if (openCountError) throw new Error(openCountError.message);

  return { ...issue, roomOpenIssueCount: count ?? 0 };
}

// The crew assigned to this room's latest cleaning task, for the shared
// modal header.
export async function getRoomCrew(roomId: string): Promise<Staff | null> {
  const supabase = getSupabaseServerClient();
  const { data, error } = await supabase
    .from("cleaning_tasks")
    .select("assignee:staff(id, name, role, branch)")
    .eq("room_id", roomId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return (data?.assignee as unknown as Staff | null) ?? null;
}

export type RoomActivityItem = {
  id: string;
  time: Date;
  actorName: string | null;
  actorRole: string;
  action: string;
  detail: string | null;
  kind: "cleaning" | "issue";
  done: boolean;
};

export async function getRoomDetail(id: string) {
  const supabase = getSupabaseServerClient();

  const [roomRes, taskRes, allTasksRes, issuesRes, allIssuesRes] = await Promise.all([
    supabase.from("rooms").select("*").eq("id", id).single(),
    supabase
      .from("cleaning_tasks")
      .select("*, assignee:staff(id, name, role)")
      .eq("room_id", id)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
    supabase
      .from("cleaning_tasks")
      .select("*, assignee:staff(id, name, role)")
      .eq("room_id", id)
      .order("created_at", { ascending: false }),
    supabase
      .from("issues")
      .select("*, assignee:staff(id, name, role)")
      .eq("room_id", id)
      .neq("status", "done")
      .order("urgency", { ascending: true })
      .order("created_at", { ascending: true }),
    supabase
      .from("issues")
      .select("*, assignee:staff(id, name, role)")
      .eq("room_id", id)
      .order("created_at", { ascending: false }),
  ]);

  const firstError =
    roomRes.error || taskRes.error || allTasksRes.error || issuesRes.error || allIssuesRes.error;
  if (firstError) throw new Error(firstError.message);

  const room = roomRes.data as Room;
  const task = (taskRes.data as CleaningTask | null) ?? null;
  const allTasks = (allTasksRes.data ?? []) as CleaningTask[];
  const issues = (issuesRes.data ?? []) as Issue[];
  const allIssues = (allIssuesRes.data ?? []) as Issue[];

  const priority = calcRoomPriority(room, task ?? undefined);
  const operator = issues.find((i) => i.assignee)?.assignee ?? null;

  const activity: RoomActivityItem[] = [
    ...allTasks.map((t) => {
      const time =
        t.status === "done" && t.completed_at
          ? t.completed_at
          : t.status === "cleaning" && t.started_at
            ? t.started_at
            : t.updated_at;
      return {
        id: `task-${t.id}`,
        time: new Date(time),
        actorName: t.assignee?.name ?? null,
        actorRole: t.assignee ? ACTIVITY_ACTOR_ROLE_LABEL[t.assignee.role] : "운영자",
        action: CLEANING_EVENT_LABEL[t.status],
        detail: null,
        kind: "cleaning" as const,
        done: t.status === "done",
      };
    }),
    ...allIssues.map((i) => ({
      id: `issue-${i.id}`,
      time: new Date(i.updated_at),
      actorName: i.status === "new" ? null : (i.assignee?.name ?? null),
      actorRole:
        i.status === "new" || !i.assignee
          ? REPORTER_TYPE_LABEL[i.reporter_type]
          : ACTIVITY_ACTOR_ROLE_LABEL[i.assignee.role],
      action: ISSUE_EVENT_LABEL[i.status],
      detail: i.description,
      kind: "issue" as const,
      done: i.status === "done",
    })),
  ].sort((a, b) => b.time.getTime() - a.time.getTime());

  return {
    room,
    task,
    issues,
    priority,
    operator,
    activity,
  };
}

export type RoomOverviewItem = {
  room: Room;
  task: CleaningTask | null;
  displayStatus: RoomDisplayStatus;
  openIssueCount: number;
};

export type RoomsOverviewSummary = {
  occupied: number;
  checkinDue: number;
  checkoutDue: number;
  needsCleaning: number;
  ready: number;
  blocked: number;
};

export async function getRoomsOverview(filter?: { branch?: string; region?: string }) {
  const supabase = getSupabaseServerClient();

  const branch = filter?.branch;
  const regionBranches = !branch && filter?.region ? branchesInRegion(filter.region) : [];

  let roomsQuery = supabase.from("rooms").select("*");
  if (branch) {
    roomsQuery = roomsQuery.eq("branch", branch);
  } else if (regionBranches.length > 0) {
    roomsQuery = roomsQuery.in("branch", regionBranches);
  }

  const [roomsRes, tasksRes, issuesRes] = await Promise.all([
    roomsQuery,
    supabase
      .from("cleaning_tasks")
      .select("*, assignee:staff(id, name, role)")
      .order("created_at", { ascending: false }),
    supabase.from("issues").select("room_id").neq("status", "done"),
  ]);

  const firstError = roomsRes.error || tasksRes.error || issuesRes.error;
  if (firstError) throw new Error(firstError.message);

  const rooms = (roomsRes.data ?? []) as Room[];
  const roomIds = new Set(rooms.map((r) => r.id));
  const tasks = ((tasksRes.data ?? []) as CleaningTask[]).filter((t) =>
    roomIds.has(t.room_id)
  );

  const latestTaskByRoom = new Map<string, CleaningTask>();
  for (const task of tasks) {
    if (!latestTaskByRoom.has(task.room_id)) {
      latestTaskByRoom.set(task.room_id, task);
    }
  }

  const openIssueCountByRoom = new Map<string, number>();
  for (const row of (issuesRes.data ?? []) as { room_id: string }[]) {
    if (!roomIds.has(row.room_id)) continue;
    openIssueCountByRoom.set(row.room_id, (openIssueCountByRoom.get(row.room_id) ?? 0) + 1);
  }

  const items: RoomOverviewItem[] = rooms
    .map((room) => {
      const task = latestTaskByRoom.get(room.id) ?? null;
      return {
        room,
        task,
        displayStatus: getRoomDisplayStatus(room, task),
        openIssueCount: openIssueCountByRoom.get(room.id) ?? 0,
      };
    })
    .sort((a, b) => {
      const statusDifference =
        ROOM_DISPLAY_STATUS_RANK[a.displayStatus] -
        ROOM_DISPLAY_STATUS_RANK[b.displayStatus];
      if (statusDifference !== 0) return statusDifference;

      if (a.room.branch !== b.room.branch) {
        return a.room.branch.localeCompare(b.room.branch, "ko");
      }
      return a.room.room_number.localeCompare(b.room.room_number, "ko", {
        numeric: true,
      });
    });

  const summary: RoomsOverviewSummary = {
    occupied: 0,
    checkinDue: 0,
    checkoutDue: 0,
    needsCleaning: 0,
    ready: 0,
    blocked: 0,
  };
  for (const item of items) {
    if (item.room.occupancy_status === "occupied") summary.occupied += 1;
    if (item.displayStatus === "checkin_due") summary.checkinDue += 1;
    if (isToday(item.room.checkout_at)) summary.checkoutDue += 1;
    if (item.displayStatus === "dirty") {
      summary.needsCleaning += 1;
    }
    if (item.displayStatus === "ready") summary.ready += 1;
    if (item.displayStatus === "blocked") summary.blocked += 1;
  }

  return { items, summary };
}

export async function getRoomsForSelect() {
  const supabase = getSupabaseServerClient();
  const { data, error } = await supabase
    .from("rooms")
    .select("id, branch, room_number, occupancy_status, operation_status")
    .order("branch")
    .order("room_number");
  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function getStaffList() {
  const supabase = getSupabaseServerClient();
  const { data, error } = await supabase
    .from("staff")
    .select("id, name, role, branch")
    .order("name");
  if (error) throw new Error(error.message);
  return data ?? [];
}
