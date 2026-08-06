import { NextResponse } from "next/server";
import { getRoomsForSelect } from "@/lib/queries";
import { getSupabaseServerClient } from "@/lib/supabase-server";

export async function GET() {
  try {
    const rooms = await getRoomsForSelect();
    return NextResponse.json({ rooms });
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const body = (await req.json()) as {
    branch?: string;
    roomNumber?: string;
    doorLockCode?: string;
  };

  const branch = body.branch?.trim();
  const roomNumber = body.roomNumber?.trim();

  if (!branch || !roomNumber) {
    return NextResponse.json(
      { error: "지점과 호수를 입력해주세요." },
      { status: 400 }
    );
  }

  const supabase = getSupabaseServerClient();

  const { data: room, error } = await supabase
    .from("rooms")
    .insert({
      branch,
      room_number: roomNumber,
      door_lock_code: body.doorLockCode?.trim() || null,
    })
    .select("*")
    .single();

  if (error) {
    if (error.code === "23505") {
      return NextResponse.json(
        { error: "이미 등록된 객실입니다." },
        { status: 409 }
      );
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ room }, { status: 201 });
}
