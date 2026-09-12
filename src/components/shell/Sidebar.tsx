"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Divider, Fleuron } from "@/components/ui/Ornament";

const NAV = [
  { href: "/", label: "Chat" },
  { href: "/today", label: "Today" },
  { href: "/library", label: "Library" },
  { href: "/insights", label: "Insights" },
  { href: "/settings", label: "Settings" },
] as const;

/** Chapters are numbered the way a book numbers them. */
const ROMAN = ["I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX"];

export function Sidebar() {
  const pathname = usePathname();
  return (
    <aside className="sidebar">
      <div>
        <Link href="/" className="font-display block text-[56px] leading-none tracking-tight text-ink">
          Rali
        </Link>
        <p className="label tagline mt-5 leading-[1.7]">
          A quieter
          <br />
          way forward
        </p>
        <Divider className="mt-9" />
      </div>

      <nav className="mt-8 flex flex-col gap-1" aria-label="Primary">
        {NAV.map((item, i) => {
          const active = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
          return (
            <Link key={item.href} href={item.href} className="nav-item" aria-current={active ? "page" : undefined}>
              <span className="num">{ROMAN[i]}</span>
              <span className="name">{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="sidebar-foot mt-auto">
        <Divider />
        <p className="font-display mt-7 text-[22px] italic leading-[1.35] text-ink-soft">
          Progress
          <br />
          lives here.
        </p>
        <Fleuron className="mt-6" />
      </div>
    </aside>
  );
}
