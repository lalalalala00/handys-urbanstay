import { getStaffList } from "@/lib/queries";
import { NewPropertyForm } from "@/components/property/NewPropertyForm";
import { Modal, ModalCloseButton } from "@/components/common/Modal";

export const dynamic = "force-dynamic";

export default async function NewPropertyModal() {
  const staff = await getStaffList();
  const managers = staff.filter((member) => member.role === "manager");

  return (
    <Modal>
      <header className="mb-6 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-lg font-semibold">새 숙소 등록</h1>
          <p className="mt-1 text-xs text-subtext">
            핸디즈가 새로 운영할 숙소의 기본 정보를 등록합니다.
          </p>
        </div>
        <ModalCloseButton />
      </header>
      <NewPropertyForm managers={managers} />
    </Modal>
  );
}
