import Link from "next/link";

const LINKS = [
  { href: "/", label: "대시보드" },
  { href: "/cleaning", label: "청소 작업" },
  { href: "/issues", label: "객실 이슈" },
];

export function NavBar() {
  return (
    <header className="border-b border-black/10 dark:border-white/10">
      <div className="mx-auto flex max-w-6xl items-center gap-6 px-6 py-4">
        <span className="text-sm font-semibold tracking-tight">
          Stay Operations Dashboard
        </span>
        <nav className="flex gap-4 text-sm">
          {LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-gray-500 transition-colors hover:text-foreground dark:text-gray-400"
            >
              {link.label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}
