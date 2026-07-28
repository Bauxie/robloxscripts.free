-- Social links on profiles (GitHub, GitLab, YouTube, Roblox, Discord, Spotify)
-- Run in Supabase SQL Editor after profile_settings.sql

alter table public.profiles
  add column if not exists social_links jsonb not null default '{}'::jsonb;

-- Keep the payload small; per-platform validation happens in the app.
alter table public.profiles
  drop constraint if exists profiles_social_links_size;

alter table public.profiles
  add constraint profiles_social_links_size
  check (pg_column_size(social_links) <= 2048);
