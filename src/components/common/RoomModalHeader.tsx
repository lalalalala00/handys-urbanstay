"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { RoomStatusBadge } from "@/components/common/StatusBadges";
import { Badge } from "@/components/common/Badge";
import { CopyButton } from "@/components/common/CopyButton";
import { ShareButton } from "@/components/common/ShareButton";
import { useModalClose } from "@/components/common/Modal";
import { useToast } from "@/components/common/Toast";
import { LocationIcon } from "@/components/common/icons";
import { regionForBranch } from "@/lib/regions";
import { formatDateTimeWithDay, formatRelative } from "@/lib/format";
import { getRoomDisplayStatus } from "@/lib/roomDisplayStatus";
import type { CleaningTask, OperationStatus, Room, Staff } from "@/lib/types";

export type ManagerControl = {
  managerId: string | null;
  managerName: string | null;
  defaultManagerId: string | null;
  managers: Staff[];
  target: { kind: "issue" | "cleaningTask" | "property"; id: string };
};

const MANAGER_TARGET_ENDPOINT: Record<
  ManagerControl["target"]["kind"],
  string
> = {
  issue: "/api/issues",
  cleaningTask: "/api/cleaning-tasks",
  property: "/api/properties",
};

export function RoomModalHeader({
  room,
  task,
  managerControl,
  cleaningCrewName,
  issueCrewName,
  titleSuffix,
  operationControl,
}: {
  room: Room;
  task?: CleaningTask | null;
  managerControl: ManagerControl;
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

  const [showManagerForm, setShowManagerForm] = useState(false);
  const [selectedManagerId, setSelectedManagerId] = useState(
    managerControl.managerId ?? "",
  );
  const [managerPending, setManagerPending] = useState(false);
  const [managerError, setManagerError] = useState<string | null>(null);
  const managerContainerRef = useRef<HTMLDivElement>(null);

  async function changeManager() {
    if (!selectedManagerId || selectedManagerId === managerControl.managerId) {
      return;
    }
    setManagerPending(true);
    setManagerError(null);

    try {
      const endpoint = `${MANAGER_TARGET_ENDPOINT[managerControl.target.kind]}/${managerControl.target.id}`;
      const response = await fetch(endpoint, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ managerId: selectedManagerId }),
      });
      const result = await response.json();

      if (!response.ok) {
        setManagerError(result.error ?? "담당 운영자를 변경하지 못했습니다.");
        return;
      }

      showToast("담당 운영자가 변경되었습니다.");
      setShowManagerForm(false);
      router.refresh();
    } finally {
      setManagerPending(false);
    }
  }

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
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setShowReservation(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showReservation]);

  useEffect(() => {
    if (!showManagerForm) return;
    function handleClickOutside(e: MouseEvent) {
      if (
        managerContainerRef.current &&
        !managerContainerRef.current.contains(e.target as Node)
      ) {
        setShowManagerForm(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showManagerForm]);

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
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() =>
                        isBlocked ? resumeSale() : setShowBlockForm((v) => !v)
                      }
                      disabled={
                        pending ||
                        (isBlocked && operationControl.roomOpenIssueCount > 0)
                      }
                      aria-expanded={!isBlocked ? showBlockForm : undefined}
                      className={`h-7 shrink-0 rounded-md px-2.5 text-[11px] font-semibold transition disabled:cursor-not-allowed disabled:opacity-40 ${
                        isBlocked
                          ? "bg-primary text-white hover:bg-primary-hover"
                          : "border border-danger-border text-danger-text hover:bg-danger-bg"
                      }`}
                    >
                      {pending
                        ? "변경 중..."
                        : isBlocked
                          ? "판매 재개"
                          : "판매 중지"}
                    </button>

                    {showBlockForm && !isBlocked && (
                      <form
                        onSubmit={(event) => {
                          event.preventDefault();
                          if (!blockReason.trim()) return;
                          blockRoom(blockReason.trim());
                        }}
                        className="absolute top-full left-0 z-30 mt-2 w-80 max-w-[calc(100vw-3rem)] rounded-xl border border-card-border bg-card p-4 text-left shadow-xl"
                      >
                        <p className="text-sm font-semibold">판매 중지 사유</p>
                        <p className="mt-1 text-[11px] leading-4 text-subtext">
                          입력한 사유로 긴급 운영 이슈가 함께 등록됩니다.
                        </p>
                        <textarea
                          autoFocus
                          value={blockReason}
                          onChange={(event) =>
                            setBlockReason(event.target.value)
                          }
                          placeholder="예: 도어락 오류로 현장 점검 필요"
                          rows={3}
                          className="mt-3 w-full resize-none rounded-lg border border-card-border bg-background px-3 py-2 text-xs leading-5 outline-none placeholder:text-subtext/70 focus:border-primary/50 focus:ring-2 focus:ring-primary/10"
                        />
                        <div className="mt-3 flex justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => {
                              setShowBlockForm(false);
                              setBlockReason("");
                            }}
                            className="h-8 rounded-md px-3 text-xs text-subtext hover:bg-black/5 dark:hover:bg-white/10"
                          >
                            취소
                          </button>
                          <button
                            type="submit"
                            disabled={pending || !blockReason.trim()}
                            className="h-8 rounded-md bg-danger-text px-3 text-xs font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
                          >
                            {pending ? "처리 중..." : "판매 중지"}
                          </button>
                        </div>
                      </form>
                    )}
                  </div>
                )}
              </div>
            )}

            {isBlocked &&
              operationControl &&
              operationControl.roomOpenIssueCount > 0 && (
                <p className="text-[10px] text-subtext">
                  미완료 이슈 {operationControl.roomOpenIssueCount}건 처리 후
                  재개 가능
                </p>
              )}
            {error && <p className="text-[10px] text-danger-text">{error}</p>}
          </div>

          <div className="flex shrink-0 items-center gap-1">
            <ShareButton
              title={`${room.branch} ${room.room_number}호${titleSuffix ? ` ${titleSuffix}` : ""}`}
            />
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
        </div>
      )}

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400">
            <LocationIcon className="h-3.5 w-3.5" />
            <span>{room.branch}</span>
          </div>
          <div
            ref={containerRef}
            className="relative mt-1 flex items-center gap-2"
          >
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
          <div ref={managerContainerRef} className="relative">
            <button
              type="button"
              aria-expanded={showManagerForm}
              aria-label="담당 운영자 변경"
              onClick={() => {
                setSelectedManagerId(managerControl.managerId ?? "");
                setManagerError(null);
                setShowManagerForm((v) => !v);
              }}
              className="-m-1 flex items-center gap-2 rounded-xl border border-card-border bg-card px-2 py-1.5 text-left transition hover:border-primary/30 hover:bg-primary/[0.03]"
            >
              <Avatar name={managerControl.managerName} variant="operator" />
              <div className="leading-tight">
                <div className="flex items-center gap-1 text-[11px] whitespace-nowrap text-gray-500 dark:text-gray-400">
                  담당 운영자
                  {managerControl.managerId &&
                    managerControl.managerId ===
                      managerControl.defaultManagerId && (
                      <span className="rounded-full bg-blue-50 px-1.5 py-0 text-[9px] font-medium text-blue-600 dark:bg-blue-950/40 dark:text-blue-300">
                        지점 기본
                      </span>
                    )}
                </div>
                <div className="mt-0.5 flex items-center gap-1.5 justify-between">
                  <span className="text-sm font-medium whitespace-nowrap">
                    {managerControl.managerName ?? "미배정"}
                  </span>
                  <span className="rounded-md bg-primary/[0.08] px-1.5 py-0.5 text-[10px] font-semibold whitespace-nowrap text-primary">
                    변경
                  </span>
                </div>
              </div>
            </button>

            {showManagerForm && (
              <div className="absolute top-full right-0 z-30 mt-2 w-64 rounded-xl border border-card-border bg-card p-3 text-left shadow-xl">
                <p className="mb-2 text-xs font-semibold">담당 운영자 변경</p>
                <select
                  value={selectedManagerId}
                  onChange={(event) => setSelectedManagerId(event.target.value)}
                  className="w-full rounded-lg border border-card-border bg-background px-2 py-1.5 text-xs outline-none focus:border-primary/50"
                >
                  <option value="" disabled>
                    담당자를 선택하세요
                  </option>
                  {managerControl.managers.map((manager) => (
                    <option key={manager.id} value={manager.id}>
                      {manager.name}
                      {manager.id === managerControl.defaultManagerId
                        ? " · 지점 기본"
                        : ""}
                    </option>
                  ))}
                </select>
                <div className="mt-2 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setShowManagerForm(false)}
                    className="h-7 rounded-md px-2 text-xs text-subtext hover:bg-black/5 dark:hover:bg-white/10"
                  >
                    취소
                  </button>
                  <button
                    type="button"
                    disabled={
                      managerPending ||
                      !selectedManagerId ||
                      selectedManagerId === managerControl.managerId
                    }
                    onClick={changeManager}
                    className="h-7 rounded-md bg-primary px-2.5 text-xs font-semibold text-white transition hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    {managerPending ? "변경 중..." : "변경"}
                  </button>
                </div>
                {managerError && (
                  <p className="mt-1.5 text-[10px] text-danger-text">
                    {managerError}
                  </p>
                )}
              </div>
            )}
          </div>
          <PersonField
            label="청소 담당 크루"
            name={cleaningCrewName}
            variant="crew"
          />
          {issueCrewName !== undefined && (
            <PersonField
              label="이슈 담당 크루"
              name={issueCrewName}
              variant="crew"
            />
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
            <Badge
              tone={room.payment_status === "paid" ? "success" : "warning"}
            >
              {room.payment_status === "paid" ? "결제 완료" : "미결제"}
            </Badge>
            <span className="text-sm font-semibold">
              {room.payment_amount
                ? `${room.payment_amount.toLocaleString()}원`
                : "-"}
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

function PopoverField({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="min-w-0">
      <div className="text-[11px] text-gray-500 dark:text-gray-400">
        {label}
      </div>
      <div className="mt-0.5 text-sm font-medium whitespace-nowrap">
        {children}
      </div>
    </div>
  );
}

const AVATAR_VARIANT_CLASSES = {
  operator: "bg-sage text-primary-hover",
  crew: "bg-sand text-brown",
};

function Avatar({
  name,
  variant,
}: {
  name: string | null;
  variant: keyof typeof AVATAR_VARIANT_CLASSES;
}) {
  return (
    <div
      className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-semibold ${AVATAR_VARIANT_CLASSES[variant]}`}
    >
      {name ? name.slice(0, 1) : "-"}
    </div>
  );
}

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
      <Avatar name={name} variant={variant} />
      <div className="leading-tight">
        <div className="text-[11px] whitespace-nowrap text-gray-500 dark:text-gray-400">
          {label}
        </div>
        <div className="text-sm font-medium whitespace-nowrap">
          {name ?? "미배정"}
        </div>
        {name && sub && (
          <div className="text-[11px] whitespace-nowrap text-gray-500 dark:text-gray-400">
            {sub}
          </div>
        )}
      </div>
    </div>
  );
}
