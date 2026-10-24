"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import type { Messages } from "@/lib/i18n";
import type { Locale } from "@/lib/routes";
import { routes } from "@/lib/routes";

export function Header({ locale, m }: { locale: Locale; m: Messages["nav"] }) {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const toggle = useRef<HTMLButtonElement>(null);
  const nav = useRef<HTMLElement>(null);
  const pathname = usePathname();
  const other: Locale = locale === "id" ? "en" : "id";
  const swapped = pathname.replace(/^\/(id|en)/, `/${other}`);
  const base = `/${locale}`;

  useEffect(() => {
    const on = () => setScrolled(window.scrollY > 12);
    on();
    window.addEventListener("scroll", on, { passive: true });
    return () => window.removeEventListener("scroll", on);
  }, []);

  useEffect(() => {
    document.body.classList.toggle("menu-open", open);
    if (!open) return;
    // F-09: Escape closes and returns focus to the toggle; Tab stays inside the open menu.
    const key = (e: KeyboardEvent) => {
      if (e.key === "Escape") { setOpen(false); toggle.current?.focus(); return; }
      if (e.key !== "Tab") return;
      const list = [toggle.current, ...Array.from(nav.current?.querySelectorAll<HTMLElement>("a") ?? [])].filter(Boolean) as HTMLElement[];
      const first = list[0], last = list[list.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    };
    document.addEventListener("keydown", key);
    return () => { document.removeEventListener("keydown", key); document.body.classList.remove("menu-open"); };
  }, [open]);

  const close = () => setOpen(false);
  const links: [string, string][] = [
    [`${base}#about`, m.about], [`${base}#ministries`, m.ministries], [`${base}#journey`, m.journey],
    [`${base}#stories`, m.stories], [`${base}#partner`, m.partner],
  ];
  const lang = (cls: string) => (
    <Link className={cls} href={swapped} hrefLang={other} lang={other} aria-label={m.switchTo} onClick={close}>
      {locale.toUpperCase()} <span>/ {other.toUpperCase()}</span>
    </Link>
  );

  return (
    <header className={`site-header${scrolled ? " is-scrolled" : ""}`}>
      <div className="container nav-wrap">
        <Link className="brand" href={base} aria-label={m.home} onClick={close}>
          <Image src="/assets/site/eunike-logo.png" alt="Yayasan Eunike" width={126} height={141} style={{ height: "auto" }} priority />
        </Link>

        <button ref={toggle} className="menu-toggle" type="button" aria-expanded={open} aria-controls="main-nav" onClick={() => setOpen((v) => !v)}>
          <span /><span /><span />
          <span className="sr-only">{open ? m.closeMenu : m.menu}</span>
        </button>

        <nav ref={nav} className={`main-nav${open ? " is-open" : ""}`} id="main-nav" aria-label={m.primary}>
          {links.map(([href, label]) => <a key={href} href={href} onClick={close}>{label}</a>)}
          {/* F-15: language, Masuk and CTA live in the menu at phone width */}
          {lang("nav-mobile-only lang-pill")}
          <Link className="nav-mobile-only nav-login" href={routes.login} onClick={close}>{m.login}</Link>
          <a className="nav-mobile-only nav-cta" href={`${base}#contact`} onClick={close}>{m.connect}</a>
        </nav>

        <div className="nav-actions">
          {lang("lang-pill")}
          <Link className="button button-sm button-ghost" href={routes.login}>{m.login}</Link>
          <a className="button button-sm button-primary" href={`${base}#contact`}>{m.connect}</a>
        </div>
      </div>
    </header>
  );
}
