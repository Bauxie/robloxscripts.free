import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { getAnonKey, getSupabaseUrl } from "@/lib/supabase/admin";

export function createServerSupabase() {
  const cookieStore = cookies();

  return createServerClient(getSupabaseUrl(), getAnonKey(), {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options);
          });
        } catch {
          // Called from a Server Component — middleware will refresh cookies.
        }
      },
    },
  });
}
