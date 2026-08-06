import { getStaffList } from "@/lib/queries";
import { NewPropertyForm } from "@/components/property/NewPropertyForm";

export const dynamic = "force-dynamic";

export default async function NewPropertyPage() {
  const staff = await getStaffList();
  const managers = staff.filter((member) => member.role === "manager");

  return (
    <div className="flex flex-col gap-6">
      <header>
        <h1 className="text-lg font-semibold">새 숙소 등록</h1>
        <p className="mt-1 text-xs text-subtext">
          핸디즈가 새로 운영할 숙소의 기본 정보를 등록합니다.
        </p>
      </header>
      <NewPropertyForm managers={managers} />
    </div>
  );
}
