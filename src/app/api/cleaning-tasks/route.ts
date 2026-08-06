import { NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabase-server";

export async function POST(req: Request) {
  const body = (await req.json()) as {
    roomId?: string;
    assigneeId?: string | null;
    estimatedMinutes?: number;
  };

  if (!body.roomId) {
    return NextResponse.json(
      { error: "객실을 선택해주세요." },
      { status: 400 }
    );
  }

  const supabase = getSupabaseServerClient();

  const { data: latestTask, error: latestError } = await supabase
    .from("cleaning_tasks")
    .select("id, status")
    .eq("room_id", body.roomId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (latestError) {
    return NextResponse.json({ error: latestError.message }, { status: 500 });
  }

  if (latestTask && latestTask.status !== "done") {
    return NextResponse.json(
      { error: "이미 진행 중인 청소 작업이 있습니다." },
      { status: 409 }
    );
  }

  const { data: task, error } = await supabase
    .from("cleaning_tasks")
    .insert({
      room_id: body.roomId,
      assignee_id: body.assigneeId ?? null,
      status: body.assigneeId ? "assigned" : "unassigned",
      estimated_minutes: body.estimatedMinutes ?? 45,
    })
    .select("*, room:rooms(*), assignee:staff(id, name, role)")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ task }, { status: 201 });
}
