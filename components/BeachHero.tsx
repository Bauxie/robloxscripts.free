"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";

// fading glowing dots scattered over the water
const SPARKLES = [
  { left: "20%", top: "66%", delay: "0s" },
  { left: "34%", top: "72%", delay: "1.1s" },
  { left: "48%", top: "63%", delay: "2.2s" },
  { left: "60%", top: "70%", delay: "0.6s" },
  { left: "72%", top: "66%", delay: "1.7s" },
  { left: "84%", top: "72%", delay: "2.6s" },
  { left: "28%", top: "78%", delay: "3.1s" },
  { left: "66%", top: "78%", delay: "1.4s" },
  { left: "42%", top: "58%", delay: "2.0s" },
  { left: "78%", top: "60%", delay: "0.9s" },
];

// canopy frond angles (degrees) fanning out from the crown
const FRONDS = [-168, -134, -102, -72, -44, -14, 22, 58];

function Palm({ idSuffix, className }: { idSuffix: string; className?: string }) {
  return (
    <svg
      className={`palm-svg ${className ?? ""}`}
      viewBox="0 0 200 300"
      preserveAspectRatio="xMidYMax meet"
      aria-hidden="true"
    >
      <defs>
        <linearGradient id={`trunk-${idSuffix}`} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#8a5a2b" />
          <stop offset="0.5" stopColor="#c08a4d" />
          <stop offset="1" stopColor="#754a23" />
        </linearGradient>
        <linearGradient id={`leaf-${idSuffix}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#5fd884" />
          <stop offset="1" stopColor="#2a9a52" />
        </linearGradient>
      </defs>

      <path
        d="M84,298 C78,232 76,164 95,116 C104,94 111,82 114,70"
        fill="none"
        stroke={`url(#trunk-${idSuffix})`}
        strokeWidth="15"
        strokeLinecap="round"
      />

      <circle cx="104" cy="74" r="7.5" fill="#6b4a2a" />
      <circle cx="122" cy="78" r="7.5" fill="#6b4a2a" />
      <circle cx="113" cy="86" r="7.5" fill="#5e4024" />

      <g transform="translate(114,70)">
        {FRONDS.map((a) => (
          <g key={a} transform={`rotate(${a})`}>
            <path
              d="M0,0 C42,-13 88,-9 122,10 C90,3 44,5 0,7 Z"
              fill={`url(#leaf-${idSuffix})`}
            />
            <path
              d="M2,3 C40,-1 82,1 118,12"
              fill="none"
              stroke="#1f7d40"
              strokeWidth="1.4"
              opacity="0.5"
            />
          </g>
        ))}
      </g>
    </svg>
  );
}

export default function BeachHero({
  scriptCount,
  viewCount,
  topGames = [],
}: {
  scriptCount: number;
  viewCount: number;
  topGames?: { name: string; count: number }[];
}) {
  const router = useRouter();
  const [q, setQ] = useState("");

  function onSearch(e: FormEvent) {
    e.preventDefault();
    const query = q.trim();
    router.push(query ? `/scripts?q=${encodeURIComponent(query)}` : "/scripts");
  }

  return (
    <section className="hero">
      <div className="hero-scene" aria-hidden="true">
        <div className="sun" />
        <div className="cloud cloud-1" />
        <div className="cloud cloud-2" />
        <div className="cloud cloud-3" />
        <div className="bird bird-1" />
        <div className="bird bird-2" />
        <div className="bird bird-3" />

        <div className="ocean">
          <svg className="wave wave-back" viewBox="0 0 1440 220" preserveAspectRatio="none">
            <path d="M0,96 C240,160 480,32 720,96 C960,160 1200,32 1440,96 L1440,220 L0,220 Z" />
          </svg>
          <svg className="wave wave-mid" viewBox="0 0 1440 220" preserveAspectRatio="none">
            <path d="M0,120 C240,64 480,176 720,120 C960,64 1200,176 1440,120 L1440,220 L0,220 Z" />
          </svg>
          <svg className="wave wave-front" viewBox="0 0 1440 220" preserveAspectRatio="none">
            <path d="M0,150 C180,110 360,190 540,150 C720,110 900,190 1080,150 C1260,110 1440,190 1440,150 L1440,220 L0,220 Z" />
          </svg>
          <div className="foam" />
        </div>

        <div className="sea-shimmer" />

        <div className="sparkles">
          {SPARKLES.map((s, i) => (
            <i key={i} style={{ left: s.left, top: s.top, animationDelay: s.delay }} />
          ))}
        </div>

        <div className="beach">
          {/* umbrellas */}
          <div className="umbrella umbrella-a">
            <span className="umb-canopy" />
            <span className="umb-pole" />
          </div>
          <div className="umbrella umbrella-b">
            <span className="umb-canopy" />
            <span className="umb-pole" />
          </div>

          {/* towels */}
          <div className="towel towel-a" />
          <div className="towel towel-b" />

          {/* sand castles */}
          <div className="sandcastle sandcastle-a">
            <span className="keep" />
            <span className="tower tower-l" />
            <span className="tower tower-r" />
            <span className="door" />
            <span className="flag" />
          </div>
          <div className="sandcastle sandcastle-b">
            <span className="keep" />
            <span className="tower tower-l" />
            <span className="tower tower-r" />
            <span className="door" />
            <span className="flag" />
          </div>

          {/* seagulls on the sand */}
          <div className="seagull seagull-a" />
          <div className="seagull seagull-b" />
          <div className="seagull seagull-c" />

          <div className="ball" />
          <div className="starfish" />
          <div className="shell" />
        </div>

        <Palm idSuffix="a" className="palm-a" />
        <Palm idSuffix="b" className="palm-b" />
      </div>

      <div className="hero-content">
        <span className="pill">🏄 Cartoon script hub — free forever</span>
        <h1>
          Find &amp; share <span className="grad">Roblox scripts</span>
          <br />
          on a funnier shore.
        </h1>
        <p className="lead">
          Search by game, copy the code, and run it in your executor. Bright, bouncy, and built for
          the community.
        </p>

        <form className="hero-search" onSubmit={onSearch} role="search">
          <span aria-hidden="true">🔎</span>
          <input
            type="search"
            placeholder="Search games, scripts, authors…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            aria-label="Search scripts"
          />
          <button type="submit" className="btn btn-primary btn-sm">
            Search
          </button>
        </form>

        {topGames.length > 0 ? (
          <div className="game-chips">
            {topGames.map((g) => (
              <Link
                key={g.name}
                href={`/scripts?q=${encodeURIComponent(g.name)}`}
                className="chip"
              >
                🎮 {g.name}
                <span className="chip-count">{g.count}</span>
              </Link>
            ))}
          </div>
        ) : null}

        <div className="hero-actions">
          <Link href="/upload" className="btn btn-primary btn-lg">
            ＋ Upload a script
          </Link>
          <Link href="/scripts" className="btn btn-ghost btn-lg">
            Browse scripts
          </Link>
        </div>
        <div className="hero-stats">
          <div>
            <b>{scriptCount}</b>
            <span>scripts</span>
          </div>
          <div>
            <b>{viewCount}</b>
            <span>views</span>
          </div>
          <div>
            <b>100%</b>
            <span>free</span>
          </div>
        </div>
      </div>
    </section>
  );
}
