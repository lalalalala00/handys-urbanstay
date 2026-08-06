import Link from "next/link";
import { getPropertiesList } from "@/lib/queries";
import { REGIONS } from "@/lib/regions";

export const dynamic = "force-dynamic";

export default async function PropertiesPage() {
  let properties: Awaited<ReturnType<typeof getPropertiesList>> = [];
  let databaseReady = true;

  try {
    properties = await getPropertiesList();
  } catch {
    databaseReady = false;
  }

  return (
    <div className="flex flex-col gap-5">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-lg font-semibold">숙소 관리</h1>
          <p className="mt-1 text-xs text-subtext">
            운영 중이거나 도입을 준비 중인 숙소를 관리합니다.
          </p>
        </div>

        {databaseReady ? (
          <Link
            href="/properties/new"
            className="flex h-9 items-center justify-center rounded-lg bg-foreground px-4 text-sm font-medium text-background transition hover:opacity-90"
          >
            숙소 등록
          </Link>
        ) : (
          <span className="flex h-9 cursor-not-allowed items-center justify-center rounded-lg bg-foreground px-4 text-sm font-medium text-background opacity-35">
            숙소 등록
          </span>
        )}
      </header>

      {!databaseReady && (
        <section className="rounded-xl border border-warning-border bg-warning-bg px-5 py-4">
          <p className="text-sm font-semibold text-warning-text">
            Supabase 설정이 필요합니다.
          </p>
          <p className="mt-1 text-xs leading-5 text-foreground/70">
            SQL Editor에서
            <code className="mx-1 rounded bg-black/5 px-1.5 py-0.5 dark:bg-white/10">
              202608060001_add_properties.sql
            </code>
            을 실행하면 숙소 관리와 등록 기능이 활성화됩니다.
          </p>
        </section>
      )}

      {databaseReady && <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {properties.map((property) => {
          const region = REGIONS.find((item) => item.id === property.region_id);
          return (
            <article
              key={property.id}
              className="rounded-xl border border-card-border bg-card p-5"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold">{property.name}</p>
                  <p className="mt-1 text-xs text-subtext">
                    {region?.label ?? "지역 미지정"}
                  </p>
                </div>
                <span
                  className={`shrink-0 rounded-full px-2 py-1 text-[10px] font-semibold ${
                    property.status === "active"
                      ? "bg-success-bg text-success-text"
                      : "bg-black/5 text-subtext dark:bg-white/10"
                  }`}
                >
                  {property.status === "active" ? "운영 중" : "준비 중"}
                </span>
              </div>

              <p className="mt-4 text-xs text-foreground/75">{property.address}</p>
              <dl className="mt-4 grid grid-cols-2 gap-3 border-t border-card-border pt-4 text-xs">
                <div>
                  <dt className="text-subtext">예정 객실</dt>
                  <dd className="mt-1 font-medium">{property.room_count}실</dd>
                </div>
                <div>
                  <dt className="text-subtext">운영 담당자</dt>
                  <dd className="mt-1 font-medium">
                    {property.manager?.name ?? "미배정"}
                  </dd>
                </div>
                <div>
                  <dt className="text-subtext">체크인</dt>
                  <dd className="mt-1 font-medium">
                    {property.checkin_time.slice(0, 5)}
                  </dd>
                </div>
                <div>
                  <dt className="text-subtext">체크아웃</dt>
                  <dd className="mt-1 font-medium">
                    {property.checkout_time.slice(0, 5)}
                  </dd>
                </div>
              </dl>
            </article>
          );
        })}
      </section>}

      {databaseReady && properties.length === 0 && (
        <div className="rounded-xl border border-card-border bg-card px-5 py-12 text-center">
          <p className="text-sm font-medium">등록된 숙소가 없습니다.</p>
          <p className="mt-1 text-xs text-subtext">
            새 운영 숙소를 등록하면 이곳에서 확인할 수 있습니다.
          </p>
        </div>
      )}
    </div>
  );
}
