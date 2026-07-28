# Security audit — July 28, 2026

Scope: every route in `app/api/**`, auth/profile/store libs, upload handling, redirects, CSP headers, and dependency versions. Fixes were applied directly; details below.

---

## Fixed

### 1. Voter identity leak — `GET /api/scripts/[id]/votes` (privacy, medium)

**Before:** the endpoint returned the raw `script_votes` rows, including `user_id`, to anyone — no login required. Any visitor could scrape which users voted "works"/"broken" on which scripts and build activity profiles of your users.

**Fix:** the query no longer selects `user_id`, and the response now contains only the aggregated `byExecutor` counts. The UI (`CompatVotes`) only ever used the aggregates, so nothing breaks.

### 2. Follow spam / notification bombing — `POST /api/follows` (abuse, medium)

**Before:** no rate limit, no check that the target user exists, and a notification was created on *every* request — including repeat follows of the same user. A logged-in attacker could flood any user's notification inbox indefinitely with a loop of follow requests, or insert junk rows for nonexistent user IDs.

**Fix:**
- Rate limit: 30 follow actions per user per hour.
- Target profile must exist (404 otherwise).
- Notification fires only when the follow is actually new — re-follows return success silently without notifying.

### 3. Copy-counter inflation — `POST /api/scripts/[id]/copy` (integrity, low)

**Before:** unauthenticated and unlimited — anyone could inflate a script's "copies" stat with a loop, gaming rankings and popularity display.

**Fix:** rate-limited to 10 increments per IP per script per 5 minutes. (View counts have the same theoretical weakness via `GET /api/scripts/[id]`; noted under Recommendations.)

---

## New attack surface reviewed (social links feature)

The social-links system added this week was built with these protections:

- **Link injection:** users can't store arbitrary URLs. Every value is validated and normalized **server-side** (`normalizeSocialLink`) to a canonical URL on an allowlisted host (github.com, gitlab.com, youtube.com, roblox.com, open.spotify.com, discord.gg/discord.com). `javascript:` URLs, lookalike domains, and open-redirect paths are impossible to store.
- **SSRF in the stats endpoint (`GET /api/social/stats`):** the server never fetches a user-supplied URL. Input is re-validated through the same normalizer, then only the extracted handle/ID is interpolated into hard-coded API hostnames. Outbound requests have a 5s timeout.
- **Abuse:** stats responses are cached (in-memory 10 min + CDN `s-maxage=600`), and cache misses are rate-limited to 60/IP per 5 minutes, so the endpoint can't be used to relay traffic at third-party APIs.
- **Rel attributes:** outbound profile links render with `rel="noopener noreferrer nofollow ugc"` — no tab-napping, no SEO abuse of your domain authority.
- **DB constraint:** `social_links` jsonb is capped at 2 KB per profile, and length/limits are enforced in the API regardless of client.

---

## Reviewed and found solid (no change needed)

- **Auth & authorization:** every mutating route checks `supabase.auth.getUser()`; staff routes go through `requireRoleManager()`/`canModerate()`; script edit/delete verifies ownership; the roles route prevents removing the last Owner and non-owners touching the Owner role.
- **XSS:** the only `dangerouslySetInnerHTML` uses are JSON-LD (with `<` escaped) and the Lua highlighter, which HTML-escapes all input before inserting highlight spans. React escapes everything else (comments, bios, usernames).
- **Avatar upload:** magic-byte sniffing (not just Content-Type), 2 MB cap, storage policies restrict writes to the user's own folder.
- **Open redirect:** `safeNextPath` blocks protocol-relative/scheme-smuggled paths; `safeRequestOrigin` ignores `X-Forwarded-Host` in production.
- **Headers:** CSP, `X-Frame-Options: DENY`, `nosniff`, `Referrer-Policy`, `Permissions-Policy` all present in `next.config.mjs`.
- **Rate limiting:** already present on uploads, edits, comments, votes, reports, DMCA.
- **Secrets:** service-role key is server-only (never `NEXT_PUBLIC_`), admin client fails closed in production without it.
- **File download:** `Content-Disposition` filename is sanitized against header injection.

---

## Recommendations (not yet done)

1. **Upgrade Next.js 14 → 15.5.x.** Next 14 reached end of life in October 2025; 14.2.35 was its final patch. The May and July 2026 security releases (CVE-2026-64641 … 64649) were only patched in 15.5.21 / 16.2.11. I checked each 2026 CVE against this codebase — none clearly apply (they require Server Actions, Turbopack, `rewrites()`, or the image-optimization endpoint, none of which this app uses) — but staying on an EOL major means any future disclosure goes unpatched. The 14→15 migration touches async `params`/`cookies()` APIs across many pages, so it deserves its own tested change rather than being bundled here.
2. **View-count inflation:** `GET /api/scripts/[id]` increments views without limits. Same fix pattern as the copy counter if it starts being abused.
3. **Report/DMCA `select("*")`:** staff-only, but consider selecting explicit columns so future schema additions (e.g. internal fields) aren't automatically exposed to all moderators.
4. Consider `npm audit` in CI so dependency advisories surface at build time.

Sources: [Next.js July 2026 security release](https://nextjs.org/blog/july-2026-security-release), [Next.js EOL timeline](https://www.herodevs.com/blog-posts/nextjs-eol-dates-version-support-timeline), [Vercel May 2026 security release](https://vercel.com/changelog/next-js-may-2026-security-release)
