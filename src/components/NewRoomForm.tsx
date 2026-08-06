"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { BranchSelect } from "@/components/BranchSelect";

export function NewRoomForm({ initialBranch }: { initialBranch?: string }) {
  const router = useRouter();
  const [branch, setBranch] = useState(initialBranch ?? "");
  const [roomNumber, setRoomNumber] = useState("");
  const [doorLockCode, setDoorLockCode] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!branch || !roomNumber.trim()) {
      setError("지점과 호수를 입력해주세요.");
      return;
    }
    setSubmitting(true);
    setError(null);
    const res = await fetch("/api/rooms", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        branch,
        roomNumber,
        doorLockCode: doorLockCode.trim() || undefined,
      }),
    });
    const json = await res.json();
    setSubmitting(false);
    if (!res.ok) {
      setError(json.error ?? "등록에 실패했습니다.");
      return;
    }
    router.push(`/rooms/${json.room.id}`);
  }

  return (
    <form onSubmit={submit} className="flex max-w-xl flex-col gap-5">
      <label className="flex flex-col gap-1 text-sm">
        지점
        <BranchSelect value={branch} onChange={setBranch} />
      </label>

      <label className="flex flex-col gap-1 text-sm">
        호수
        <input
          className="rounded border border-black/10 bg-transparent px-3 py-2 dark:border-white/10"
          value={roomNumber}
          onChange={(e) => setRoomNumber(e.target.value)}
          placeholder="예: 302"
        />
      </label>

      <label className="flex flex-col gap-1 text-sm">
        도어락 코드 (선택)
        <input
          className="rounded border border-black/10 bg-transparent px-3 py-2 dark:border-white/10"
          value={doorLockCode}
          onChange={(e) => setDoorLockCode(e.target.value)}
        />
      </label>

      {error && <p className="text-xs text-red-600 dark:text-red-400">{error}</p>}

      <button
        type="submit"
        disabled={submitting}
        className="self-start rounded bg-foreground px-4 py-2 text-sm text-background disabled:opacity-40"
      >
        {submitting ? "등록 중..." : "객실 등록"}
      </button>
    </form>
  );
}
