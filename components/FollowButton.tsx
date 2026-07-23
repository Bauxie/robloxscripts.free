"use client";

import { useEffect, useState } from "react";
import { useToast } from "@/components/ToastProvider";

export default function FollowButton({
  userId,
  canFollow,
}: {
  userId: string;
  canFollow: boolean;
}) {
  const toast = useToast();
  const [on, setOn] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!canFollow) return;
    fetch("/api/follows")
      .then(async (res) => {
        if (!res.ok) return;
        const data = await res.json();
        setOn((data.followingIds || []).includes(userId));
      })
      .catch(() => {});
  }, [userId, canFollow]);

  async function toggle() {
    if (!canFollow) {
      toast("Log in to follow creators", true);
      return;
    }
    setBusy(true);
    try {
      if (on) {
        const res = await fetch(`/api/follows?userId=${encodeURIComponent(userId)}`, {
          method: "DELETE",
        });
        if (!res.ok) throw new Error("Failed");
        setOn(false);
        toast("Unfollowed");
      } else {
        const res = await fetch("/api/follows", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userId }),
        });
        if (!res.ok) throw new Error("Failed");
        setOn(true);
        toast("Following ✓");
      }
    } catch {
      toast("Couldn’t update follow", true);
    } finally {
      setBusy(false);
    }
  }

  if (!canFollow) return null;

  return (
    <button type="button" className="btn btn-primary" onClick={toggle} disabled={busy}>
      {on ? "Following" : "＋ Follow"}
    </button>
  );
}
