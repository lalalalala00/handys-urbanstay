"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ISSUE_CATEGORY_LABEL, ISSUE_URGENCY_LABEL } from "@/lib/labels";
import {
  BranchRoomPicker,
  roomOptionLabel,
  type RoomOption,
} from "@/components/common/BranchRoomPicker";
import type { IssueCategory, IssueUrgency } from "@/lib/types";

const CATEGORIES = Object.keys(ISSUE_CATEGORY_LABEL) as IssueCategory[];
const URGENCIES = Object.keys(ISSUE_URGENCY_LABEL) as IssueUrgency[];
const REPORTER_TYPES = [
  { value: "guest", label: "투숙객" },
  { value: "cleaner", label: "청소 담당자" },
  { value: "manager", label: "운영 관리자" },
  { value: "facility", label: "시설 담당자" },
] as const;
type ReporterType = (typeof REPORTER_TYPES)[number]["value"];

interface Suggestion {
  category: IssueCategory;
  urgency: IssueUrgency;
  reason: string;
}

export function NewIssueForm({
  rooms,
  initialBranch,
  initialCategory,
  initialReporter,
}: {
  rooms: RoomOption[];
  initialBranch?: string;
  initialCategory?: string;
  initialReporter?: string;
}) {
  const router = useRouter();
  const defaultCategory =
    CATEGORIES.find((item) => item === initialCategory) ?? "other";
  const defaultReporter =
    REPORTER_TYPES.find((item) => item.value === initialReporter)?.value ??
    "guest";
  const [roomId, setRoomId] = useState("");
  const [reporterType, setReporterType] =
    useState<ReporterType>(defaultReporter);
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState<IssueCategory>(defaultCategory);
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
    <form onSubmit={submit} className="flex max-w-2xl flex-col gap-5">
      <section className="rounded-xl border border-card-border bg-card p-5">
        <div className="mb-4">
          <h2 className="text-sm font-semibold">접수 대상</h2>
          <p className="mt-1 text-xs text-subtext">
            문제가 발생한 숙소와 객실, 신고자를 선택합니다.
          </p>
        </div>

        <BranchRoomPicker
          rooms={rooms}
          value={roomId}
          onChange={setRoomId}
          initialBranch={initialBranch}
        />

        <div className="mt-4 sm:max-w-[calc(50%-0.5rem)]">
          <FormField label="신고자">
            <select
              className={INPUT_CLASS}
              value={reporterType}
              onChange={(event) =>
                setReporterType(event.target.value as ReporterType)
              }
            >
              {REPORTER_TYPES.map((reporter) => (
                <option key={reporter.value} value={reporter.value}>
                  {reporter.label}
                </option>
              ))}
            </select>
          </FormField>
        </div>
      </section>

      <section className="rounded-xl border border-card-border bg-card p-5">
        <div className="mb-4 flex items-start justify-between gap-3">
          <div>
            <h2 className="text-sm font-semibold">신고 내용</h2>
            <p className="mt-1 text-xs text-subtext">
              현장에서 확인한 상황을 구체적으로 입력합니다.
            </p>
          </div>
          <button
            type="button"
            disabled={!description.trim() || classifying}
            onClick={classify}
            className="h-8 shrink-0 rounded-lg border border-card-border px-3 text-xs font-medium transition hover:bg-black/[0.03] disabled:cursor-not-allowed disabled:opacity-40 dark:hover:bg-white/5"
          >
            {classifying ? "분류 중..." : "AI 분류 추천"}
          </button>
        </div>

        <textarea
          className="min-h-28 w-full resize-y rounded-lg border border-card-border bg-background px-3 py-2 text-sm leading-6 outline-none placeholder:text-subtext/70 focus:border-primary/50 focus:ring-2 focus:ring-primary/10"
          value={description}
          onChange={(event) => setDescription(event.target.value)}
          placeholder="예: 난방기는 켜지는데 따뜻한 바람이 나오지 않아요."
        />

        {suggestion && (
          <div className="mt-3 rounded-lg border border-primary/15 bg-primary/[0.04] p-3 text-xs">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-semibold text-primary">AI 추천</span>
              <span>{ISSUE_CATEGORY_LABEL[suggestion.category]}</span>
              <span className="text-subtext">·</span>
              <span>{ISSUE_URGENCY_LABEL[suggestion.urgency]}</span>
            </div>
            <p className="mt-1.5 leading-5 text-subtext">{suggestion.reason}</p>
            <button
              type="button"
              onClick={applySuggestion}
              className="mt-2 text-xs font-medium text-primary underline-offset-4 hover:underline"
            >
              추천값 적용
            </button>
          </div>
        )}
      </section>

      <section className="rounded-xl border border-card-border bg-card p-5">
        <div className="mb-4">
          <h2 className="text-sm font-semibold">분류 및 긴급도</h2>
          <p className="mt-1 text-xs text-subtext">
            실제 처리 기준이 되는 최종 분류값입니다.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <FormField label="이슈 유형">
          <select
            className={INPUT_CLASS}
            value={category}
            onChange={(event) =>
              setCategory(event.target.value as IssueCategory)
            }
          >
            {CATEGORIES.map((categoryItem) => (
              <option key={categoryItem} value={categoryItem}>
                {ISSUE_CATEGORY_LABEL[categoryItem]}
              </option>
            ))}
          </select>
          </FormField>

          <FormField label="긴급도">
            <select
              className={INPUT_CLASS}
              value={urgency}
              onChange={(event) =>
                setUrgency(event.target.value as IssueUrgency)
              }
            >
              {URGENCIES.map((urgencyItem) => (
                <option key={urgencyItem} value={urgencyItem}>
                  {ISSUE_URGENCY_LABEL[urgencyItem]}
                </option>
              ))}
            </select>
          </FormField>
        </div>

        {category === "cleaning" && (
          <div className="mt-4 rounded-lg border border-primary/15 bg-primary/[0.04] px-4 py-3 text-xs leading-5 text-foreground/75">
            <p className="font-medium text-foreground">청소 예외 이슈 접수</p>
            <p className="mt-1">
              일반 청소 작업은 체크아웃 시 자동 생성됩니다. 청소 불량, 오염
              발견, 재청소 요청처럼 별도 확인이 필요한 문제만 접수해주세요.
            </p>
          </div>
        )}
      </section>

      {error && <p className="text-xs text-danger-text">{error}</p>}

      <button
        type="submit"
        disabled={submitting}
        className="h-10 self-end rounded-lg bg-foreground px-5 text-sm font-medium text-background transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
      >
        {submitting ? "등록 중..." : "이슈 등록"}
      </button>
    </form>
  );
}

const INPUT_CLASS =
  "h-10 w-full rounded-lg border border-card-border bg-background px-3 text-sm font-normal outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/10";

function FormField({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="flex flex-col gap-1.5 text-xs font-medium">
      {label}
      {children}
    </label>
  );
}
