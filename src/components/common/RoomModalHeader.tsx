"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { RoomStatusBadge } from "@/components/common/StatusBadges";
import { Badge } from "@/components/common/Badge";
import { CopyButton } from "@/components/common/CopyButton";
import { useModalClose } from "@/components/common/Modal";
import { useToast } from "@/components/common/Toast";
import { LocationIcon } from "@/components/common/icons";
import { regionForBranch } from "@/lib/regions";
import { formatDateTimeWithDay, formatRelative } from "@/lib/format";
import { getRoomDisplayStatus } from "@/lib/roomDisplayStatus";
import type { CleaningTask, OperationStatus, Room } from "@/lib/types";

export function RoomModalHeader({
  room,
  task,
  operatorName,
  cleaningCrewName,
  issueCrewName,
  titleSuffix,
  operationControl,
}: {
  room: Room;
  task?: CleaningTask | null;
  operatorName: string | null;
  cleaningCrewName: string | null;
  issueCrewName?: string | null;
  titleSuffix?: string;
  operationControl?: { roomOpenIssueCount: number };
}) {
  const region = regionForBranch(room.branch);
  const displayStatus = getRoomDisplayStatus(room, task);
  const [showReservation, setShowReservation] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const showToast = useToast();
  const closeModal = useModalClose();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showBlockForm, setShowBlockForm] = useState(false);
  const [blockReason, setBlockReason] = useState("");
  const isBlocked = room.operation_status === "blocked";

  async function blockRoom(reason: string) {
    setPending(true);
    setError(null);

    try {
      const issueRes = await fetch("/api/issues", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          roomId: room.id,
          category: "other",
          description: reason,
          reporterType: "manager",
          urgency: "urgent",
        }),
      });
      const issueResult = await issueRes.json();
      if (!issueRes.ok) {
        setError(issueResult.error ?? "이슈 등록에 실패했습니다.");
        return;
      }

      const response = await fetch(`/api/rooms/${room.id}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          operationStatus: "blocked" satisfies OperationStatus,
          operationNote: reason,
        }),
      });
      const result = await response.json();

      if (!response.ok) {
        setError(result.error ?? "객실 운영 상태를 변경하지 못했습니다.");
        return;
      }

      showToast("객실 판매를 중지했습니다.");
      setShowBlockForm(false);
      setBlockReason("");
      router.refresh();
    } finally {
      setPending(false);
    }
  }

  async function resumeSale() {
    setPending(true);
    setError(null);

    try {
      const response = await fetch(`/api/rooms/${room.id}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          operationStatus: "ready" satisfies OperationStatus,
          operationNote: null,
        }),
      });
      const result = await response.json();

      if (!response.ok) {
        setError(result.error ?? "객실 운영 상태를 변경하지 못했습니다.");
        return;
      }

      showToast("객실 판매를 재개했습니다.");
      router.refresh();
    } finally {
      setPending(false);
    }
  }

  useEffect(() => {
    if (!showReservation) return;
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setShowReservation(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showReservation]);

  return (
    <div>
      {(operationControl || isBlocked || closeModal) && (
        <div className="mb-3 flex min-h-7 items-start justify-between gap-4">
          <div className="flex min-w-0 flex-col gap-1" aria-live="polite">
            {(operationControl || isBlocked) && (
              <div className="flex flex-wrap items-center gap-2">
                <span
                  className={`h-1.5 w-1.5 shrink-0 rounded-full ${
                    isBlocked ? "bg-danger-text" : "bg-success-text"
                  }`}
                />
                <span className="text-[11px] text-subtext">판매 채널</span>
                <span
                  className={`text-xs font-medium ${
                    isBlocked ? "text-danger-text" : "text-success-text"
                  }`}
                >
                  {isBlocked ? "노출 중지" : "노출 중"}
                </span>
                {isBlocked && room.operation_note && (
                  <span className="hidden max-w-48 truncate text-[11px] text-subtext sm:inline">
                    {room.operation_note}
                  </span>
                )}
                {operationControl && (
                  <button
                    type="button"
                    onClick={() =>
                      isBlocked ? resumeSale() : setShowBlockForm((v) => !v)
                    }
                    disabled={
                      pending ||
                      (isBlocked && operationControl.roomOpenIssueCount > 0)
                    }
                    className={`h-7 shrink-0 rounded-md px-2.5 text-[11px] font-semibold transition disabled:cursor-not-allowed disabled:opacity-40 ${
                      isBlocked
                        ? "bg-primary text-white hover:bg-primary-hover"
                        : "border border-danger-border text-danger-text hover:bg-danger-bg"
                    }`}
                  >
                    {pending ? "변경 중..." : isBlocked ? "판매 재개" : "판매 중지"}
                  </button>
                )}
              </div>
            )}

            {showBlockForm && !isBlocked && (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  if (!blockReason.trim()) return;
                  blockRoom(blockReason.trim());
                }}
                className="mt-1 flex items-center gap-2"
              >
                <input
                  autoFocus
                  value={blockReason}
                  onChange={(e) => setBlockReason(e.target.value)}
                  placeholder="판매 중지 사유를 입력하세요"
                  className="h-7 min-w-0 flex-1 rounded-md border border-black/10 bg-transparent px-2 text-xs dark:border-white/10"
                />
                <button
                  type="submit"
                  disabled={pending || !blockReason.trim()}
                  className="h-7 shrink-0 rounded-md bg-primary px-2.5 text-[11px] font-semibold text-white transition hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-40"
                >
                  {pending ? "등록 중..." : "확인"}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowBlockForm(false);
                    setBlockReason("");
                  }}
                  className="h-7 shrink-0 rounded-md px-2 text-[11px] text-subtext hover:bg-black/5 dark:hover:bg-white/10"
                >
                  취소
                </button>
              </form>
            )}

            {isBlocked &&
              operationControl &&
              operationControl.roomOpenIssueCount > 0 && (
                <p className="text-[10px] text-subtext">
                  미완료 이슈 {operationControl.roomOpenIssueCount}건 처리 후 재개 가능
                </p>
              )}
            {error && <p className="text-[10px] text-danger-text">{error}</p>}
          </div>

          {closeModal && (
            <button
              type="button"
              onClick={closeModal}
              aria-label="닫기"
              className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-gray-500 hover:bg-black/5 dark:hover:bg-white/10"
            >
              ✕
            </button>
          )}
        </div>
      )}

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400">
            <LocationIcon className="h-3.5 w-3.5" />
            <span>{room.branch}</span>
          </div>
          <div ref={containerRef} className="relative mt-1 flex items-center gap-2">
            <button
              type="button"
              onClick={() => setShowReservation((v) => !v)}
              className="text-xl font-semibold underline decoration-dotted decoration-gray-400 underline-offset-4 transition-colors hover:decoration-foreground"
            >
              {room.room_number}호{titleSuffix ? ` ${titleSuffix}` : ""}
            </button>
            <RoomStatusBadge status={displayStatus} />
            {displayStatus === "ready" && task?.completed_at && (
              <span className="text-xs font-medium text-success-text">
                게시됨 · {formatRelative(task.completed_at)}
              </span>
            )}

            {showReservation && <ReservationPopover room={room} />}
          </div>
          {region && (
            <div className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              {region.city} &gt; {region.district}
            </div>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-5">
          <PersonField label="담당 운영자" name={operatorName} sub={room.branch} variant="operator" />
          <PersonField label="청소 담당 크루" name={cleaningCrewName} variant="crew" />
          {issueCrewName !== undefined && (
            <PersonField label="이슈 담당 크루" name={issueCrewName} variant="crew" />
          )}
        </div>
      </div>
    </div>
  );
}

function ReservationPopover({ room }: { room: Room }) {
  const hasGuest = Boolean(room.guest_name);

  return (
    <div className="absolute top-full left-0 z-20 mt-2 w-80 rounded-xl border border-black/10 bg-card p-4 text-left shadow-lg dark:border-white/10">
      <div className="mb-3 text-xs font-semibold text-gray-500 dark:text-gray-400">
        예약 정보
      </div>

      {hasGuest ? (
        <div className="grid grid-cols-2 gap-x-4 gap-y-3">
          <PopoverField label="예약자">{room.guest_name}</PopoverField>
          <PopoverField label="연락처">
            {room.guest_phone ? (
              <span className="flex items-center gap-1">
                {room.guest_phone}
                <CopyButton value={room.guest_phone} />
              </span>
            ) : (
              "-"
            )}
          </PopoverField>
          <PopoverField label="투숙 인원">
            {room.guest_count ? `${room.guest_count}명` : "-"}
          </PopoverField>
          <PopoverField label="숙박 기간">
            {room.nights ? `${room.nights}박` : "-"}
          </PopoverField>
          <PopoverField label="체크인">
            {formatDateTimeWithDay(room.next_checkin_at)}
          </PopoverField>
          <PopoverField label="체크아웃">
            {formatDateTimeWithDay(room.checkout_at)}
          </PopoverField>
          <div className="col-span-2 flex items-center gap-2">
            <Badge tone={room.payment_status === "paid" ? "success" : "warning"}>
              {room.payment_status === "paid" ? "결제 완료" : "미결제"}
            </Badge>
            <span className="text-sm font-semibold">
              {room.payment_amount ? `${room.payment_amount.toLocaleString()}원` : "-"}
            </span>
          </div>
        </div>
      ) : (
        <p className="text-xs text-gray-500 dark:text-gray-400">
          예정된 예약이 없습니다.
        </p>
      )}
    </div>
  );
}

function PopoverField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="min-w-0">
      <div className="text-[11px] text-gray-500 dark:text-gray-400">{label}</div>
      <div className="mt-0.5 text-sm font-medium whitespace-nowrap">{children}</div>
    </div>
  );
}

const AVATAR_VARIANT_CLASSES = {
  operator: "bg-sage text-primary-hover",
  crew: "bg-sand text-brown",
};

function PersonField({
  label,
  name,
  sub,
  variant,
}: {
  label: string;
  name: string | null;
  sub?: string;
  variant: keyof typeof AVATAR_VARIANT_CLASSES;
}) {
  return (
    <div className="flex items-center gap-2">
      <div
        className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-semibold ${AVATAR_VARIANT_CLASSES[variant]}`}
      >
        {name ? name.slice(0, 1) : "-"}
      </div>
      <div className="leading-tight">
        <div className="text-[11px] whitespace-nowrap text-gray-500 dark:text-gray-400">
          {label}
        </div>
        <div className="text-sm font-medium whitespace-nowrap">{name ?? "미배정"}</div>
        {name && sub && (
          <div className="text-[11px] whitespace-nowrap text-gray-500 dark:text-gray-400">
            {sub}
          </div>
        )}
      </div>
    </div>
  );
}
