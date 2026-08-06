"use client";

import { useState } from "react";
import { MessageIcon } from "@/components/common/icons";
import { formatDateTime } from "@/lib/format";
import type { Issue } from "@/lib/types";

type ChatMessage = {
  id: string;
  sender: "guest" | "operator";
  senderLabel: string;
  text: string;
  time: string;
};

const QUICK_REPLIES = [
  "확인 후 연락드리겠습니다.",
  "조금만 기다려주세요.",
  "문제를 확인 중입니다.",
  "해당 내용을 담당 크루에게 전달했습니다.",
];

export function IssueChat({ issue }: { issue: Issue }) {
  const [messages, setMessages] = useState<ChatMessage[]>(() => [
    {
      id: "seed",
      sender: "guest",
      senderLabel: "게스트",
      text: issue.description,
      time: formatDateTime(issue.created_at),
    },
  ]);
  const [draft, setDraft] = useState("");

  function send(text: string) {
    const trimmed = text.trim();
    if (!trimmed) return;
    setMessages((prev) => [
      ...prev,
      {
        id: `local-${prev.length}`,
        sender: "operator",
        senderLabel: "운영자",
        text: trimmed,
        time: formatDateTime(new Date().toISOString()),
      },
    ]);
    setDraft("");
  }

  return (
    <div className="grid grid-cols-1 bg-white/50 gap-4 rounded-lg border border-black/10 p-4 lg:grid-cols-[3fr_2fr] dark:border-white/10">
      <div>
        <div className="mb-3 flex items-center gap-1.5 text-sm font-medium">
          <MessageIcon className="h-4 w-4 text-primary" />
          대화 내역
        </div>
        <div className="flex max-h-72 flex-col gap-3 overflow-y-auto pr-1">
          {messages.map((m) => (
            <div
              key={m.id}
              className={`flex flex-col gap-1 ${
                m.sender === "operator" ? "items-end" : "items-start"
              }`}
            >
              <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                <span className="font-medium text-foreground">
                  {m.senderLabel}
                </span>
                <span>{m.time}</span>
              </div>
              <div
                className={`max-w-[85%] rounded-lg px-3 py-2 text-sm ${
                  m.sender === "operator"
                    ? "bg-primary/10 text-foreground"
                    : "bg-black/5 dark:bg-white/10"
                }`}
              >
                {m.text}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-3 border-t border-black/10 pt-4 lg:border-t-0 lg:border-l lg:pt-0 lg:pl-4 dark:border-white/10">
        <div className="text-sm font-medium">새 메시지 보내기</div>
        <p className="text-xs text-gray-500 dark:text-gray-400">
          게스트에게 메시지를 보내면 앱 푸시 알림이 전송됩니다.
        </p>
        <textarea
          value={draft}
          onChange={(e) => setDraft(e.target.value.slice(0, 500))}
          rows={4}
          placeholder="메시지를 입력하세요..."
          className="w-full resize-none rounded-lg border border-black/10 bg-transparent p-3 text-sm outline-none focus:border-primary dark:border-white/10"
        />
        <div className="-mt-2 text-right text-[11px] text-gray-400 dark:text-gray-500">
          {draft.length}/500
        </div>

        <div>
          <div className="mb-2 text-xs font-medium text-gray-500 dark:text-gray-400">
            빠른 응답
          </div>
          <div className="flex flex-wrap gap-2">
            {QUICK_REPLIES.map((reply) => (
              <button
                key={reply}
                type="button"
                onClick={() => setDraft(reply)}
                className="rounded-full border border-black/10 px-3 py-1.5 text-xs hover:bg-black/3 dark:border-white/10 dark:hover:bg-white/5"
              >
                {reply}
              </button>
            ))}
          </div>
        </div>

        <button
          type="button"
          onClick={() => send(draft)}
          disabled={!draft.trim()}
          className="mt-1 rounded bg-foreground px-3 py-2 text-sm font-medium text-background disabled:opacity-40"
        >
          메시지 보내기
        </button>
      </div>
    </div>
  );
}
