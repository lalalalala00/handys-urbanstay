import { NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabase-server";

// Recommendation rule: among cleaners, suggest whoever currently has the
// fewest active (not-done) cleaning tasks. Kept to a single, explainable
// criterion on purpose — see README for why more signals were left out.
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = getSupabaseServerClient();

  const { data: task, error: taskError } = await supabase
    .from("cleaning_tasks")
    .select("id, status")
    .eq("id", id)
    .single();

  if (taskError || !task) {
    return NextResponse.json({ error: "청소 작업을 찾을 수 없습니다." }, { status: 404 });
  }

  const [staffRes, activeTasksRes] = await Promise.all([
    supabase.from("staff").select("id, name, role").eq("role", "cleaner"),
    supabase.from("cleaning_tasks").select("assignee_id").neq("status", "done"),
  ]);

  if (staffRes.error || activeTasksRes.error) {
    return NextResponse.json(
      { error: staffRes.error?.message ?? activeTasksRes.error?.message },
      { status: 500 }
    );
  }

  const loadByStaffId = new Map<string, number>();
  for (const t of activeTasksRes.data ?? []) {
    if (!t.assignee_id) continue;
    loadByStaffId.set(t.assignee_id, (loadByStaffId.get(t.assignee_id) ?? 0) + 1);
  }

  const cleaners = staffRes.data ?? [];
  if (cleaners.length === 0) {
    return NextResponse.json({
      recommendation: null,
      reason: "배정 가능한 청소 담당자가 없습니다.",
    });
  }

  const ranked = cleaners
    .map((c) => ({ ...c, activeTaskCount: loadByStaffId.get(c.id) ?? 0 }))
    .sort((a, b) => a.activeTaskCount - b.activeTaskCount || a.name.localeCompare(b.name));

  return NextResponse.json({ recommendation: ranked[0], candidates: ranked });
}
