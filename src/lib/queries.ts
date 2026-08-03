import { getSupabaseServerClient } from "./supabase-server";
import { calcRoomPriority, roomSortKey } from "./priority";
import { branchesInRegion } from "./regions";
import { isToday } from "./format";
import { ACTIVITY_ACTOR_ROLE_LABEL, REPORTER_TYPE_LABEL } from "./labels";
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
  const isFiltered = Boolean(branch) || regionBranches.length > 0;

  const [roomsRes, tasksRes, issuesRes, allIssuesRes, staffRes] = await Promise.all([
    roomsQuery,
    supabase
      .from("cleaning_tasks")
      .select("*, room:rooms(id, branch, room_number), assignee:staff(id, name, role)"),
    supabase
      .from("issues")
      .select(
        "*, room:rooms(id, branch, room_number), assignee:staff(id, name, role)"
      )
      .neq("status", "done")
      .order("urgency", { ascending: true })
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
  const issues = ((issuesRes.data ?? []) as Issue[]).filter((i) => roomIds.has(i.room_id));
  const allIssues = ((allIssuesRes.data ?? []) as Issue[]).filter((i) => roomIds.has(i.room_id));
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

  const priorityRooms = [...roomsWithPriority]
    .sort((a, b) => {
      const ka = roomSortKey(a.room, a.task ?? undefined, a.priority);
      const kb = roomSortKey(b.room, b.task ?? undefined, b.priority);
      for (let i = 0; i < ka.length; i++) {
        if (ka[i] !== kb[i]) return ka[i] - kb[i];
      }
      return 0;
    })
    .slice(0, 8);

  const summary = {
    todaysCheckins: rooms.filter((r) => isToday(r.next_checkin_at)).length,
    todaysCheckouts: rooms.filter((r) => isToday(r.checkout_at)).length,
    needsCleaning: tasks.filter((t) => t.status !== "done").length,
    unassigned: tasks.filter((t) => t.status === "unassigned").length,
    openIssues: issues.length,
    delayRisk: roomsWithPriority.filter(
      (r) => r.priority.riskLevel === "urgent" || r.priority.riskLevel === "warning"
    ).length,
  };

  const scopedCleaners = isFiltered
    ? cleaners.filter((member) => tasks.some((t) => t.assignee_id === member.id))
    : cleaners;

  const crew = scopedCleaners.map((member) => {
    const myTasks = tasks.filter(
      (t) => t.assignee_id === member.id && t.status !== "done"
    );
    const cleaningTask = myTasks.find((t) => t.status === "cleaning");
    const inspectionTask = myTasks.find((t) => t.status === "inspection");
    const assignedTask = myTasks.find((t) => t.status === "assigned");
    const activeTask = cleaningTask ?? inspectionTask ?? assignedTask ?? null;

    let working = false;
    let progress: number | null = null;
    if (cleaningTask) {
      working = true;
      progress = cleaningTask.started_at
        ? Math.min(
            100,
            Math.round(
              ((Date.now() - new Date(cleaningTask.started_at).getTime()) /
                60000 /
                cleaningTask.estimated_minutes) *
                100
            )
          )
        : 0;
    } else if (inspectionTask) {
      working = true;
      progress = 100;
    } else if (assignedTask) {
      progress = 0;
    }

    return {
      staff: member,
      working,
      progress,
      activeCount: myTasks.length,
      branch: activeTask?.room?.branch ?? null,
    };
  });

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

  const STATUS_BUCKET: Record<Room["status"], "normal" | "urgent" | "inspection" | "assigned"> = {
    ready: "normal",
    occupied: "normal",
    issue: "urgent",
    dirty: "urgent",
    inspection: "inspection",
    assigned: "assigned",
    cleaning: "assigned",
  };
  const roomStatusDistribution = {
    normal: 0,
    urgent: 0,
    inspection: 0,
    assigned: 0,
  };
  for (const room of rooms) {
    roomStatusDistribution[STATUS_BUCKET[room.status]] += 1;
  }

  const checkinHourCounts = new Map<number, number>();
  for (const room of rooms) {
    if (!room.next_checkin_at) continue;
    const hour = new Date(room.next_checkin_at).getHours();
    checkinHourCounts.set(hour, (checkinHourCounts.get(hour) ?? 0) + 1);
  }
  let checkinPeakHour: number | null = null;
  let peakCount = 0;
  for (const [hour, count] of checkinHourCounts) {
    if (count > peakCount) {
      peakCount = count;
      checkinPeakHour = hour;
    }
  }

  return {
    summary,
    priorityRooms,
    openIssues: issues,
    crew,
    activity,
    activityHistory,
    roomStatusDistribution,
    totalRooms: rooms.length,
    checkinPeakHour: peakCount > 1 ? checkinPeakHour : null,
  };
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

  return issues.sort((a, b) => URGENCY_RANK[a.urgency] - URGENCY_RANK[b.urgency]);
}

export async function getIssueById(id: string) {
  const supabase = getSupabaseServerClient();
  const { data, error } = await supabase
    .from("issues")
    .select("*, room:rooms(*), assignee:staff(id, name, role)")
    .eq("id", id)
    .single();
  if (error) throw new Error(error.message);
  return data as Issue;
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

export async function getRoomsForSelect() {
  const supabase = getSupabaseServerClient();
  const { data, error } = await supabase
    .from("rooms")
    .select("id, branch, room_number, status")
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
