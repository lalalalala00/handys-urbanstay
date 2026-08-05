import { NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabase-server";
import type { OperationStatus } from "@/lib/types";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = (await req.json()) as {
    operationStatus?: OperationStatus;
    operationNote?: string | null;
  };

  if (body.operationStatus !== "ready" && body.operationStatus !== "blocked") {
    return NextResponse.json(
      { error: "유효한 객실 운영 상태가 필요합니다." },
      { status: 400 }
    );
  }

  const supabase = getSupabaseServerClient();

  if (body.operationStatus === "ready") {
    const { count, error: issueError } = await supabase
      .from("issues")
      .select("id", { count: "exact", head: true })
      .eq("room_id", id)
      .neq("status", "done");

    if (issueError) {
      return NextResponse.json({ error: issueError.message }, { status: 500 });
    }
    if ((count ?? 0) > 0) {
      return NextResponse.json(
        { error: "미완료 운영 이슈를 모두 처리한 뒤 판매를 재개해 주세요." },
        { status: 409 }
      );
    }
  }

  const operationNote =
    body.operationStatus === "blocked"
      ? body.operationNote?.trim() || "운영 이슈 확인 필요"
      : null;

  const { data: room, error } = await supabase
    .from("rooms")
    .update({
      operation_status: body.operationStatus,
      operation_note: operationNote,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .select("*")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ room });
}
