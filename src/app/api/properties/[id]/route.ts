import { NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabase-server";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = (await req.json()) as { managerId?: string | null };

  if (body.managerId === undefined) {
    return NextResponse.json({ error: "managerId가 필요합니다." }, { status: 400 });
  }

  const supabase = getSupabaseServerClient();
  const { data: property, error } = await supabase
    .from("properties")
    .update({ manager_id: body.managerId, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select("*, manager:staff(id, name, role, branch)")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ property });
}
