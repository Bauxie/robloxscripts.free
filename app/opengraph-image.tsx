import { ImageResponse } from "next/og";

export const runtime = "nodejs";
export const alt = "robloxscripts.free — Upload & Share Roblox Scripts";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OgImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(180deg, #7fd8ff 0%, #a9e7ff 45%, #d6f4ff 100%)",
          fontFamily: "sans-serif",
          position: "relative",
        }}
      >
        {/* Sun */}
        <div
          style={{
            position: "absolute",
            top: 70,
            right: 90,
            width: 150,
            height: 150,
            borderRadius: 9999,
            background: "radial-gradient(circle at 35% 35%, #fff6c9, #ffd84d 55%, #ffb020)",
            border: "6px solid #1a2f3d",
          }}
        />
        {/* Sea band */}
        <div
          style={{
            position: "absolute",
            bottom: 0,
            left: 0,
            right: 0,
            height: 150,
            background: "linear-gradient(180deg, #35c1e0, #14a5cc)",
            borderTop: "8px solid #1a2f3d",
          }}
        />
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            background: "#fff8ec",
            border: "8px solid #1a2f3d",
            borderRadius: 28,
            boxShadow: "14px 14px 0 #1a2f3d",
            padding: "56px 72px",
            maxWidth: 960,
          }}
        >
          <div
            style={{
              fontSize: 74,
              fontWeight: 800,
              color: "#1a2f3d",
              letterSpacing: -2,
              display: "flex",
            }}
          >
            robloxscripts<span style={{ color: "#0a6f96" }}>.free</span>
          </div>
          <div
            style={{
              marginTop: 22,
              fontSize: 34,
              fontWeight: 700,
              color: "#4a6674",
              textAlign: "center",
              display: "flex",
            }}
          >
            Free Roblox scripts to copy, download &amp; share
          </div>
          <div
            style={{
              marginTop: 34,
              display: "flex",
              gap: 18,
            }}
          >
            {["Browse by game", "Copy & run", "Upload yours"].map((t) => (
              <div
                key={t}
                style={{
                  display: "flex",
                  fontSize: 24,
                  fontWeight: 700,
                  color: "#1a2f3d",
                  background: "#ffe6b0",
                  border: "4px solid #1a2f3d",
                  borderRadius: 14,
                  padding: "10px 20px",
                }}
              >
                {t}
              </div>
            ))}
          </div>
        </div>
      </div>
    ),
    size
  );
}
