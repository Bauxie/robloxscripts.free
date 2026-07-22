"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createBrowserSupabase } from "@/lib/supabase/client";

export default function AuthForm({ mode }: { mode: "login" | "signup" }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams.get("next") || "/profile";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const rawError = searchParams.get("error") || "";
  const [error, setError] = useState(
    rawError === "auth"
      ? "Sign-in didn’t finish. Try Discord again, or use email."
      : rawError
  );
  const [info, setInfo] = useState("");
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setInfo("");
    setBusy(true);
    try {
      const supabase = createBrowserSupabase();
      if (mode === "login") {
        const { error: err } = await supabase.auth.signInWithPassword({ email, password });
        if (err) throw err;
        router.push(next);
        router.refresh();
      } else {
        const origin = window.location.origin;
        const { data, error: err } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${origin}/auth/callback?next=${encodeURIComponent(next)}`,
          },
        });
        if (err) throw err;
        if (data.session) {
          router.push(next);
          router.refresh();
        } else {
          setInfo("Check your email to confirm your account, then log in.");
        }
      }
    } catch (err) {
      setError((err as Error).message || "Something went wrong");
    } finally {
      setBusy(false);
    }
  }

  async function signInWithDiscord() {
    setError("");
    setBusy(true);
    try {
      const supabase = createBrowserSupabase();
      const origin = window.location.origin;
      const { error: err } = await supabase.auth.signInWithOAuth({
        provider: "discord",
        options: {
          redirectTo: `${origin}/auth/callback?next=${encodeURIComponent(next)}`,
        },
      });
      if (err) throw err;
    } catch (err) {
      setError((err as Error).message || "Discord sign-in failed");
      setBusy(false);
    }
  }

  const isLogin = mode === "login";

  return (
    <main className="app">
      <Link href="/" className="back-link">
        ← Home
      </Link>
      <div className="panel panel-narrow auth-panel">
        <div className="section-head" style={{ marginTop: 0 }}>
          <div>
            <span className="eyebrow">{isLogin ? "Welcome back" : "Join the shore"}</span>
            <h2>{isLogin ? "Log in" : "Create account"}</h2>
            <p>
              {isLogin
                ? "Upload scripts and manage your profile."
                : "Sign up free — then share your scripts with the community."}
            </p>
          </div>
        </div>

        <button
          type="button"
          className="btn btn-ghost btn-lg auth-discord"
          onClick={signInWithDiscord}
          disabled={busy}
        >
          Continue with Discord
        </button>

        <div className="divider" style={{ margin: "18px 0" }}>
          or email
        </div>

        <form className="form-grid" onSubmit={onSubmit}>
          <div>
            <label>
              Email <span className="req">*</span>
            </label>
            <input
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@email.com"
            />
          </div>
          <div>
            <label>
              Password <span className="req">*</span>
            </label>
            <input
              type="password"
              autoComplete={isLogin ? "current-password" : "new-password"}
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={isLogin ? "Your password" : "At least 6 characters"}
            />
          </div>

          {error ? <p className="form-error">{error}</p> : null}
          {info ? <p className="hint" style={{ color: "var(--sea-deep)" }}>{info}</p> : null}

          <div className="form-actions">
            <button type="submit" className="btn btn-primary btn-lg" disabled={busy}>
              {busy ? "Please wait…" : isLogin ? "Log in" : "Sign up"}
            </button>
          </div>
        </form>

        <p className="auth-switch muted">
          {isLogin ? (
            <>
              No account?{" "}
              <Link href={`/signup?next=${encodeURIComponent(next)}`}>Sign up</Link>
            </>
          ) : (
            <>
              Already have an account?{" "}
              <Link href={`/login?next=${encodeURIComponent(next)}`}>Log in</Link>
            </>
          )}
        </p>
      </div>
    </main>
  );
}
