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

    const mime = file.type || "application/octet-stream";
    if (!ALLOWED.has(mime)) {
      return fail("Use a JPG, PNG, WebP, or GIF image.", 400);
    }
    if (file.size > MAX_BYTES) {
      return fail("Image must be under 2 MB.", 400);
    }

    const ext = extFor(mime);
    const path = `${user.id}/avatar.${ext}`;
    const buffer = Buffer.from(await file.arrayBuffer());

    const { error: uploadError } = await supabase.storage.from("avatars").upload(path, buffer, {
      contentType: mime,
      upsert: true,
      cacheControl: "3600",
    });
    if (uploadError) return fail(uploadError.message, 400);

    const { data: pub } = supabase.storage.from("avatars").getPublicUrl(path);
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
