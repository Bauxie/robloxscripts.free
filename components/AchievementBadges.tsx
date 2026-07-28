import type { Achievement } from "@/lib/achievements";

export default function AchievementBadges({ achievements }: { achievements: Achievement[] }) {
  if (!achievements.length) return null;
  return (
    <div className="achievement-row" aria-label="Achievements">
      {achievements.map((a) => (
        <span key={a.id} className="achievement-chip" title={a.desc}>
          <span aria-hidden>{a.icon}</span> {a.name}
        </span>
      ))}
    </div>
  );
}
