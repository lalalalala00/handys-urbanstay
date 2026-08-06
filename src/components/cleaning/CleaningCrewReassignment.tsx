"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { SelectWithButton } from "@/components/common/SelectWithButton";
import { useToast } from "@/components/common/Toast";
import type { Staff } from "@/lib/types";

export function CleaningCrewReassignment({
  taskId,
  assigneeId,
  cleaners,
}: {
  taskId: string;
  assigneeId: string | null;
  cleaners: Staff[];
}) {
  const router = useRouter();
  const showToast = useToast();
  const [selected, setSelected] = useState(assigneeId ?? "");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function reassign() {
    setPending(true);
    setError(null);
    const res = await fetch(`/api/cleaning-tasks/${taskId}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ assigneeId: selected }),
    });
    const json = await res.json();
    setPending(false);
    if (!res.ok) {
      setError(json.error ?? "요청에 실패했습니다.");
      return;
    }
    showToast("크루가 재배정되었습니다.");
    router.refresh();
  }

  return (
    <div>
      <div className="mb-2 text-sm font-medium">크루 재배정</div>
      <SelectWithButton
        value={selected}
        onChange={setSelected}
        options={cleaners.map((c) => ({ value: c.id, label: c.name }))}
        placeholder="크루 선택"
        buttonLabel="변경"
        onSubmit={reassign}
        disabled={!selected || selected === assigneeId || pending}
      />
      {error && (
        <p className="mt-2 text-xs text-red-600 dark:text-red-400">{error}</p>
      )}
    </div>
  );
}
