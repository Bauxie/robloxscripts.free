import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { safeNextPath } from "@/lib/safeRedirect";

export async function updateSession(request: NextRequest) {
  const path = request.nextUrl.pathname;

  // Legacy /u/username → /@username
  const legacy = path.match(/^\/u\/([^/]+)\/?$/);
  if (legacy) {
    const url = request.nextUrl.clone();
    url.pathname = `/@${decodeURIComponent(legacy[1])}`;
    return NextResponse.redirect(url, 308);
  }

  // Public profiles: /@username → app route /u/[username]
  const atProfile = path.match(/^\/@([^/]+)\/?$/);
  const rewriteUrl = atProfile
    ? (() => {
        const url = request.nextUrl.clone();
        url.pathname = `/u/${decodeURIComponent(atProfile[1])}`;
        return url;
      })()
    : null;

  const makeResponse = () =>
    rewriteUrl
      ? NextResponse.rewrite(rewriteUrl, {
          request: { headers: request.headers },
        })
      : NextResponse.next({
          request: { headers: request.headers },
        });

  let response = makeResponse();

  const url = (process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || "")
    .trim()
    .replace(/\/$/, "");
  const anon = (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "").trim();
  if (!url || !anon) return response;

  const supabase = createServerClient(url, anon, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => {
          request.cookies.set(name, value);
        });
        response = makeResponse();
        cookiesToSet.forEach(({ name, value, options }) => {
          response.cookies.set(name, value, options);
        });
      },
    },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const needsAuth =
    path.startsWith("/upload") ||
    path.startsWith("/profile") ||
    path.startsWith("/admin") ||
    path.startsWith("/notifications") ||
    path.startsWith("/favorites") ||
    path.startsWith("/feed") ||
    /^\/script\/[^/]+\/edit\/?$/.test(path);

  if (needsAuth && !user) {
    const login = request.nextUrl.clone();
    login.pathname = "/login";
    login.searchParams.set("next", safeNextPath(path, "/profile"));
    return NextResponse.redirect(login);
  }

  if (user && (path === "/login" || path === "/signup")) {
    const home = request.nextUrl.clone();
    home.pathname = "/profile";
    home.search = "";
    return NextResponse.redirect(home);
  }

  return response;
}
