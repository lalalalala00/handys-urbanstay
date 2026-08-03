import { RoomStatusBadge } from "@/components/StatusBadges";
import { LocationIcon } from "@/components/icons";
import { regionForBranch } from "@/lib/regions";
import type { Room } from "@/lib/types";

export function RoomModalHeader({
  room,
  operatorName,
  crewName,
  titleSuffix,
}: {
  room: Room;
  operatorName: string | null;
  crewName: string | null;
  titleSuffix?: string;
}) {
  const region = regionForBranch(room.branch);

  return (
    <div className="flex flex-wrap items-start justify-between gap-4">
      <div>
        <div className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400">
          <LocationIcon className="h-3.5 w-3.5" />
          <span>{room.branch}</span>
        </div>
        <div className="mt-1 flex items-center gap-2">
          <h2 className="text-xl font-semibold">
            {room.room_number}호{titleSuffix ? ` ${titleSuffix}` : ""}
          </h2>
          <RoomStatusBadge status={room.status} />
        </div>
        {region && (
          <div className="mt-1 text-xs text-gray-500 dark:text-gray-400">
            {region.city} &gt; {region.district}
          </div>
        )}
      </div>

      <div className="flex items-center gap-5">
        <PersonField label="담당 운영자" name={operatorName} sub={room.branch} />
        <PersonField label="담당 크루" name={crewName} />
      </div>
    </div>
  );
}

function PersonField({
  label,
  name,
  sub,
}: {
  label: string;
  name: string | null;
  sub?: string;
}) {
  return (
    <div className="flex items-center gap-2">
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-sage text-xs font-semibold text-primary-hover">
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
