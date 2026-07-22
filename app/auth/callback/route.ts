import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  let next = searchParams.get("next") || "/profile";
  if (!next.startsWith("/")) next = "/profile";

  const forwardedHost = request.headers.get("x-forwarded-host");
  const isLocal = process.env.NODE_ENV === "development";
  const redirectOrigin =
    !isLocal && forwardedHost ? `https://${forwardedHost}` : origin;

  const url = (process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || "")
    .trim()
    .replace(/\/$/, "");
  const anon = (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "").trim();

  if (code && url && anon) {
    // Cookies must be set on this redirect response or the session is lost.
    const response = NextResponse.redirect(`${redirectOrigin}${next}`);

    const supabase = createServerClient(url, anon, {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            response.cookies.set(name, value, options);
          });
        },
      },
    });

    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return response;
    }

    console.error("auth callback exchange failed:", error.message);
    return NextResponse.redirect(
      `${redirectOrigin}/login?error=${encodeURIComponent(error.message)}`
    );
  }

  return NextResponse.redirect(`${redirectOrigin}/login?error=auth`);
}
