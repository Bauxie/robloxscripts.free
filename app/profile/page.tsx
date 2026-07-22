import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentProfile } from "@/lib/auth";
import { listScripts, publicView } from "@/lib/store";
import ScriptCard from "@/components/ScriptCard";
import LogoutButton from "@/components/LogoutButton";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export const metadata = {
  title: "My scripts — robloxscripts.free",
};

export default async function ProfilePage() {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/login?next=/profile");

  const mine = await listScripts({ userId: profile.id, sort: "new" });
  const views = mine.reduce((a, s) => a + (s.views || 0), 0);

  return (
    <main className="app">
      <Link href="/" className="back-link">
        ← Home
      </Link>

      <div className="panel" style={{ marginBottom: 28 }}>
        <div className="detail-head">
          <div>
            <span className="eyebrow">Your shore</span>
            <h1>@{profile.username}</h1>
            <p className="detail-sub">
              {mine.length} script{mine.length === 1 ? "" : "s"} · {views} total views
            </p>
          </div>
          <div className="detail-cta">
            <Link href="/upload" className="btn btn-primary">
              ＋ Upload
            </Link>
            <LogoutButton />
          </div>
        </div>
      </div>

      <div className="section-head" style={{ marginTop: 0 }}>
        <div>
          <h2>📜 My scripts</h2>
          <p>Everything you’ve published while logged in.</p>
        </div>
      </div>

      {mine.length ? (
        <div className="grid">
          {mine.map((s) => (
            <ScriptCard key={s.id} s={publicView(s)} />
          ))}
        </div>
      ) : (
        <div className="empty">
          <div className="big">🏝️</div>
          <h3>No scripts yet</h3>
          <p>Upload your first one and it’ll show up here.</p>
          <Link href="/upload" className="btn btn-primary" style={{ marginTop: 16 }}>
            ＋ Upload a script
          </Link>
        </div>
      )}
    </main>
  );
}
