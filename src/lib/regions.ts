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
