import { redirect } from "next/navigation";
import { getCurrentProfile } from "@/lib/auth";
import UploadForm from "@/components/UploadForm";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export const metadata = {
  title: "Upload — robloxscripts.free",
};

export default async function UploadPage() {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/login?next=/upload");

  return <UploadForm username={profile.username} />;
}
