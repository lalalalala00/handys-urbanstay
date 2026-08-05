"use client";

import { useState, useRef, useEffect } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { REGIONS } from "@/lib/regions";
import { ChevronDownIcon, LocationIcon } from "./icons";

function branchLabel(branch: string) {
  return `${branch}점`;
}

export function RegionSelector() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const currentBranch = searchParams.get("branch");
  const currentRegion = searchParams.get("region");

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  function go(params: URLSearchParams) {
    setOpen(false);
    const query = params.toString();
    router.push(query ? `${pathname}?${query}` : pathname);
  }

  function selectAll() {
    const params = new URLSearchParams(searchParams);
    params.delete("branch");
    params.delete("region");
    go(params);
  }

  function selectRegion(regionId: string) {
    const params = new URLSearchParams(searchParams);
    params.set("region", regionId);
    params.delete("branch");
    go(params);
  }

  function selectBranch(regionId: string, branch: string) {
    const params = new URLSearchParams(searchParams);
    params.set("region", regionId);
    params.set("branch", branch);
    go(params);
  }

  const currentLabel = currentBranch
    ? branchLabel(currentBranch)
    : (REGIONS.find((r) => r.id === currentRegion)?.label ?? "전체 지역");

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex max-w-36 items-center gap-1.5 rounded-lg border border-card-border px-3 py-1.5 text-sm text-foreground/80 transition-colors hover:border-primary/40 sm:max-w-none"
      >
        <LocationIcon className="h-3.5 w-3.5 text-subtext" />
        <span className="truncate">{currentLabel}</span>
        <ChevronDownIcon className="h-3.5 w-3.5 text-subtext" />
      </button>

      {open && (
        <div className="absolute right-0 top-full z-10 mt-1.5 w-52 overflow-hidden rounded-lg border border-card-border bg-card py-1 shadow-lg">
          <button
            type="button"
            onClick={selectAll}
            className={`block w-full px-3 py-1.5 text-left text-sm transition-colors hover:bg-black/5 dark:hover:bg-white/5 ${
              !currentRegion && !currentBranch
                ? "font-medium text-primary"
                : "text-foreground/80"
            }`}
          >
            전체 지역
          </button>

          {REGIONS.map((region) => (
            <div key={region.id} className="border-t border-card-border/60 py-1">
              <button
                type="button"
                onClick={() => selectRegion(region.id)}
                className={`block w-full px-3 py-1.5 text-left text-sm transition-colors hover:bg-black/5 dark:hover:bg-white/5 ${
                  currentRegion === region.id && !currentBranch
                    ? "font-medium text-primary"
                    : "text-foreground/80"
                }`}
              >
                {region.label}
              </button>
              {region.branches.map((branch) => (
                <button
                  key={branch}
                  type="button"
                  onClick={() => selectBranch(region.id, branch)}
                  className={`block w-full py-1.5 pr-3 pl-6 text-left text-xs transition-colors hover:bg-black/5 dark:hover:bg-white/5 ${
                    currentBranch === branch
                      ? "font-medium text-primary"
                      : "text-subtext"
                  }`}
                >
                  {branchLabel(branch)}
                </button>
              ))}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
