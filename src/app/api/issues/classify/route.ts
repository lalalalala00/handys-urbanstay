import { NextResponse } from "next/server";
import type { IssueCategory, IssueUrgency } from "@/lib/types";

const CATEGORIES: IssueCategory[] = [
  "cleaning",
  "facility",
  "access",
  "amenity",
  "environment",
  "other",
];
const URGENCIES: IssueUrgency[] = ["low", "normal", "urgent"];

// This suggestion is never persisted by itself — the caller shows it next
// to the original text and the operator decides the final category/urgency.
export async function POST(req: Request) {
  const { description, roomStatus } = (await req.json()) as {
    description: string;
    roomStatus?: string;
  };

  if (!description?.trim()) {
    return NextResponse.json({ error: "신고 내용이 비어 있습니다." }, { status: 400 });
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "ANTHROPIC_API_KEY가 설정되지 않아 AI 추천을 사용할 수 없습니다." },
      { status: 503 }
    );
  }

  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 300,
      system:
        "당신은 숙박 시설 운영자를 보조하는 분류 도우미입니다. 투숙객이나 직원이 입력한 객실 이상 신고 내용을 보고 신고 유형과 긴급도를 추천하세요. 결과는 반드시 classify_issue 도구를 호출해서 반환하고, 최종 판단은 운영자가 내린다는 점을 감안해 근거를 함께 제시하세요.",
      messages: [
        {
          role: "user",
          content: `객실 현재 상태: ${roomStatus ?? "알 수 없음"}\n신고 내용: ${description}`,
        },
      ],
      tools: [
        {
          name: "classify_issue",
          description: "신고 내용을 카테고리와 긴급도로 분류합니다.",
          input_schema: {
            type: "object",
            properties: {
              category: { type: "string", enum: CATEGORIES },
              urgency: { type: "string", enum: URGENCIES },
              reason: { type: "string", description: "이렇게 분류한 짧은 근거 (운영자 검토용)" },
            },
            required: ["category", "urgency", "reason"],
          },
        },
      ],
      tool_choice: { type: "tool", name: "classify_issue" },
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    return NextResponse.json({ error: `AI 분류 요청 실패: ${text}` }, { status: 502 });
  }

  const data = await res.json();
  const toolUse = (data.content ?? []).find(
    (c: { type: string }) => c.type === "tool_use"
  );

  if (!toolUse) {
    return NextResponse.json({ error: "AI 응답을 해석할 수 없습니다." }, { status: 502 });
  }

  return NextResponse.json({ suggestion: toolUse.input });
}
