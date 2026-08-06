import { NextResponse } from "next/server";
import { getPropertiesList } from "@/lib/queries";
import { REGIONS } from "@/lib/regions";
import { getSupabaseServerClient } from "@/lib/supabase-server";
import type { PropertyStatus } from "@/lib/types";

export async function GET() {
  try {
    const properties = await getPropertiesList();
    return NextResponse.json({ properties });
  } catch (error) {
    return NextResponse.json(
      { error: (error as Error).message },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  const body = (await request.json()) as {
    name?: string;
    regionId?: string;
    address?: string;
    roomNumbers?: string[];
    managerId?: string | null;
    checkinTime?: string;
    checkoutTime?: string;
    status?: PropertyStatus;
  };

  const name = body.name?.trim();
  const regionId = body.regionId?.trim();
  const address = body.address?.trim();
  const roomNumbers = (body.roomNumbers ?? [])
    .map((roomNumber) => roomNumber.trim())
    .filter(Boolean);
  const status = body.status ?? "preparing";

  if (!name || !regionId || !address) {
    return NextResponse.json(
      { error: "숙소명, 지역, 주소를 입력해주세요." },
      { status: 400 }
    );
  }
  if (!REGIONS.some((region) => region.id === regionId)) {
    return NextResponse.json(
      { error: "유효한 지역을 선택해주세요." },
      { status: 400 }
    );
  }
  if (roomNumbers.length === 0) {
    return NextResponse.json(
      { error: "등록할 객실 번호를 하나 이상 입력해주세요." },
      { status: 400 }
    );
  }
  if (new Set(roomNumbers).size !== roomNumbers.length) {
    return NextResponse.json(
      { error: "중복된 객실 번호가 있습니다." },
      { status: 400 }
    );
  }
  if (status !== "preparing" && status !== "active") {
    return NextResponse.json(
      { error: "유효한 운영 상태를 선택해주세요." },
      { status: 400 }
    );
  }

  const supabase = getSupabaseServerClient();
  const { data: property, error: propertyError } = await supabase
    .from("properties")
    .insert({
      name,
      region_id: regionId,
      address,
      room_count: roomNumbers.length,
      manager_id: body.managerId || null,
      checkin_time: body.checkinTime || "15:00",
      checkout_time: body.checkoutTime || "11:00",
      status,
    })
    .select("*, manager:staff(id, name, role, branch)")
    .single();

  if (propertyError) {
    if (propertyError.code === "23505") {
      return NextResponse.json(
        { error: "이미 등록된 숙소명입니다." },
        { status: 409 }
      );
    }
    return NextResponse.json({ error: propertyError.message }, { status: 500 });
  }

  const { data: rooms, error: roomError } = await supabase
    .from("rooms")
    .insert(
      roomNumbers.map((roomNumber) => ({
        property_id: property.id,
        branch: name,
        room_number: roomNumber,
        occupancy_status: "vacant",
        operation_status: "blocked",
        operation_note: "신규 숙소 운영 준비 중",
      }))
    )
    .select("*");

  if (roomError) {
    await supabase.from("properties").delete().eq("id", property.id);
    return NextResponse.json(
      { error: `객실 등록에 실패했습니다: ${roomError.message}` },
      { status: 500 }
    );
  }

  return NextResponse.json({ property, rooms }, { status: 201 });
}
