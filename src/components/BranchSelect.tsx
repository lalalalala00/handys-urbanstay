"use client";

import { REGIONS } from "@/lib/regions";

export function BranchSelect({
  value,
  onChange,
  className,
}: {
  value: string;
  onChange: (branch: string) => void;
  className?: string;
}) {
  return (
    <select
      className={
        className ??
        "rounded border border-black/10 bg-transparent px-3 py-2 dark:border-white/10"
      }
      value={value}
      onChange={(e) => onChange(e.target.value)}
    >
      <option value="">지점 선택</option>
      {REGIONS.map((region) => (
        <optgroup key={region.id} label={region.label}>
          {region.branches.map((branch) => (
            <option key={branch} value={branch}>
              {branch}
            </option>
          ))}
        </optgroup>
      ))}
    </select>
  );
}
