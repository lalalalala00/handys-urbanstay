export type RegionDef = {
  id: string;
  city: string;
  district: string;
  label: string;
  branches: string[];
};

// Sample-only region -> branch mapping for 3 pilot locations. A real
// nationwide rollout would normalize this into `regions` and `branches`
// tables (branches.region_id -> regions.id, rooms.branch_id -> branches.id)
// instead of hardcoding branch name strings here.
export const REGIONS: RegionDef[] = [
  {
    id: "seoul-gangnam",
    city: "서울",
    district: "강남구",
    label: "서울 강남구",
    branches: ["노블리안 강남", "강남 스퀘어 스테이"],
  },
  {
    id: "seoul-mapo",
    city: "서울",
    district: "마포구",
    label: "서울 마포구",
    branches: ["홍대 하이브", "마포 브릭하우스"],
  },
  {
    id: "busan-haeundae",
    city: "부산",
    district: "해운대구",
    label: "부산 해운대구",
    branches: ["해운대 오션하우스", "선셋베이 해운대"],
  },
];

export function branchesInRegion(regionId: string): string[] {
  return REGIONS.find((r) => r.id === regionId)?.branches ?? [];
}

export function regionForBranch(branch: string): RegionDef | undefined {
  return REGIONS.find((r) => r.branches.includes(branch));
}

// Mock street addresses for the pilot branches — there's no real address
// data source yet, so these exist purely to make the branch header on the
// room-overview list read like a real property card.
const BRANCH_ADDRESS: Record<string, string> = {
  "노블리안 강남": "서울 강남구 테헤란로 92길 12",
  "강남 스퀘어 스테이": "서울 강남구 테헤란로 87길 5",
  "홍대 하이브": "서울 마포구 어울마당로 45",
  "마포 브릭하우스": "서울 마포구 월드컵로 20길 8",
  "해운대 오션하우스": "부산 해운대구 해운대로 620",
  "선셋베이 해운대": "부산 해운대구 달맞이길 65",
};

export function addressForBranch(branch: string): string | null {
  return BRANCH_ADDRESS[branch] ?? null;
}
