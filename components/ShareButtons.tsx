"use client";

import { useToast } from "@/components/ToastProvider";

export default function ShareButtons({
  title,
  url,
}: {
  title: string;
  url: string;
}) {
  const toast = useToast();
  const full = typeof window !== "undefined" ? url : url;

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(full);
      toast("Link copied");
    } catch {
      toast("Couldn’t copy link", true);
    }
  }

  const discordShare = `https://discord.com/channels/@me`;

  return (
    <div className="share-row">
      <button type="button" className="btn btn-ghost btn-sm" onClick={copyLink}>
        🔗 Copy link
      </button>
      <a
        className="btn btn-ghost btn-sm"
        href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(title)}&url=${encodeURIComponent(full)}`}
        target="_blank"
        rel="noopener noreferrer"
      >
        Share ↗
      </a>
      <button
        type="button"
        className="btn btn-ghost btn-sm"
        onClick={() => {
          copyLink();
          window.open(discordShare, "_blank", "noopener,noreferrer");
          toast("Link copied — paste it in Discord");
        }}
      >
        Discord
      </button>
    </div>
  );
}
