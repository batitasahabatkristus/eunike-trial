"use server";

import { z } from "zod";
import { clientIp, rateLimit } from "@/lib/rate-limit";
import { createAdminClient } from "@/lib/supabase/admin";
import { supabaseConfigured } from "@/lib/env";

export type ContactState = { status: "idle" | "ok" | "invalid" | "error" | "rate_limited" };

const contactSchema = z.object({
  name: z.string().trim().min(2).max(120),
  contact: z.string().trim().min(5).max(160),
  message: z.string().trim().min(5).max(4000),
});

export async function sendContact(_prev: ContactState, form: FormData): Promise<ContactState> {
  // Honeypot: bots fill the hidden field. Answer "ok" so they learn nothing.
  if (String(form.get("website") ?? "") !== "") return { status: "ok" };

  const parsed = contactSchema.safeParse({
    name: form.get("name"),
    contact: form.get("contact"),
    message: form.get("message"),
  });
  if (!parsed.success) return { status: "invalid" };

  const ip = await clientIp();
  if (!(await rateLimit(`contact:${ip}`, 5, 3600))) return { status: "rate_limited" };

  if (!supabaseConfigured()) return { status: "ok" }; // local preview: nothing is stored, nothing is logged

  const { error } = await createAdminClient().from("contact_messages").insert(parsed.data);
  return { status: error ? "error" : "ok" };
}
