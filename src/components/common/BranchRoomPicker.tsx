"use client";

import { useState } from "react";
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
  const branches = [...new Set(rooms.map((room) => room.branch))].sort((a, b) =>
    a.localeCompare(b, "ko")
  );

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <label className="flex flex-col gap-1.5 text-xs font-medium">
        숙소
        <select
          className="h-10 rounded-lg border border-card-border bg-background px-3 text-sm font-normal outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/10"
          value={branch}
          onChange={(event) => selectBranch(event.target.value)}
        >
          <option value="">숙소 선택</option>
          {branches.map((branchName) => (
            <option key={branchName} value={branchName}>
              {branchName}
            </option>
          ))}
        </select>
      </label>

      <label className="flex flex-col gap-1.5 text-xs font-medium">
        객실
        <select
          className="h-10 rounded-lg border border-card-border bg-background px-3 text-sm font-normal outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/10 disabled:opacity-40"
          value={value}
          disabled={!branch}
          onChange={(e) => onChange(e.target.value)}
        >
          <option value="">
            {!branch
              ? "숙소를 먼저 선택하세요"
              : roomsInBranch.length === 0
                ? "이 숙소에는 등록된 객실이 없습니다"
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
