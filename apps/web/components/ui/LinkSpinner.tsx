"use client";

import { useLinkStatus } from "next/link";

/** Put inside a <Link>: shows a small spinner from the click until the next page has loaded. The page-level status text lives in (shell)/loading.tsx. */
export function LinkSpinner() {
  const { pending } = useLinkStatus();
  return pending ? <span className="spin spin-sm link-spin" aria-hidden="true" /> : null;
}
