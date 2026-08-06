import { NextResponse } from "next/server";

export async function POST() {
  return NextResponse.json(
    {
      error:
        "청소 작업은 체크아웃 처리 시 자동으로 생성됩니다. 청소 문제는 운영 이슈로 접수해주세요.",
    },
    { status: 405 }
  );
}
