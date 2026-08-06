"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/common/Toast";

export function CheckoutButton({ roomId }: { roomId: string }) {
  const router = useRouter();
  const showToast = useToast();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function checkout() {
    setPending(true);
    setError(null);

    try {
      const response = await fetch(`/api/rooms/${roomId}/checkout`, {
        method: "POST",
      });
      const result = await response.json();

      if (!response.ok) {
        setError(result.error ?? "체크아웃 처리에 실패했습니다.");
        return;
      }

      showToast(
        result.task
          ? "체크아웃 처리되었습니다. 청소 작업이 등록되었습니다."
          : "체크아웃 처리되었습니다."
      );
      router.refresh();
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <button
        type="button"
        onClick={checkout}
        disabled={pending}
        className="h-8 shrink-0 rounded-md border border-primary/20 bg-primary/[0.05] px-3 text-xs font-semibold text-primary transition hover:bg-primary/10 disabled:cursor-not-allowed disabled:opacity-40"
      >
        {pending ? "처리 중..." : "체크아웃 처리"}
      </button>

      {error && <p className="text-[10px] text-danger-text">{error}</p>}
    </div>
  );
}
