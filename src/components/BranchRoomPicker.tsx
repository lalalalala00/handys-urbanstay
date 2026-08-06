"use client";

import { useState } from "react";
import { BranchSelect } from "@/components/BranchSelect";
import type { OccupancyStatus, OperationStatus } from "@/lib/types";

export interface RoomOption {
  id: string;
  branch: string;
  room_number: string;
  occupancy_status: OccupancyStatus;
  operation_status: OperationStatus;
}

export function roomOptionLabel(room: RoomOption): string {
  if (room.operation_status === "blocked") return "판매중지";
  if (room.occupancy_status === "occupied") return "투숙중";
  return "빈 객실";
}

export function BranchRoomPicker({
  rooms,
  value,
  onChange,
  initialBranch,
}: {
  rooms: RoomOption[];
  value: string;
  onChange: (roomId: string) => void;
  initialBranch?: string;
}) {
  const [branch, setBranch] = useState(initialBranch ?? "");

  function selectBranch(nextBranch: string) {
    setBranch(nextBranch);
    onChange("");
  }

  const roomsInBranch = branch
    ? rooms.filter((r) => r.branch === branch)
    : [];

  return (
    <div className="flex flex-col gap-3 sm:flex-row">
      <label className="flex flex-1 flex-col gap-1 text-sm">
        지점
        <BranchSelect value={branch} onChange={selectBranch} />
      </label>

      <label className="flex flex-1 flex-col gap-1 text-sm">
        객실
        <select
          className="rounded border border-black/10 bg-transparent px-3 py-2 dark:border-white/10 disabled:opacity-40"
          value={value}
          disabled={!branch}
          onChange={(e) => onChange(e.target.value)}
        >
          <option value="">
            {!branch
              ? "지점을 먼저 선택하세요"
              : roomsInBranch.length === 0
                ? "이 지점에는 등록된 객실이 없습니다"
                : "객실 선택"}
          </option>
          {roomsInBranch.map((r) => (
            <option key={r.id} value={r.id}>
              {r.room_number}호 ({roomOptionLabel(r)})
            </option>
          ))}
        </select>
      </label>
    </div>
  );
}
