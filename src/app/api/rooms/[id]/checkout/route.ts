import { NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabase-server";

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = getSupabaseServerClient();

  const { data: room, error: roomError } = await supabase
    .from("rooms")
    .select("id, occupancy_status")
    .eq("id", id)
    .maybeSingle();

  if (roomError) {
    return NextResponse.json({ error: roomError.message }, { status: 500 });
  }
  if (!room) {
    return NextResponse.json({ error: "객실을 찾을 수 없습니다." }, { status: 404 });
  }
  if (room.occupancy_status !== "occupied") {
    return NextResponse.json(
      { error: "체크인 중인 객실만 체크아웃 처리할 수 있습니다." },
      { status: 409 }
    );
  }

  const { data: updatedRoom, error: updateError } = await supabase
    .from("rooms")
    .update({
      occupancy_status: "vacant",
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .select("*")
    .single();

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 });
  }

  const { data: latestTask, error: latestError } = await supabase
    .from("cleaning_tasks")
    .select("id, status")
    .eq("room_id", id)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (latestError) {
    return NextResponse.json({ error: latestError.message }, { status: 500 });
  }

  if (latestTask && latestTask.status !== "done") {
    return NextResponse.json({ room: updatedRoom, task: null });
  }

  const { data: task, error: taskError } = await supabase
    .from("cleaning_tasks")
    .insert({
      room_id: id,
      status: "unassigned",
      estimated_minutes: 45,
    })
    .select("*, room:rooms(*), assignee:staff(id, name, role)")
    .single();

  if (taskError) {
    return NextResponse.json({ error: taskError.message }, { status: 500 });
  }

  return NextResponse.json({ room: updatedRoom, task });
}
