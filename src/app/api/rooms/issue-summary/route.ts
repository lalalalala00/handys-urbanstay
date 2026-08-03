import { NextResponse } from "next/server";

type IssueInput = { category: string; description: string; urgency: string };

// Summary is display-only, never persisted — the operator reads it next to
// the original issue list and decides what to actually do (see README "AI
// 활용 및 검토 원칙").
export async function POST(req: Request) {
  const { issues } = (await req.json()) as { issues: IssueInput[] };

  if (!issues?.length) {
    return NextResponse.json({ error: "요약할 이슈가 없습니다." }, { status: 400 });
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "ANTHROPIC_API_KEY가 설정되지 않아 AI 요약을 사용할 수 없습니다." },
      { status: 503 }
    );
  }

  const issuesText = issues
    .map((i, idx) => `${idx + 1}. [${i.category}/${i.urgency}] ${i.description}`)
    .join("\n");

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
        "당신은 숙박 시설 운영자를 보조하는 요약 도우미입니다. 한 객실에 등록된 미처리 이슈 목록을 보고 운영자가 한눈에 파악할 수 있도록 요약하세요. 결과는 반드시 summarize_issues 도구를 호출해서 반환하고, 최종 조치는 운영자가 결정한다는 점을 감안하세요.",
      messages: [
        {
          role: "user",
          content: `다음은 한 객실에 등록된 미처리 이슈 목록입니다.\n${issuesText}`,
        },
      ],
      tools: [
        {
          name: "summarize_issues",
          description: "이슈 목록을 짧은 요약과 권장 조치로 정리합니다.",
          input_schema: {
            type: "object",
            properties: {
              summary: { type: "string", description: "현재 상황을 2문장 이내로 요약" },
              recommendation: {
                type: "string",
                description: "운영자에게 제안하는 다음 조치 1~2문장",
              },
            },
            required: ["summary", "recommendation"],
          },
        },
      ],
      tool_choice: { type: "tool", name: "summarize_issues" },
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    return NextResponse.json({ error: `AI 요약 요청 실패: ${text}` }, { status: 502 });
  }

  const data = await res.json();
  const toolUse = (data.content ?? []).find(
    (c: { type: string }) => c.type === "tool_use"
  );

  if (!toolUse) {
    return NextResponse.json({ error: "AI 응답을 해석할 수 없습니다." }, { status: 502 });
  }

  return NextResponse.json({ summary: toolUse.input });
}
