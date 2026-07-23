"use client";

import { useEffect, useState } from "react";

type Sponsor = {
  id: string;
  name: string;
  tagline: string;
  url: string;
  image_url: string | null;
};

export default function SponsorSlots({ placement = "executors" }: { placement?: string }) {
  const [sponsors, setSponsors] = useState<Sponsor[]>([]);

  useEffect(() => {
    fetch(`/api/sponsors?placement=${encodeURIComponent(placement)}`)
      .then(async (res) => {
        if (!res.ok) return;
        const data = await res.json();
        setSponsors(data.sponsors || []);
      })
      .catch(() => {});
  }, [placement]);

  if (!sponsors.length) return null;

  return (
    <div className="sponsor-row">
      <span className="eyebrow">Sponsored</span>
      <div className="sponsor-grid">
        {sponsors.map((s) => (
          <a
            key={s.id}
            className="sponsor-card"
            href={s.url}
            target="_blank"
            rel="noopener noreferrer sponsored"
          >
            {s.image_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={s.image_url} alt="" width={48} height={48} />
            ) : null}
            <div>
              <strong>{s.name}</strong>
              <span>{s.tagline}</span>
            </div>
          </a>
        ))}
      </div>
    </div>
  );
}
