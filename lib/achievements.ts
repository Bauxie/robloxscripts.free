export type Achievement = {
  id: string;
  name: string;
  desc: string;
  icon: string;
};

type AchievementInput = {
  scripts: number;
  views: number;
  likes: number;
  copies: number;
  followers: number;
  memberSince: string;
};

/** Tiered families — only the highest earned tier in each family is shown. */
const FAMILIES: Array<Array<{ id: string; name: string; desc: string; icon: string; earned: (s: AchievementInput) => boolean }>> = [
  [
    { id: "scripts_25", name: "Script Factory", desc: "Uploaded 25 scripts", icon: "🏭", earned: (s) => s.scripts >= 25 },
    { id: "scripts_10", name: "Script Machine", desc: "Uploaded 10 scripts", icon: "📦", earned: (s) => s.scripts >= 10 },
    { id: "first_upload", name: "First Upload", desc: "Uploaded their first script", icon: "🚀", earned: (s) => s.scripts >= 1 },
  ],
  [
    { id: "views_100k", name: "100K Views", desc: "100,000 total script views", icon: "🌟", earned: (s) => s.views >= 100_000 },
    { id: "views_10k", name: "10K Views", desc: "10,000 total script views", icon: "🔥", earned: (s) => s.views >= 10_000 },
    { id: "views_1k", name: "1K Views", desc: "1,000 total script views", icon: "👁", earned: (s) => s.views >= 1_000 },
  ],
  [
    { id: "likes_1k", name: "Beloved", desc: "1,000 total likes", icon: "💖", earned: (s) => s.likes >= 1_000 },
    { id: "likes_100", name: "Crowd Favorite", desc: "100 total likes", icon: "❤️", earned: (s) => s.likes >= 100 },
  ],
  [
    { id: "copies_10k", name: "Everywhere", desc: "10,000 total copies", icon: "🌍", earned: (s) => s.copies >= 10_000 },
    { id: "copies_1k", name: "Widely Used", desc: "1,000 total copies", icon: "📋", earned: (s) => s.copies >= 1_000 },
  ],
  [
    { id: "followers_100", name: "Community Star", desc: "100 followers", icon: "🌊", earned: (s) => s.followers >= 100 },
    { id: "followers_10", name: "Rising Creator", desc: "10 followers", icon: "👥", earned: (s) => s.followers >= 10 },
  ],
  [
    {
      id: "veteran",
      name: "OG",
      desc: "Member for over a year",
      icon: "🏝️",
      earned: (s) =>
        Boolean(s.memberSince) &&
        Date.now() - +new Date(s.memberSince) >= 365 * 24 * 60 * 60 * 1000,
    },
  ],
];

export function computeAchievements(input: AchievementInput): Achievement[] {
  const out: Achievement[] = [];
  for (const family of FAMILIES) {
    const hit = family.find((a) => a.earned(input));
    if (hit) out.push({ id: hit.id, name: hit.name, desc: hit.desc, icon: hit.icon });
  }
  return out;
}
