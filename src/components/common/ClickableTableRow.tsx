"use client";

import { useRouter } from "next/navigation";

export function ClickableTableRow({
  href,
  className,
  children,
}: {
  href: string;
  className?: string;
  children: React.ReactNode;
}) {
  const router = useRouter();

  function isInteractiveTarget(target: EventTarget | null) {
    return target instanceof Element
      ? Boolean(target.closest("a, button, input, select, textarea, [role='button']"))
      : false;
  }

  return (
    <tr
      className={`cursor-pointer ${className ?? ""}`}
      role="link"
      tabIndex={0}
      onMouseEnter={() => router.prefetch(href)}
      onFocus={() => router.prefetch(href)}
      onClick={(event) => {
        if (!isInteractiveTarget(event.target)) router.push(href);
      }}
      onKeyDown={(event) => {
        if (event.target !== event.currentTarget) return;
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          router.push(href);
        }
      }}
    >
      {children}
    </tr>
  );
}
