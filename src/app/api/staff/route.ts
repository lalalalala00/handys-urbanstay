import { NextResponse } from "next/server";
import { getStaffList } from "@/lib/queries";

export async function GET() {
  try {
    const staff = await getStaffList();
    return NextResponse.json({ staff });
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}
