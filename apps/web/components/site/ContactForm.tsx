"use client";

import Link from "next/link";
import { useActionState } from "react";
import { sendContact, type ContactState } from "@/app/(public)/[locale]/actions";
import type { Messages } from "@/lib/i18n";
import type { Locale } from "@/lib/routes";

const initial: ContactState = { status: "idle" };

export function ContactForm({ locale, m }: { locale: Locale; m: Messages["contact"]["form"] }) {
  const [state, action, pending] = useActionState(sendContact, initial);
  const msg: Record<ContactState["status"], string> = { idle: "", ok: m.success, invalid: m.invalid, error: m.error, rate_limited: m.rateLimited };
  return (
    <form action={action} className="contact-form" noValidate aria-labelledby="contact-form-title">
      <h3 id="contact-form-title" style={{ fontSize: 24 }}>{m.title}</h3>
      <label>{m.name}<input name="name" autoComplete="name" required minLength={2} maxLength={120} /></label>
      <label>{m.contact}<input name="contact" autoComplete="email" required maxLength={160} /></label>
      <label>{m.message}<textarea name="message" required maxLength={4000} /></label>
      {/* Honeypot: hidden from people and assistive tech; bots fill it */}
      <div className="honeypot" aria-hidden="true"><label>Website<input name="website" tabIndex={-1} autoComplete="off" /></label></div>
      <p className="fine">{m.privacy} <Link href={`/${locale}/privasi`}>{m.privacyLink}</Link>.</p>
      <button className="button button-primary" type="submit" disabled={pending}>{pending ? m.sending : m.submit}</button>
      <p role="status" aria-live="polite" className={`form-status ${state.status === "ok" ? "ok" : "bad"}`}>{msg[state.status]}</p>
    </form>
  );
}
