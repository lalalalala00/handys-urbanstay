import { NextResponse } from "next/server";
import { getCleaningTasksList } from "@/lib/queries";

export async function GET() {
  try {
    const tasks = await getCleaningTasksList();
    return NextResponse.json({ tasks });
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}
