import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getCurrentProfile } from "@/lib/auth";
import { getScript, publicView } from "@/lib/store";
import EditScriptForm from "@/components/EditScriptForm";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export const metadata = {
  title: "Edit script — robloxscripts.free",
};

export default async function EditScriptPage({ params }: { params: { id: string } }) {
  const profile = await getCurrentProfile();
  if (!profile) redirect(`/login?next=/script/${params.id}/edit`);

  const script = await getScript(params.id);
  if (!script) notFound();
  if (script.userId !== profile.id) redirect(`/script/${params.id}`);

  return (
    <main className="app">
      <Link href={`/script/${params.id}`} className="back-link">
        ← Back to script
      </Link>
      <EditScriptForm script={publicView(script, true)} />
    </main>
  );
}
