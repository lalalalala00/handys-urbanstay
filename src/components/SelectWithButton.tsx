"use client";

export function SelectWithButton({
  value,
  onChange,
  options,
  placeholder,
  buttonLabel,
  onSubmit,
  disabled,
  variant = "primary",
}: {
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string }[];
  placeholder: string;
  buttonLabel: string;
  onSubmit: () => void;
  disabled?: boolean;
  variant?: "primary" | "secondary";
}) {
  const buttonClass =
    variant === "primary"
      ? "bg-foreground text-background"
      : "border border-black/10 dark:border-white/10";

  return (
    <div className="flex flex-wrap items-center gap-2">
      <select
        className="min-w-0 flex-1 rounded border border-black/10 bg-transparent px-3 py-1.5 text-sm dark:border-white/10"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      >
        <option value="">{placeholder}</option>
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
      <button
        disabled={disabled ?? !value}
        onClick={onSubmit}
        className={`shrink-0 rounded px-2 py-2 text-xs disabled:opacity-40 ${buttonClass}`}
      >
        {buttonLabel}
      </button>
    </div>
  );
}
