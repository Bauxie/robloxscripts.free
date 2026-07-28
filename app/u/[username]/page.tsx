import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import {
  getFollowCounts,
  getProfileByUsername,
  listScripts,
  listUserComments,
  publicView,
} from "@/lib/store";
import { enrichScriptViews } from "@/lib/thumbnails";
import { normalizeRoles } from "@/lib/roles";
import { fmtCompact } from "@/lib/format";
import RoleBadges from "@/components/RoleBadges";
import FollowButton from "@/components/FollowButton";
import ReportButton from "@/components/ReportButton";
import ProfileTabs, { type ProfileTabId } from "@/components/ProfileTabs";
import SocialLinksRow from "@/components/SocialLinks";
import { parseSocialLinks } from "@/lib/profile";
import { getCurrentProfile } from "@/lib/auth";
import { profilePath } from "@/lib/profilePath";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type PageProps = {
  params: { username: string };
  searchParams?: { tab?: string };
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const profile = await getProfileByUsername(params.username);
  if (!profile) return { title: "User not found" };
  const path = profilePath(String(profile.username));
  return {
    title: `@${profile.username}`,
    description: profile.bio || `Scripts by @${profile.username} on robloxscripts.free`,
    alternates: { canonical: path },
  };
}

function parseTab(raw?: string): ProfileTabId {
  if (raw === "activity" || raw === "statistics") return raw;
  return "scripts";
}

export default async function PublicProfilePage({ params, searchParams }: PageProps) {
  const profile = await getProfileByUsername(params.username);
  if (!profile) notFound();

  const me = await getCurrentProfile().catch(() => null);
  const scripts = await enrichScriptViews(
    (await listScripts({ userId: profile.id as string, sort: "new" })).map((s) => publicView(s))
  );

  const [follows, activity] = await Promise.all([
    getFollowCounts(profile.id as string).catch(() => ({ followers: 0, following: 0 })),
    listUserComments(profile.id as string, 50).catch(() => []),
  ]);

  const views = scripts.reduce((a, s) => a + (s.views || 0), 0);
  const likes = scripts.reduce((a, s) => a + (s.likes || 0), 0);
  const copies = scripts.reduce((a, s) => a + (s.copies || 0), 0);
  const works = scripts.reduce((a, s) => a + (s.worksCount || 0), 0);
  const broken = scripts.reduce((a, s) => a + (s.brokenCount || 0), 0);
  const roles = normalizeRoles(profile.roles);
  const isSelf = me?.id === profile.id;
  const canFollow = Boolean(me && !isSelf);
  const username = String(profile.username);

  return (
    <main className="app">
      <Link href="/scripts" className="back-link">
        ← Scripts
      </Link>

      <div className="panel" style={{ marginBottom: 20 }}>
        <div className="detail-head profile-hero">
          <div className="profile-hero-main">
            <div className="profile-avatar-lg">
              {profile.avatar_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={profile.avatar_url as string} alt="" width={120} height={120} />
              ) : (
                <span aria-hidden>{username[0]?.toUpperCase() || "?"}</span>
              )}
            </div>
            <div>
              <span className="eyebrow">Creator</span>
              <div className="profile-name-row">
                <h1>@{username}</h1>
                <RoleBadges roles={roles} size="lg" />
              </div>
              {profile.bio ? <p className="profile-bio">{profile.bio as string}</p> : null}
              <SocialLinksRow
                links={parseSocialLinks((profile as Record<string, unknown>).social_links)}
              />

              <p className="detail-sub">
                Joined{" "}
                {profile.created_at
                  ? new Date(profile.created_at as string).toLocaleDateString(undefined, {
                      month: "short",
                      year: "numeric",
                    })
                  : "—"}
                {" · "}
                {fmtCompact(views)} total views
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

      <ProfileTabs
        username={username}
        scripts={scripts}
        activity={activity}
        initialTab={parseTab(searchParams?.tab)}
        stats={{
          scripts: scripts.length,
          views,
          likes,
          copies,
          works,
          broken,
          followers: follows.followers,
          following: follows.following,
          memberSince: String(profile.created_at || ""),
          bio: String(profile.bio || ""),
        }}
      />
    </main>
  );
}
