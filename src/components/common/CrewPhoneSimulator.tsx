"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/common/Toast";
import type { Room } from "@/lib/types";

type Step = "confirm" | "inProgress";

export function CrewPhoneSimulator({
  room,
  notificationTitle,
  detail,
  inProgressTitle,
  startLabel = "진행중",
  startingLabel = "시작하는 중...",
  patchUrl,
  patchBody,
  successToast,
  onDone,
}: {
  room: Room;
  notificationTitle: string;
  detail: React.ReactNode;
  inProgressTitle: string;
  startLabel?: string;
  startingLabel?: string;
  patchUrl: string;
  patchBody: Record<string, unknown>;
  successToast: string;
  onDone: () => void;
}) {
  const router = useRouter();
  const showToast = useToast();
  const [step, setStep] = useState<Step>("confirm");
  const [pending, setPending] = useState(false);

  async function start() {
    setPending(true);
    try {
      const res = await fetch(patchUrl, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(patchBody),
      });
      if (!res.ok) return;
      showToast(successToast);
      router.refresh();
      onDone();
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="relative flex h-[640px] w-[320px] flex-col overflow-hidden rounded-[2.5rem] border-[10px] border-black bg-black shadow-2xl">
        <div className="absolute top-0 left-1/2 z-10 h-6 w-32 -translate-x-1/2 rounded-b-2xl bg-black" />

        <div className="flex h-full flex-col overflow-hidden rounded-[1.75rem] bg-background text-foreground">
          <div className="flex items-center justify-between px-6 pt-3 pb-1 text-[11px] font-medium text-gray-500 dark:text-gray-400">
            <span>9:41</span>
            <span>크루 앱 (시뮬레이션)</span>
            <span>100%</span>
          </div>

          <div className="flex flex-1 flex-col justify-between p-5">
            {step === "confirm" ? (
              <>
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">새 배정 알림</p>
                  <h3 className="mt-1 text-lg font-semibold">{notificationTitle}</h3>
                  <div className="mt-4 rounded-xl border border-black/10 bg-black/[0.02] p-4 dark:border-white/10 dark:bg-white/[0.03]">
                    <p className="text-sm font-medium">{room.branch}</p>
                    <p className="mt-1 text-2xl font-bold">{room.room_number}호</p>
                    {detail}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setStep("inProgress")}
                  className="h-12 w-full rounded-xl bg-foreground text-sm font-semibold text-background transition hover:opacity-90"
                >
                  배정확인
                </button>
              </>
            ) : (
              <>
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">배정 확인 완료</p>
                  <h3 className="mt-1 text-lg font-semibold">{inProgressTitle}</h3>
                  <div className="mt-4 rounded-xl border border-black/10 bg-black/[0.02] p-4 dark:border-white/10 dark:bg-white/[0.03]">
                    <p className="text-sm font-medium">{room.branch}</p>
                    <p className="mt-1 text-2xl font-bold">{room.room_number}호</p>
                  </div>
                </div>
                <button
                  type="button"
                  disabled={pending}
                  onClick={start}
                  className="h-12 w-full rounded-xl bg-primary text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-40"
                >
                  {pending ? startingLabel : startLabel}
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
