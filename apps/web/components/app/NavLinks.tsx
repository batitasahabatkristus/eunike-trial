"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { NavItem } from "@/lib/nav";
import { findRoute } from "@/lib/roles";

/** One highlighted item: the module the current path belongs to (from the access table). */
const isActive = (pathname: string, item: NavItem) => findRoute(pathname)?.module === item.module;

export function SideNav({ items, label }: { items: NavItem[]; label: string }) {
  const p = usePathname();
  return (
    <nav aria-label={label} style={{ display: "contents" }}>
      {items.map((i) => (
        <Link key={i.module} href={i.href} className="side-link" aria-current={isActive(p, i) ? "page" : undefined}>
          <span aria-hidden="true">{i.icon}</span> {i.label}
        </Link>
      ))}
    </nav>
  );
}

export function BottomNav({ items, label }: { items: NavItem[]; label: string }) {
  const p = usePathname();
  return (
    <nav className="bnav" aria-label={label}>
      {items.map((i) => (
        <Link key={i.module} href={i.href} aria-current={isActive(p, i) ? "page" : undefined}>
          <span className="ic" aria-hidden="true">{i.icon}</span>
          {i.label}
        </Link>
      ))}
    </nav>
  );
}
