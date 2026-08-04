import { NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabase-server";
import { getIssuesList } from "@/lib/queries";
import type { IssueCategory, IssueUrgency } from "@/lib/types";

export async function GET() {
  try {
    const issues = await getIssuesList();
    return NextResponse.json({ issues });
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const body = (await req.json()) as {
    roomId: string;
    category: IssueCategory;
    description: string;
    reporterType: "guest" | "cleaner" | "manager" | "facility";
    urgency?: IssueUrgency;
    aiSuggestedCategory?: IssueCategory | null;
    aiSuggestedUrgency?: IssueUrgency | null;
  };

  if (!body.roomId || !body.category || !body.description || !body.reporterType) {
    return NextResponse.json({ error: "필수 항목이 누락되었습니다." }, { status: 400 });
  }

  const supabase = getSupabaseServerClient();

  const { data: issue, error } = await supabase
    .from("issues")
    .insert({
      room_id: body.roomId,
      category: body.category,
      description: body.description,
      reporter_type: body.reporterType,
      urgency: body.urgency ?? "normal",
      status: "new",
      ai_suggested_category: body.aiSuggestedCategory ?? null,
      ai_suggested_urgency: body.aiSuggestedUrgency ?? null,
    })
    .select("*, room:rooms(id, branch, room_number), assignee:staff(id, name, role)")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ issue }, { status: 201 });
}
