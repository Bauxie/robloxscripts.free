import { Suspense } from "react";
import AuthForm from "@/components/AuthForm";

export const metadata = {
  title: "Log in — robloxscripts.free",
};

export default function LoginPage() {
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
      <AuthForm mode="login" />
    </Suspense>
  );
}
