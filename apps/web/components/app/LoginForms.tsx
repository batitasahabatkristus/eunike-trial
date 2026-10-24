"use client";

import { useActionState } from "react";
import { familyLogin, magicLink, type LoginState } from "@/app/(app)/masuk/actions";
import type { Messages } from "@/lib/i18n";

const init: LoginState = {};

function Banner({ state, m }: { state: LoginState; m: Messages["app"]["login"] }) {
  if (state.sent) return <p className="login-ok" role="status">{m.magicSent}</p>;
  if (state.error === "locked") return <p className="login-error" role="alert">{m.locked}</p>;
  if (state.error === "family") return <p className="login-error" role="alert">{m.familyError}</p>;
  if (state.error === "email") return <p className="login-error" role="alert">{m.emailError}</p>;
  return null;
}

export function FamilyForm({ m, next }: { m: Messages["app"]["login"]; next?: string }) {
  const [state, action, pending] = useActionState(familyLogin, init);
  return (
    <form action={action}>
      <h2 style={{ fontSize: "1.15rem" }}>{m.familyTitle}</h2>
      <p className="login-lead" style={{ textAlign: "left" }}>{m.familyHint}</p>
      <Banner state={state} m={m} />
      <input type="hidden" name="next" value={next ?? ""} />
      <div className="field">
        <label htmlFor="f-phone">{m.phone}</label>
        <input id="f-phone" name="phone" className="inp" inputMode="tel" autoComplete="tel" placeholder="0812…" required />
      </div>
      <div className="field">
        <label htmlFor="f-dob">{m.dob}</label>
        <input id="f-dob" name="dob" type="date" className="inp" required />
      </div>
      <button className="btn red block" disabled={pending}>{m.familySubmit}</button>
    </form>
  );
}

export function MagicForm({ m, next }: { m: Messages["app"]["login"]; next?: string }) {
  const [state, action, pending] = useActionState(magicLink, init);
  return (
    <details>
      <summary>{m.magicTitle}</summary>
      <form action={action}>
        <Banner state={state} m={m} />
        <input type="hidden" name="next" value={next ?? ""} />
        <div className="field">
          <label htmlFor="m-email">{m.email}</label>
          <input id="m-email" name="email" type="email" className="inp" autoComplete="email" required />
        </div>
        <button className="btn ghost block" disabled={pending}>{m.magicSubmit}</button>
      </form>
    </details>
  );
}
