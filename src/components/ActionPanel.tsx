import { ActionIcon } from "@/components/icons";

export function ActionPanel({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-5 rounded-lg border border-black/10 p-5 dark:border-white/10">
      <div className="flex items-center gap-1.5 text-sm font-medium">
        <ActionIcon className="h-4 w-4 text-primary" />
        처리 (Action)
      </div>
      {children}
    </div>
  );
}

export function ActionDivider() {
  return <hr className="border-black/10 dark:border-white/10" />;
}
