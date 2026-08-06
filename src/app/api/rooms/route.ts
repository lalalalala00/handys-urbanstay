import { NextResponse } from "next/server";
import { getRoomsForSelect } from "@/lib/queries";
import { getSupabaseServerClient } from "@/lib/supabase-server";
import type { OperationStatus } from "@/lib/types";

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
    operationStatus?: OperationStatus;
  };

  const branch = body.branch?.trim();
  const roomNumber = body.roomNumber?.trim();
  const operationStatus = body.operationStatus ?? "blocked";

  if (!branch || !roomNumber) {
    return NextResponse.json(
      { error: "지점과 호수를 입력해주세요." },
      { status: 400 }
    );
  }

  if (operationStatus !== "ready" && operationStatus !== "blocked") {
    return NextResponse.json(
      { error: "유효한 판매 채널 상태를 선택해주세요." },
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
      operation_status: operationStatus,
      operation_note:
        operationStatus === "blocked" ? "신규 객실 운영 준비 중" : null,
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
