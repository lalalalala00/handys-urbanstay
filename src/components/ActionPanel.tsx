import { ActionIcon } from "@/components/icons";

export function ActionPanel({ children }: { children: React.ReactNode }) {
  return (
    <aside className="overflow-hidden rounded-xl border border-black/10 bg-white/80  backdrop-blur-sm dark:border-white/10 dark:bg-white/[0.03]">
      <div className="border-b border-black/10 bg-black/[0.02] px-5 py-4 dark:border-white/10 dark:bg-white/[0.03]">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <ActionIcon className="h-4 w-4" />
          </div>

          <div>
            <h2 className="text-sm font-semibold">이슈 처리</h2>
            <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">
              배정부터 처리 완료까지 관리합니다.
            </p>
          </div>
        </div>
      </div>

      <div className="divide-y divide-black/10 dark:divide-white/10">
        {children}
      </div>
    </aside>
  );
}

export function ActionSection({
  number,
  title,
  description,
  children,
}: {
  number: number;
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="px-5 py-5">
      <div className="mb-4 flex flex-col items-start gap-3">
        <div className="flex">
          <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
            {number}
          </div>
          <div className="flex flex-col ml-2">
            <h3 className="text-sm font-semibold">{title}</h3>
            {description && (
              <p className="text-xs mt-0.5 leading-4 text-gray-500 dark:text-gray-400">
                {description}
              </p>
            )}
          </div>
        </div>
      </div>

      <div className="">{children}</div>
    </section>
  );
}

export function ActionDivider() {
  return <hr className="border-black/10 dark:border-white/10" />;
}
