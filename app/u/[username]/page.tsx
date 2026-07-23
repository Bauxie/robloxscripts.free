import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import {
  getProfileByUsername,
  listScripts,
  publicView,
} from "@/lib/store";
import { enrichScriptViews } from "@/lib/thumbnails";
import { normalizeRoles } from "@/lib/roles";
import ScriptCard from "@/components/ScriptCard";
import RoleBadges from "@/components/RoleBadges";
import FollowButton from "@/components/FollowButton";
import ReportButton from "@/components/ReportButton";
import { getCurrentProfile } from "@/lib/auth";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type PageProps = { params: { username: string } };

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const profile = await getProfileByUsername(params.username);
  if (!profile) return { title: "User not found" };
  return {
    title: `@${profile.username}`,
    description: profile.bio || `Scripts by @${profile.username} on robloxscripts.free`,
  };
}

export default async function PublicProfilePage({ params }: PageProps) {
  const profile = await getProfileByUsername(params.username);
  if (!profile) notFound();

  const me = await getCurrentProfile().catch(() => null);
  const scripts = await enrichScriptViews(
    (await listScripts({ userId: profile.id as string, sort: "new" })).map((s) => publicView(s))
  );
  const views = scripts.reduce((a, s) => a + (s.views || 0), 0);
  const likes = scripts.reduce((a, s) => a + (s.likes || 0), 0);
  const roles = normalizeRoles(profile.roles);
  const isSelf = me?.id === profile.id;
  const canFollow = Boolean(me && !isSelf);

  return (
    <main className="app">
      <Link href="/scripts" className="back-link">
        ← Scripts
      </Link>

      <div className="panel" style={{ marginBottom: 28 }}>
        <div className="detail-head profile-hero">
          <div className="profile-hero-main">
            <div className="profile-avatar-lg">
              {profile.avatar_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={profile.avatar_url as string} alt="" width={120} height={120} />
              ) : (
                <span aria-hidden>{String(profile.username)[0]?.toUpperCase() || "?"}</span>
              )}
            </div>
            <div>
              <span className="eyebrow">Creator</span>
              <div className="profile-name-row">
                <h1>@{profile.username as string}</h1>
                <RoleBadges roles={roles} size="lg" />
              </div>
              {profile.bio ? <p className="profile-bio">{profile.bio as string}</p> : null}
              <p className="detail-sub">
                {scripts.length} script{scripts.length === 1 ? "" : "s"} · {views} views · {likes}{" "}
                likes
              </p>
            </div>
          </div>
          <div className="detail-cta">
            {isSelf ? (
              <Link href="/profile" className="btn btn-primary">
                Edit profile
              </Link>
            ) : (
              <>
                <FollowButton userId={profile.id as string} canFollow={canFollow} />
                <ReportButton targetType="user" targetId={profile.id as string} label="Report user" />
              </>
            )}
          </div>
        </div>
      </div>

      <div className="section-head" style={{ marginTop: 0 }}>
        <div>
          <h2>📜 Scripts</h2>
          <p>Published by @{profile.username as string}</p>
        </div>
      </div>

      {scripts.length ? (
        <div className="grid">
          {scripts.map((s) => (
            <ScriptCard key={s.id} s={s} />
          ))}
        </div>
      ) : (
        <div className="empty">
          <div className="big">🏝️</div>
          <h3>No scripts yet</h3>
        </div>
      )}
    </main>
  );
}
