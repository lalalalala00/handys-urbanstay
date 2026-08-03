import { getSupabaseServerClient } from "./supabase-server";
import { calcRoomPriority, roomSortKey } from "./priority";
import type { CleaningTask, Issue, Room } from "./types";

function isToday(iso: string | null) {
  if (!iso) return false;
  const d = new Date(iso);
  const now = new Date();
  return (
    d.getUTCFullYear() === now.getUTCFullYear() &&
    d.getUTCMonth() === now.getUTCMonth() &&
    d.getUTCDate() === now.getUTCDate()
  );
}

export async function getDashboardData() {
  const supabase = getSupabaseServerClient();

  const [roomsRes, tasksRes, issuesRes] = await Promise.all([
    supabase.from("rooms").select("*"),
    supabase.from("cleaning_tasks").select("*, assignee:staff(id, name, role)"),
    supabase
      .from("issues")
      .select(
        "*, room:rooms(id, branch, room_number), assignee:staff(id, name, role)"
      )
      .neq("status", "done")
      .order("urgency", { ascending: true })
      .order("created_at", { ascending: true }),
  ]);

  const firstError = roomsRes.error || tasksRes.error || issuesRes.error;
  if (firstError) throw new Error(firstError.message);

  const rooms = (roomsRes.data ?? []) as Room[];
  const tasks = (tasksRes.data ?? []) as CleaningTask[];
  const issues = (issuesRes.data ?? []) as Issue[];

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

  return { summary, priorityRooms, openIssues: issues };
}

export async function getCleaningTasksList() {
  const supabase = getSupabaseServerClient();
  const { data, error } = await supabase
    .from("cleaning_tasks")
    .select("*, room:rooms(*), assignee:staff(id, name, role)")
    .order("created_at", { ascending: false });

  if (error) throw new Error(error.message);

  const tasks = (data ?? []) as CleaningTask[];
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

export async function getIssuesList() {
  const supabase = getSupabaseServerClient();
  const { data, error } = await supabase
    .from("issues")
    .select(
      "*, room:rooms(id, branch, room_number, next_checkin_at), assignee:staff(id, name, role)"
    )
    .order("created_at", { ascending: false });

  if (error) throw new Error(error.message);
  const issues = (data ?? []) as Issue[];
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
    .select("id, name, role")
    .order("name");
  if (error) throw new Error(error.message);
  return data ?? [];
}
