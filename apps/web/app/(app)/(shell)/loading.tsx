import { appMessages } from "@/lib/i18n";

/** Shown while a page in the app loads (slow first request, cold server). */
export default function Loading() {
  return (
    <div className="page-narrow" role="status" aria-live="polite">
      <p className="dev-opening"><span className="spin" aria-hidden="true" /> {appMessages().login.loading}</p>
    </div>
  );
}
