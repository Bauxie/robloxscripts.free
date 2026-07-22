-- Roles / badges for profiles
-- Run in Supabase SQL Editor after profile_settings.sql

alter table public.profiles
  add column if not exists roles text[] not null default '{}';

create index if not exists profiles_roles_gin_idx
  on public.profiles using gin (roles);

-- Optional: seed yourself as owner (replace bauix with your username)
-- update public.profiles
-- set roles = array['owner']
-- where lower(username) = 'bauix';
