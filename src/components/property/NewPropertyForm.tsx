"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { REGIONS } from "@/lib/regions";
import type { PropertyStatus, Staff } from "@/lib/types";

export function NewPropertyForm({ managers }: { managers: Staff[] }) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [regionId, setRegionId] = useState("");
  const [address, setAddress] = useState("");
  const [roomNumbersText, setRoomNumbersText] = useState("");
  const [managerId, setManagerId] = useState("");
  const [checkinTime, setCheckinTime] = useState("15:00");
  const [checkoutTime, setCheckoutTime] = useState("11:00");
  const [status, setStatus] = useState<PropertyStatus>("preparing");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const roomNumbers = parseRoomNumbers(roomNumbersText);
  const duplicateRoomNumbers = findDuplicates(roomNumbers);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (!name.trim() || !regionId || !address.trim()) {
      setError("숙소명, 지역, 주소를 입력해주세요.");
      return;
    }
    if (roomNumbers.length === 0) {
      setError("등록할 객실 번호를 하나 이상 입력해주세요.");
      return;
    }
    if (duplicateRoomNumbers.length > 0) {
      setError(`중복된 객실 번호를 확인해주세요: ${duplicateRoomNumbers.join(", ")}`);
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const response = await fetch("/api/properties", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          regionId,
          address: address.trim(),
          roomNumbers,
          managerId: managerId || null,
          checkinTime,
          checkoutTime,
          status,
        }),
      });
      const result = await response.json();

      if (!response.ok) {
        setError(result.error ?? "숙소를 등록하지 못했습니다.");
        return;
      }

      router.push(`/rooms?branch=${encodeURIComponent(name.trim())}`);
      router.refresh();
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={submit} className="flex max-w-2xl flex-col gap-5">
      <section className="rounded-xl border border-card-border bg-card p-5">
        <div className="mb-4">
          <h2 className="text-sm font-semibold">숙소 기본 정보</h2>
          <p className="mt-1 text-xs text-subtext">
            새로 운영할 숙소의 명칭과 위치를 등록합니다.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <FormField label="숙소명" required>
            <input
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="예: 성수 리버 스테이"
              className={INPUT_CLASS}
              autoComplete="off"
            />
          </FormField>

          <FormField label="지역" required>
            <select
              value={regionId}
              onChange={(event) => setRegionId(event.target.value)}
              className={INPUT_CLASS}
            >
              <option value="">지역 선택</option>
              {REGIONS.map((region) => (
                <option key={region.id} value={region.id}>
                  {region.label}
                </option>
              ))}
            </select>
          </FormField>

          <div className="sm:col-span-2">
            <FormField label="도로명 주소" required>
              <input
                value={address}
                onChange={(event) => setAddress(event.target.value)}
                placeholder="예: 서울 성동구 연무장길 00"
                className={INPUT_CLASS}
                autoComplete="street-address"
              />
            </FormField>
          </div>

          <FormField label="운영 담당자">
            <select
              value={managerId}
              onChange={(event) => setManagerId(event.target.value)}
              className={INPUT_CLASS}
            >
              <option value="">추후 배정</option>
              {managers.map((manager) => (
                <option key={manager.id} value={manager.id}>
                  {manager.name}
                </option>
              ))}
            </select>
          </FormField>
        </div>
      </section>

      <section className="rounded-xl border border-card-border bg-card p-5">
        <div className="mb-4 flex items-start justify-between gap-3">
          <div>
            <h2 className="text-sm font-semibold">객실 구성</h2>
            <p className="mt-1 text-xs text-subtext">
              객실 번호를 줄바꿈, 띄어쓰기 또는 쉼표로 구분해 입력합니다.
            </p>
          </div>
          <span className="shrink-0 rounded-full bg-black/5 px-2.5 py-1 text-[11px] font-semibold text-subtext dark:bg-white/10">
            {roomNumbers.length}개 객실
          </span>
        </div>

        <FormField label="객실 번호" required>
          <textarea
            value={roomNumbersText}
            onChange={(event) => setRoomNumbersText(event.target.value)}
            placeholder={"예: 101, 102, 103\n201, 202, 203"}
            rows={4}
            className="w-full resize-y rounded-lg border border-card-border bg-background px-3 py-2 text-sm leading-6 outline-none placeholder:text-subtext/70 focus:border-primary/50 focus:ring-2 focus:ring-primary/10"
          />
        </FormField>

        {duplicateRoomNumbers.length > 0 && (
          <p className="mt-2 text-xs text-danger-text">
            중복된 객실: {duplicateRoomNumbers.join(", ")}
          </p>
        )}

        <p className="mt-3 text-[11px] leading-5 text-subtext">
          생성된 객실은 모두 빈 객실이며, 운영 준비가 끝날 때까지 판매 채널
          노출이 중지됩니다.
        </p>
      </section>

      <section className="rounded-xl border border-card-border bg-card p-5">
        <div className="mb-4">
          <h2 className="text-sm font-semibold">기본 운영 설정</h2>
          <p className="mt-1 text-xs text-subtext">
            객실별 예약 정보와 도어락은 숙소 등록 후 연결합니다.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <FormField label="기본 체크인">
            <input
              type="time"
              value={checkinTime}
              onChange={(event) => setCheckinTime(event.target.value)}
              className={INPUT_CLASS}
            />
          </FormField>

          <FormField label="기본 체크아웃">
            <input
              type="time"
              value={checkoutTime}
              onChange={(event) => setCheckoutTime(event.target.value)}
              className={INPUT_CLASS}
            />
          </FormField>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          <StatusOption
            value="preparing"
            selected={status === "preparing"}
            label="운영 준비 중"
            onSelect={setStatus}
          />
          <StatusOption
            value="active"
            selected={status === "active"}
            label="운영 중"
            onSelect={setStatus}
          />
        </div>
      </section>

      {error && <p className="text-xs text-danger-text">{error}</p>}

      <button
        type="submit"
        disabled={submitting}
        className="h-10 self-end rounded-lg bg-foreground px-5 text-sm font-medium text-background transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
      >
        {submitting ? "등록 중..." : "숙소 및 객실 등록"}
      </button>
    </form>
  );
}

function parseRoomNumbers(value: string) {
  return value
    .split(/[\s,]+/)
    .map((roomNumber) => roomNumber.trim())
    .filter(Boolean);
}

function findDuplicates(values: string[]) {
  const seen = new Set<string>();
  const duplicates = new Set<string>();
  for (const value of values) {
    if (seen.has(value)) duplicates.add(value);
    seen.add(value);
  }
  return [...duplicates];
}

const INPUT_CLASS =
  "h-10 w-full rounded-lg border border-card-border bg-background px-3 text-sm font-normal outline-none placeholder:text-subtext/70 focus:border-primary/50 focus:ring-2 focus:ring-primary/10";

function FormField({
  label,
  required = false,
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <label className="flex flex-col gap-1.5 text-xs font-medium">
      <span>
        {label}
        {required && <span className="ml-1 text-danger-text">*</span>}
      </span>
      {children}
    </label>
  );
}

function StatusOption({
  value,
  selected,
  label,
  onSelect,
}: {
  value: PropertyStatus;
  selected: boolean;
  label: string;
  onSelect: (value: PropertyStatus) => void;
}) {
  return (
    <label
      className={`cursor-pointer rounded-lg border px-3 py-2 text-xs font-medium transition ${
        selected
          ? "border-primary/35 bg-primary/[0.06] text-primary"
          : "border-card-border text-subtext hover:bg-black/[0.02] dark:hover:bg-white/[0.03]"
      }`}
    >
      <input
        type="radio"
        name="property-status"
        value={value}
        checked={selected}
        onChange={() => onSelect(value)}
        className="sr-only"
      />
      {label}
    </label>
  );
}
