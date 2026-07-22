import { nanoid } from "nanoid";
import { getAdminClient } from "@/lib/supabase/admin";

export async function createNotification(input: {
  userId: string;
  kind: string;
  title: string;
  body?: string;
  href?: string | null;
}) {
  if (!input.userId) return;
  const admin = getAdminClient();
  await admin.from("notifications").insert({
    id: nanoid(12),
    user_id: input.userId,
    kind: input.kind,
    title: input.title.slice(0, 120),
    body: (input.body || "").slice(0, 300),
    href: input.href || null,
  });
}
