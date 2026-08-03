import { NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabase-server";
import { getCleaningTaskById } from "@/lib/queries";
import { CLEANING_TASK_NEXT, ROOM_STATUS_FOR_CLEANING_STATUS, isValidCleaningTransition } from "@/lib/transitions";
import type { CleaningTaskStatus } from "@/lib/types";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const task = await getCleaningTaskById(id);
    return NextResponse.json({ task });
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 404 });
  }
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = (await req.json()) as {
    status?: CleaningTaskStatus;
    assigneeId?: string | null;
  };

  const supabase = getSupabaseServerClient();

  const { data: current, error: fetchError } = await supabase
    .from("cleaning_tasks")
    .select("*")
    .eq("id", id)
    .single();

  if (fetchError || !current) {
    return NextResponse.json({ error: "청소 작업을 찾을 수 없습니다." }, { status: 404 });
  }

  let nextStatus: CleaningTaskStatus = current.status;
  const willHaveAssignee =
    body.assigneeId !== undefined ? body.assigneeId : current.assignee_id;

  if (body.status && body.status !== current.status) {
    if (!isValidCleaningTransition(current.status, body.status)) {
      return NextResponse.json(
        {
          error: `'${current.status}' 상태에서 '${body.status}'(으)로 바꿀 수 없습니다. 가능한 상태: ${CLEANING_TASK_NEXT[current.status as CleaningTaskStatus].join(", ") || "없음"}`,
        },
        { status: 400 }
      );
    }
    nextStatus = body.status;
  } else if (
    current.status === "unassigned" &&
    body.assigneeId &&
    body.status === undefined
  ) {
    // Assigning someone to an unassigned task implicitly moves it forward.
    nextStatus = "assigned";
  }

  if (nextStatus === "assigned" && !willHaveAssignee) {
    return NextResponse.json(
      { error: "담당자를 먼저 배정해야 합니다." },
      { status: 400 }
    );
  }

  const update: Record<string, unknown> = {
    status: nextStatus,
    updated_at: new Date().toISOString(),
  };
  if (body.assigneeId !== undefined) update.assignee_id = body.assigneeId;
  if (nextStatus === "cleaning" && !current.started_at) {
    update.started_at = new Date().toISOString();
  }
  if (nextStatus === "done") {
    update.completed_at = new Date().toISOString();
  }

  const { data: updatedTask, error: updateError } = await supabase
    .from("cleaning_tasks")
    .update(update)
    .eq("id", id)
    .select("*, room:rooms(*), assignee:staff(id, name, role)")
    .single();

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 });
  }

  // Cleaning status drives room status, unless the room currently has an
  // unrelated open issue overriding it.
  const { data: room } = await supabase
    .from("rooms")
    .select("status")
    .eq("id", current.room_id)
    .single();

  if (room && room.status !== "issue") {
    await supabase
      .from("rooms")
      .update({
        status: ROOM_STATUS_FOR_CLEANING_STATUS[nextStatus],
        updated_at: new Date().toISOString(),
      })
      .eq("id", current.room_id);
  }

  return NextResponse.json({ task: updatedTask });
}
