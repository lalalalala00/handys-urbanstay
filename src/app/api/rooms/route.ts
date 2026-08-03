import { NextResponse } from "next/server";
import { getRoomsForSelect } from "@/lib/queries";

export async function GET() {
  try {
    const rooms = await getRoomsForSelect();
    return NextResponse.json({ rooms });
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}
