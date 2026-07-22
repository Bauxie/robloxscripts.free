import { redirect } from "next/navigation";
import { getCurrentProfile } from "@/lib/auth";
import { canManageRoles } from "@/lib/roles";
import AdminPanel from "@/components/AdminPanel";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export const metadata = {
  title: "Admin — robloxscripts.free",
};

export default async function AdminPage() {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/login?next=/admin");
  if (!canManageRoles(profile.roles)) redirect("/");

  return <AdminPanel actorRoles={profile.roles} />;
}
