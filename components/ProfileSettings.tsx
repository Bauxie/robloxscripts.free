"use client";

import { FormEvent, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import type { Profile } from "@/lib/profile";
import {
  USERNAME_COOLDOWN_DAYS,
  formatCooldown,
  normalizeUsername,
  usernameCooldownRemaining,
  validateUsername,
} from "@/lib/profile";
import { useToast } from "@/components/ToastProvider";
import AvatarCropModal from "@/components/AvatarCropModal";

export default function ProfileSettings({ profile }: { profile: Profile }) {
  const router = useRouter();
  const toast = useToast();
  const fileRef = useRef<HTMLInputElement>(null);

  const [username, setUsername] = useState(profile.username);
  const [bio, setBio] = useState(profile.bio || "");
  const [avatarUrl, setAvatarUrl] = useState(profile.avatar_url);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [cropSrc, setCropSrc] = useState<string | null>(null);

  const remaining = useMemo(() => usernameCooldownRemaining(profile), [profile]);
  const canChangeUsername = remaining <= 0;
  const usernameDirty = normalizeUsername(username) !== profile.username;

  async function saveProfile(e: FormEvent) {
    e.preventDefault();
    setError("");

    const nextUser = normalizeUsername(username);
    const invalid = validateUsername(nextUser);
    if (invalid) return setError(invalid);

    setBusy(true);
    try {
      const res = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: nextUser,
          bio,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Could not save profile");
      toast("Profile updated ✨");
      setUsername(data.profile.username);
      setBio(data.profile.bio || "");
      router.refresh();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  function onAvatarPick(file?: File | null) {
    if (!file) return;
    setError("");
    if (!file.type.startsWith("image/")) {
      setError("Choose an image file.");
      return;
    }
    if (file.size > 8 * 1024 * 1024) {
      setError("Image must be under 8 MB before cropping.");
      return;
    }
    const url = URL.createObjectURL(file);
    setCropSrc(url);
    if (fileRef.current) fileRef.current.value = "";
  }

  function closeCrop() {
    if (cropSrc) URL.revokeObjectURL(cropSrc);
    setCropSrc(null);
  }

  async function uploadCropped(blob: Blob) {
    setBusy(true);
    try {
      const fd = new FormData();
      fd.set("avatar", new File([blob], "avatar.png", { type: "image/png" }));
      const res = await fetch("/api/profile/avatar", { method: "POST", body: fd });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Upload failed");
      setAvatarUrl(data.profile.avatar_url);
      toast("Profile picture updated 📸");
      closeCrop();
      router.refresh();
    } catch (err) {
      setError((err as Error).message);
      throw err;
    } finally {
      setBusy(false);
    }
  }

  async function removeAvatar() {
    setError("");
    setBusy(true);
    try {
      const res = await fetch("/api/profile/avatar", { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Could not remove photo");
      setAvatarUrl(null);
      toast("Profile picture removed");
      router.refresh();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="panel profile-settings" style={{ marginBottom: 28 }}>
      <div className="section-head" style={{ marginTop: 0 }}>
        <div>
          <span className="eyebrow">Customize</span>
          <h2>Profile settings</h2>
          <p>
            Update your look and handle — username can change once every {USERNAME_COOLDOWN_DAYS}{" "}
            days.
          </p>
        </div>
      </div>

      <div className="profile-edit-grid">
        <div className="profile-avatar-block">
          <div className="profile-avatar-lg">
            {avatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={avatarUrl} alt="" width={120} height={120} />
            ) : (
              <span aria-hidden>{(profile.username[0] || "?").toUpperCase()}</span>
            )}
          </div>
          <div className="profile-avatar-actions">
            <button
              type="button"
              className="btn btn-primary btn-sm"
              disabled={busy}
              onClick={() => fileRef.current?.click()}
            >
              Upload photo
            </button>
            {avatarUrl ? (
              <button
                type="button"
                className="btn btn-ghost btn-sm"
                disabled={busy}
                onClick={removeAvatar}
              >
                Remove
              </button>
            ) : null}
            <input
              ref={fileRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              hidden
              onChange={(e) => onAvatarPick(e.target.files?.[0])}
            />
            <div className="hint">Crop &amp; zoom after picking · saved as a circle</div>
          </div>
        </div>

        <form className="form-grid" onSubmit={saveProfile}>
          <div>
            <label htmlFor="profile-username">Username</label>
            <div className="username-field">
              <span className="username-prefix">@</span>
              <input
                id="profile-username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                maxLength={32}
                autoComplete="username"
                disabled={busy || !canChangeUsername}
              />
            </div>
            <div className="hint">
              {canChangeUsername
                ? usernameDirty
                  ? "Saving will start a 7-day cooldown."
                  : "Letters, numbers, and underscores."
                : `Username locked for ${formatCooldown(remaining)}.`}
            </div>
          </div>

          <div>
            <label htmlFor="profile-bio">Bio</label>
            <textarea
              id="profile-bio"
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              maxLength={160}
              rows={3}
              placeholder="A short line about you…"
              disabled={busy}
            />
            <div className="hint">{bio.length}/160</div>
          </div>

          {error ? <p className="form-error">{error}</p> : null}

          <div className="form-actions">
            <button type="submit" className="btn btn-primary" disabled={busy}>
              {busy ? "Saving…" : "Save profile"}
            </button>
          </div>
        </form>
      </div>

      {cropSrc ? (
        <AvatarCropModal imageSrc={cropSrc} onCancel={closeCrop} onCropped={uploadCropped} />
      ) : null}
    </div>
  );
}
