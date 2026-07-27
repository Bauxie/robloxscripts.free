import { ImageResponse } from "next/og";
import { getScript } from "@/lib/store";

export const runtime = "nodejs";
export const alt = "Roblox script on robloxscripts.free";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function ScriptOgImage({ params }: { params: { id: string } }) {
  let title = "Roblox script";
  let game = "";
  let author = "";
  let views = 0;
  let likes = 0;

  try {
    const s = await getScript(params.id);
    if (s) {
      title = s.title || title;
      game = s.game || "";
      author = s.author || "";
      views = s.views || 0;
      likes = s.likes || 0;
    }
  } catch {
    // fall back to defaults
  }

  const clampedTitle = title.length > 80 ? `${title.slice(0, 77)}…` : title;

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background: "linear-gradient(180deg, #7fd8ff 0%, #cbeeff 100%)",
          fontFamily: "sans-serif",
          padding: 64,
        }}
      >
        {/* Top bar: brand + game chip */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", fontSize: 34, fontWeight: 800, color: "#1a2f3d" }}>
            robloxscripts<span style={{ color: "#0a6f96" }}>.free</span>
          </div>
          {game ? (
            <div
              style={{
                display: "flex",
                fontSize: 26,
                fontWeight: 700,
                color: "#1a2f3d",
                background: "#ffe6b0",
                border: "4px solid #1a2f3d",
                borderRadius: 14,
                padding: "8px 20px",
              }}
            >
              🎮 {game.length > 28 ? `${game.slice(0, 25)}…` : game}
            </div>
          ) : null}
        </div>

        {/* Title card */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            background: "#fff8ec",
            border: "8px solid #1a2f3d",
            borderRadius: 24,
            boxShadow: "12px 12px 0 #1a2f3d",
            padding: "44px 52px",
          }}
        >
          <div
            style={{
              fontSize: 68,
              fontWeight: 800,
              color: "#1a2f3d",
              lineHeight: 1.05,
              letterSpacing: -1,
              display: "flex",
            }}
          >
            {clampedTitle}
          </div>
          <div style={{ marginTop: 26, display: "flex", gap: 16, alignItems: "center" }}>
            {author ? (
              <div style={{ display: "flex", fontSize: 28, fontWeight: 700, color: "#4a6674" }}>
                by @{author}
              </div>
            ) : null}
            <div
              style={{
                display: "flex",
                fontSize: 26,
                fontWeight: 700,
                color: "#1a2f3d",
              }}
            >
              👁 {views.toLocaleString()} · ❤️ {likes.toLocaleString()}
            </div>
          </div>
        </div>

        {/* Bottom callout */}
        <div
          style={{
            display: "flex",
            fontSize: 30,
            fontWeight: 700,
            color: "#0a6f96",
          }}
        >
          Free to copy &amp; run — robloxscripts.free
        </div>
      </div>
    ),
    size
  );
}
