import { NextRequest, NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_BYTES = 2 * 1024 * 1024;
const ALLOWED = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);

function fail(error: unknown, status = 500) {
  const message = error instanceof Error ? error.message : String(error);
  return NextResponse.json({ error: message }, { status });
}

function extFor(mime: string): string {
  if (mime === "image/png") return "png";
  if (mime === "image/webp") return "webp";
  if (mime === "image/gif") return "gif";
  return "jpg";
}

function sniffImageMime(buf: Buffer): string | null {
  if (buf.length >= 3 && buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) {
    return "image/jpeg";
  }
  if (
    buf.length >= 8 &&
    buf[0] === 0x89 &&
    buf[1] === 0x50 &&
    buf[2] === 0x4e &&
    buf[3] === 0x47
  ) {
    return "image/png";
  }
  if (
    buf.length >= 6 &&
    buf[0] === 0x47 &&
    buf[1] === 0x49 &&
    buf[2] === 0x46 &&
    buf[3] === 0x38
  ) {
    return "image/gif";
  }
  if (
    buf.length >= 12 &&
    buf.toString("ascii", 0, 4) === "RIFF" &&
    buf.toString("ascii", 8, 12) === "WEBP"
  ) {
    return "image/webp";
  }
  return null;
}

// POST /api/profile/avatar — multipart file field "avatar"
export async function POST(req: NextRequest) {
  try {
    const supabase = createServerSupabase();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return fail("You must be logged in.", 401);

    const profile = await getCurrentProfile();
    if (!profile) return fail("Profile not found.", 404);

    const form = await req.formData();
    const file = form.get("avatar");
    if (!file || typeof file === "string") {
      return fail("Choose an image to upload.", 400);
    }

    if (file.size > MAX_BYTES) {
      return fail("Image must be under 2 MB.", 400);
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const sniffed = sniffImageMime(buffer);
    const claimed = file.type || "application/octet-stream";
    if (!sniffed || !ALLOWED.has(sniffed) || (ALLOWED.has(claimed) && claimed !== sniffed)) {
      // Allow claimed mismatch only if claimed is empty/octet-stream; otherwise require match
      if (!sniffed || !ALLOWED.has(sniffed)) {
        return fail("Use a JPG, PNG, WebP, or GIF image.", 400);
      }
      if (ALLOWED.has(claimed) && claimed !== sniffed) {
        return fail("Image type does not match file contents.", 400);
      }
    }
    const mime = sniffed;

    const ext = extFor(mime);
    const path = `${user.id}/avatar.${ext}`;
    // Prefer a stable png name when uploading cropped circle avatars
    const uploadPath = mime === "image/png" ? `${user.id}/avatar.png` : path;

    const { error: uploadError } = await supabase.storage.from("avatars").upload(uploadPath, buffer, {
      contentType: mime,
      upsert: true,
      cacheControl: "3600",
    });
    if (uploadError) return fail(uploadError.message, 400);

    const { data: pub } = supabase.storage.from("avatars").getPublicUrl(uploadPath);
    const avatarUrl = `${pub.publicUrl}?v=${Date.now()}`;

    const { data, error } = await supabase
      .from("profiles")
      .update({ avatar_url: avatarUrl })
      .eq("id", profile.id)
      .select("id, username, avatar_url, bio, created_at, username_changed_at")
      .single();

    if (error) return fail(error.message, 400);

    return NextResponse.json({
      profile: {
        ...data,
        bio: data.bio || "",
        username_changed_at: data.username_changed_at || null,
      },
    });
  } catch (e) {
    return fail(e);
  }
}

// DELETE /api/profile/avatar — clear avatar
export async function DELETE() {
  try {
    const supabase = createServerSupabase();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return fail("You must be logged in.", 401);

    const profile = await getCurrentProfile();
    if (!profile) return fail("Profile not found.", 404);

    // Best-effort remove common avatar filenames
    await supabase.storage.from("avatars").remove([
      `${user.id}/avatar.jpg`,
      `${user.id}/avatar.png`,
      `${user.id}/avatar.webp`,
      `${user.id}/avatar.gif`,
    ]);

    const { data, error } = await supabase
      .from("profiles")
      .update({ avatar_url: null })
      .eq("id", profile.id)
      .select("id, username, avatar_url, bio, created_at, username_changed_at")
      .single();

    if (error) return fail(error.message, 400);

    return NextResponse.json({
      profile: {
        ...data,
        bio: data.bio || "",
        username_changed_at: data.username_changed_at || null,
      },
    });
  } catch (e) {
    return fail(e);
  }
}
