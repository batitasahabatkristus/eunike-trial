"use client";

import { useFormStatus } from "react-dom";

export interface PersonaOption { id: string; name: string; roles: string }

/** Fake-persona buttons. Once one is pressed the whole grid dims and says who is being opened, because the first load can take several seconds. */
export function DevLoginGrid({ personas, openingText }: { personas: PersonaOption[]; openingText: string }) {
  const { pending, data } = useFormStatus();
  const chosen = pending ? personas.find((p) => p.id === data?.get("persona")) : undefined;
  return (
    <>
      <div className="dev-grid" aria-busy={pending}>
        {personas.map((p) => (
          <button key={p.id} name="persona" value={p.id} disabled={pending} className={chosen?.id === p.id ? "dev-chosen" : undefined}>
            {p.name}
            <small>{p.roles}</small>
          </button>
        ))}
      </div>
      <p className="dev-opening" role="status" aria-live="polite" hidden={!pending}>
        <span className="spin" aria-hidden="true" /> {chosen ? openingText.replace("{name}", chosen.name) : ""}
      </p>
    </>
  );
}
