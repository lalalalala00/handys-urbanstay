import { NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabase-server";
import { getIssueById } from "@/lib/queries";
import { ISSUE_STATUS_NEXT, isValidIssueTransition } from "@/lib/transitions";
import type { IssueCategory, IssueStatus, IssueUrgency } from "@/lib/types";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const issue = await getIssueById(id);
    return NextResponse.json({ issue });
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
    status?: IssueStatus;
    assigneeId?: string | null;
    managerId?: string | null;
    category?: IssueCategory;
    urgency?: IssueUrgency;
  };

  const supabase = getSupabaseServerClient();
  const { data: current, error: fetchError } = await supabase
    .from("issues")
    .select("*")
    .eq("id", id)
    .single();

  if (fetchError || !current) {
    return NextResponse.json({ error: "신고를 찾을 수 없습니다." }, { status: 404 });
  }

  let nextStatus: IssueStatus = current.status;
  if (body.status && body.status !== current.status) {
    if (!isValidIssueTransition(current.status, body.status)) {
      return NextResponse.json(
        {
          error: `'${current.status}' 상태에서 '${body.status}'(으)로 바꿀 수 없습니다. 가능한 상태: ${ISSUE_STATUS_NEXT[current.status as IssueStatus].join(", ") || "없음"}`,
        },
        { status: 400 }
      );
    }
    nextStatus = body.status;
  } else if (current.status === "new" && body.assigneeId && body.status === undefined) {
    nextStatus = "assigned";
  }

  const update: Record<string, unknown> = {
    status: nextStatus,
    updated_at: new Date().toISOString(),
  };
  if (body.assigneeId !== undefined) update.assignee_id = body.assigneeId;
  if (body.managerId !== undefined) update.manager_id = body.managerId;
  if (body.category !== undefined) update.category = body.category;
  if (body.urgency !== undefined) update.urgency = body.urgency;

  const { data: updatedIssue, error: updateError } = await supabase
    .from("issues")
    .update(update)
    .eq("id", id)
    .select(
      "*, room:rooms(*), assignee:staff!assignee_id(id, name, role), manager:staff!manager_id(id, name, role)"
    )
    .single();

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 });
  }

  return NextResponse.json({ issue: updatedIssue });
}
