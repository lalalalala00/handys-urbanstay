"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ISSUE_CATEGORY_LABEL, ISSUE_URGENCY_LABEL } from "@/lib/labels";
import type { IssueCategory, IssueUrgency, OccupancyStatus, OperationStatus } from "@/lib/types";

const CATEGORIES = Object.keys(ISSUE_CATEGORY_LABEL) as IssueCategory[];
const URGENCIES = Object.keys(ISSUE_URGENCY_LABEL) as IssueUrgency[];
const REPORTER_TYPES = [
  { value: "guest", label: "투숙객" },
  { value: "cleaner", label: "청소 담당자" },
  { value: "manager", label: "운영 관리자" },
  { value: "facility", label: "시설 담당자" },
] as const;

interface RoomOption {
  id: string;
  branch: string;
  room_number: string;
  occupancy_status: OccupancyStatus;
  operation_status: OperationStatus;
}

function roomOptionLabel(room: RoomOption): string {
  if (room.operation_status === "blocked") return "판매중지";
  if (room.occupancy_status === "occupied") return "투숙중";
  return "빈 객실";
}

interface Suggestion {
  category: IssueCategory;
  urgency: IssueUrgency;
  reason: string;
}

export function NewIssueForm({ rooms }: { rooms: RoomOption[] }) {
  const router = useRouter();
  const [roomId, setRoomId] = useState("");
  const [reporterType, setReporterType] =
    useState<(typeof REPORTER_TYPES)[number]["value"]>("guest");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState<IssueCategory>("other");
  const [urgency, setUrgency] = useState<IssueUrgency>("normal");
  const [suggestion, setSuggestion] = useState<Suggestion | null>(null);
  const [classifying, setClassifying] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const selectedRoom = rooms.find((r) => r.id === roomId);

  async function classify() {
    if (!description.trim()) return;
    setClassifying(true);
    setError(null);
    const res = await fetch("/api/issues/classify", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        description,
        roomStatus: selectedRoom ? roomOptionLabel(selectedRoom) : undefined,
      }),
    });
    const json = await res.json();
    setClassifying(false);
    if (!res.ok) {
      setError(json.error ?? "AI 분류 요청에 실패했습니다.");
      return;
    }
    setSuggestion(json.suggestion);
  }

  function applySuggestion() {
    if (!suggestion) return;
    setCategory(suggestion.category);
    setUrgency(suggestion.urgency);
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!roomId || !description.trim()) {
      setError("객실과 신고 내용을 입력해주세요.");
      return;
    }
    setSubmitting(true);
    setError(null);
    const res = await fetch("/api/issues", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        roomId,
        category,
        description,
        reporterType,
        urgency,
        aiSuggestedCategory: suggestion?.category ?? null,
        aiSuggestedUrgency: suggestion?.urgency ?? null,
      }),
    });
    const json = await res.json();
    setSubmitting(false);
    if (!res.ok) {
      setError(json.error ?? "등록에 실패했습니다.");
      return;
    }
    router.push(`/issues/${json.issue.id}`);
  }

  return (
    <form onSubmit={submit} className="flex max-w-xl flex-col gap-5">
      <label className="flex flex-col gap-1 text-sm">
        객실
        <select
          className="rounded border border-black/10 bg-transparent px-3 py-2 dark:border-white/10"
          value={roomId}
          onChange={(e) => setRoomId(e.target.value)}
        >
          <option value="">객실 선택</option>
          {rooms.map((r) => (
            <option key={r.id} value={r.id}>
              {r.branch} {r.room_number}호 ({roomOptionLabel(r)})
            </option>
          ))}
        </select>
      </label>

      <label className="flex flex-col gap-1 text-sm">
        신고자
        <select
          className="rounded border border-black/10 bg-transparent px-3 py-2 dark:border-white/10"
          value={reporterType}
          onChange={(e) => setReporterType(e.target.value as typeof reporterType)}
        >
          {REPORTER_TYPES.map((r) => (
            <option key={r.value} value={r.value}>
              {r.label}
            </option>
          ))}
        </select>
      </label>

      <label className="flex flex-col gap-1 text-sm">
        신고 내용
        <textarea
          className="min-h-24 rounded border border-black/10 bg-transparent px-3 py-2 dark:border-white/10"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="예: 난방기는 켜지는데 따뜻한 바람이 나오지 않아요."
        />
      </label>

      <button
        type="button"
        disabled={!description.trim() || classifying}
        onClick={classify}
        className="self-start rounded border border-black/10 px-3 py-1.5 text-sm disabled:opacity-40 dark:border-white/10"
      >
        {classifying ? "분류 중..." : "AI 분류 추천 받기"}
      </button>

      {suggestion && (
        <div className="rounded border border-black/10 p-3 text-xs dark:border-white/10">
          <div>
            AI 추천: 유형 <b>{ISSUE_CATEGORY_LABEL[suggestion.category]}</b> / 긴급도{" "}
            <b>{ISSUE_URGENCY_LABEL[suggestion.urgency]}</b>
          </div>
          <div className="mt-1 text-gray-500 dark:text-gray-400">{suggestion.reason}</div>
          <button
            type="button"
            onClick={applySuggestion}
            className="mt-2 underline"
          >
            추천값 아래 항목에 적용
          </button>
        </div>
      )}

      <div className="flex gap-3">
        <label className="flex flex-1 flex-col gap-1 text-sm">
          유형 (최종)
          <select
            className="rounded border border-black/10 bg-transparent px-3 py-2 dark:border-white/10"
            value={category}
            onChange={(e) => setCategory(e.target.value as IssueCategory)}
          >
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {ISSUE_CATEGORY_LABEL[c]}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-1 flex-col gap-1 text-sm">
          긴급도 (최종)
          <select
            className="rounded border border-black/10 bg-transparent px-3 py-2 dark:border-white/10"
            value={urgency}
            onChange={(e) => setUrgency(e.target.value as IssueUrgency)}
          >
            {URGENCIES.map((u) => (
              <option key={u} value={u}>
                {ISSUE_URGENCY_LABEL[u]}
              </option>
            ))}
          </select>
        </label>
      </div>

      {error && <p className="text-xs text-red-600 dark:text-red-400">{error}</p>}

      <button
        type="submit"
        disabled={submitting}
        className="self-start rounded bg-foreground px-4 py-2 text-sm text-background disabled:opacity-40"
      >
        {submitting ? "등록 중..." : "이슈 등록"}
      </button>
    </form>
  );
}
