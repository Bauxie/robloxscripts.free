import { createServerSupabase } from "@/lib/supabase/server";

export type Profile = {
  id: string;
  username: string;
  avatar_url: string | null;
  created_at: string;
};

export async function getSessionUser() {
  const supabase = createServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
}

export async function getCurrentProfile(): Promise<Profile | null> {
  const supabase = createServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data, error } = await supabase
    .from("profiles")
    .select("id, username, avatar_url, created_at")
    .eq("id", user.id)
    .maybeSingle();

  if (error) throw new Error(error.message);
  return data as Profile | null;
}
