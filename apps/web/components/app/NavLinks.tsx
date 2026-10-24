"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { NavItem, SubItem } from "@/lib/nav";
import { findRoute } from "@/lib/roles";

/** One highlighted item: the module the current path belongs to (from the access table). */
const isActive = (pathname: string, item: NavItem) => findRoute(pathname)?.module === item.module;
const subPrefix = (pathname: string, subs: Record<string, SubItem[]>) => Object.keys(subs).filter((p) => pathname === p || pathname.startsWith(p + "/")).sort((a, b) => b.length - a.length)[0];
const subActive = (pathname: string, href: string, all: SubItem[]) => {
  // the longest matching sibling wins so /sk/admin (dasbor) is not lit on /sk/admin/hadir
  const best = all.filter((i) => pathname === i.href || pathname.startsWith(i.href + "/")).sort((a, b) => b.href.length - a.href.length)[0];
  return best?.href === href;
};

export function SideNav({ items, subs, label }: { items: NavItem[]; subs: Record<string, SubItem[]>; label: string }) {
  const p = usePathname();
  const prefix = subPrefix(p, subs);
  const list = prefix ? subs[prefix] : null;
  return (
    <nav aria-label={label} style={{ display: "contents" }}>
      {items.map((i) => {
        const active = isActive(p, i);
        return (
          <div key={i.module} style={{ display: "contents" }}>
            <Link href={i.href} className="side-link" aria-current={active && !list ? "page" : undefined}>
              <span aria-hidden="true">{i.icon}</span> {i.label}
            </Link>
            {active && list ? (
              <div className="side-sub">
                {list.map((s) => (
                  <Link key={s.href} href={s.href} aria-current={subActive(p, s.href, list) ? "page" : undefined}>{s.label}</Link>
                ))}
              </div>
            ) : null}
          </div>
        );
      })}
    </nav>
  );
}

export function BottomNav({ sk, eu, modules, label }: { sk: SubItem[]; eu: SubItem[]; modules: NavItem[]; label: string }) {
  const p = usePathname();
  const inSk = p === "/sk/keluarga" || p.startsWith("/sk/keluarga/");
  const inEu = p === "/beranda" || p.startsWith("/beranda/");
  const items: { href: string; label: string; icon: string; on: boolean }[] =
    inSk && sk.length > 1 ? sk.map((i) => ({ ...i, on: p === i.href || (i.href !== "/sk/keluarga" && p.startsWith(i.href + "/")) }))
    : inEu && eu.length > 1 ? eu.map((i) => ({ ...i, on: p === i.href || (i.href !== "/beranda" && p.startsWith(i.href + "/")) }))
    : modules.map((m) => ({ href: m.href, label: m.label, icon: m.icon, on: isActive(p, m) }));
  return (
    <nav className="bnav" aria-label={label}>
      {items.map((i) => (
        <Link key={i.href} href={i.href} aria-current={i.on ? "page" : undefined}>
          <span className="ic" aria-hidden="true">{i.icon}</span>
          {i.label}
        </Link>
      ))}
    </nav>
  );
}
