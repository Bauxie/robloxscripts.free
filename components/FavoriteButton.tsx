"use client";

import { useEffect, useState } from "react";
import { useToast } from "@/components/ToastProvider";

export default function FavoriteButton({
  scriptId,
  canFavorite,
}: {
  scriptId: string;
  canFavorite: boolean;
}) {
  const toast = useToast();
  const [on, setOn] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!canFavorite) return;
    fetch(`/api/favorites?scriptId=${encodeURIComponent(scriptId)}`)
      .then(async (res) => {
        if (!res.ok) return;
        const data = await res.json();
        const list = data.favorites || [];
        setOn(list.some((s: { id: string }) => s.id === scriptId));
      })
      .catch(() => {});
  }, [scriptId, canFavorite]);

  async function toggle() {
    if (!canFavorite) {
      toast("Log in to save favorites", true);
      return;
    }
    setBusy(true);
    try {
      if (on) {
        const res = await fetch(`/api/favorites?scriptId=${encodeURIComponent(scriptId)}`, {
          method: "DELETE",
        });
        if (!res.ok) throw new Error("Failed");
        setOn(false);
        toast("Removed from favorites");
      } else {
        const res = await fetch("/api/favorites", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ scriptId }),
        });
        if (!res.ok) throw new Error("Failed");
        setOn(true);
        toast("Saved to favorites ⭐");
      }
    } catch {
      toast("Couldn’t update favorite", true);
    } finally {
      setBusy(false);
    }
  }

  return (
    <button
      type="button"
      className={`btn btn-ghost${on ? " is-liked" : ""}`}
      onClick={toggle}
      disabled={busy}
    >
      {on ? "⭐ Saved" : "☆ Save"}
    </button>
  );
}
