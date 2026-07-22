import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentProfile } from "@/lib/auth";
import { listScripts, publicView } from "@/lib/store";
import { enrichScriptViews } from "@/lib/thumbnails";
import ScriptCard from "@/components/ScriptCard";
import LogoutButton from "@/components/LogoutButton";
import ProfileSettings from "@/components/ProfileSettings";
import RoleBadges from "@/components/RoleBadges";
import { canModerate } from "@/lib/roles";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export const metadata = {
  title: "My profile — robloxscripts.free",
};

export default async function ProfilePage() {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/login?next=/profile");

  const mine = await enrichScriptViews(
    (await listScripts({ userId: profile.id, sort: "new" })).map((s) => publicView(s))
  );
  const views = mine.reduce((a, s) => a + (s.views || 0), 0);
  const likes = mine.reduce((a, s) => a + (s.likes || 0), 0);

  return (
    <main className="app">
      <Link href="/" className="back-link">
        ← Home
      </Link>

      <div className="panel" style={{ marginBottom: 28 }}>
        <div className="detail-head profile-hero">
          <div className="profile-hero-main">
            <div className="profile-avatar-lg">
              {profile.avatar_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={profile.avatar_url} alt="" width={120} height={120} />
              ) : (
                <span aria-hidden>{(profile.username[0] || "?").toUpperCase()}</span>
              )}
            </div>
            <div>
              <span className="eyebrow">Your shore</span>
              <div className="profile-name-row">
                <h1>@{profile.username}</h1>
                <RoleBadges roles={profile.roles} size="lg" />
              </div>
              {profile.bio ? <p className="profile-bio">{profile.bio}</p> : null}
              <p className="detail-sub">
                {mine.length} script{mine.length === 1 ? "" : "s"} · {views} views · {likes} likes
              </p>
            </div>
          </div>
          <div className="detail-cta">
            <Link
              href={`/u/${encodeURIComponent(profile.username)}`}
              className="btn btn-ghost"
            >
              Public profile
            </Link>
            {canModerate(profile.roles) ? (
              <Link href="/admin" className="btn btn-ghost">
                Admin
              </Link>
            ) : null}
            <Link href="/upload" className="btn btn-primary">
              ＋ Upload
            </Link>
            <LogoutButton />
          </div>
        </div>
      </div>

      <ProfileSettings profile={profile} />

      <div className="section-head" style={{ marginTop: 0 }}>
        <div>
          <h2>📜 My scripts</h2>
          <p>Edit or delete anything you’ve published.</p>
        </div>
      </div>

      {mine.length ? (
        <div className="grid">
          {mine.map((s) => (
            <ScriptCard key={s.id} s={s} manage />
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
