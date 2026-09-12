"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV = [
  { href: "/", label: "Chat" },
  { href: "/today", label: "Today" },
  { href: "/library", label: "Library" },
  { href: "/insights", label: "Insights" },
  { href: "/settings", label: "Settings" },
] as const;

export function Sidebar() {
  const pathname = usePathname();
  return (
    <aside className="sidebar">
      <div>
        <Link href="/" className="font-display block text-[56px] leading-none tracking-tight text-ink">
          Lumen
        </Link>
        <p className="label tagline mt-5 leading-[1.7]">
          A quieter
          <br />
          way forward
        </p>
        <div className="rule-short mt-9" />
      </div>

      <nav className="mt-8 flex flex-col gap-1" aria-label="Primary">
        {NAV.map((item, i) => {
          const active = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
          return (
            <Link key={item.href} href={item.href} className="nav-item" aria-current={active ? "page" : undefined}>
              <span className="num">{String(i + 1).padStart(2, "0")}</span>
              <span className="name">{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="sidebar-foot mt-auto">
        <div className="rule-short" />
        <p className="font-display mt-7 text-[22px] italic leading-[1.35] text-ink-soft">
          Progress
          <br />
          lives here.
        </p>
        <div className="rule-short mt-7" />
      </div>
    </aside>
  );
}
