export default function ModalLoading() {
  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 sm:items-center sm:p-4"
      role="status"
      aria-live="polite"
    >
      <div className="flex min-h-40 w-full max-w-4xl items-center justify-center rounded-t-2xl border border-black/10 bg-background p-6 shadow-xl sm:rounded-2xl dark:border-white/10">
        <div className="flex items-center gap-3 text-sm text-subtext">
          <span className="h-5 w-5 animate-spin rounded-full border-2 border-primary/25 border-t-primary" />
          상세 정보를 불러오는 중입니다.
        </div>
      </div>
    </div>
  );
}
