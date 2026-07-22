import { Suspense } from "react";
import AuthForm from "@/components/AuthForm";

export const metadata = {
  title: "Sign up — robloxscripts.free",
};

export default function SignupPage() {
  return (
    <Suspense
      fallback={
        <main className="app">
          <div className="loading">
            <div className="spinner" />
            Loading…
          </div>
        </main>
      }
    >
      <AuthForm mode="signup" />
    </Suspense>
  );
}
