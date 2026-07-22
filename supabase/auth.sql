-- Auth + profiles migration for robloxscripts.free
-- Run in Supabase SQL Editor after schema.sql

-- Profiles (1:1 with auth.users)
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  username text not null,
  avatar_url text,
  created_at timestamptz not null default now(),
  constraint profiles_username_len check (char_length(username) between 2 and 32)
);

create unique index if not exists profiles_username_lower_idx
  on public.profiles (lower(username));

alter table public.profiles enable row level security;

drop policy if exists "Public read profiles" on public.profiles;
create policy "Public read profiles"
  on public.profiles for select
  to anon, authenticated
  using (true);

drop policy if exists "Users update own profile" on public.profiles;
create policy "Users update own profile"
  on public.profiles for update
  to authenticated
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  base_name text;
  candidate text;
  suffix int := 0;
begin
  base_name := coalesce(
    nullif(trim(new.raw_user_meta_data->>'full_name'), ''),
    nullif(trim(new.raw_user_meta_data->>'name'), ''),
    nullif(trim(new.raw_user_meta_data->>'preferred_username'), ''),
    nullif(split_part(new.email, '@', 1), ''),
    'user'
  );
  base_name := regexp_replace(lower(base_name), '[^a-z0-9_]+', '_', 'g');
  base_name := trim(both '_' from base_name);
  if base_name = '' or char_length(base_name) < 2 then
    base_name := 'user';
  end if;
  base_name := left(base_name, 24);

  candidate := base_name;
  while exists (select 1 from public.profiles where lower(username) = lower(candidate)) loop
    suffix := suffix + 1;
    candidate := left(base_name, 24) || suffix::text;
  end loop;

  insert into public.profiles (id, username, avatar_url)
  values (
    new.id,
    candidate,
    nullif(new.raw_user_meta_data->>'avatar_url', '')
  );
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Link scripts to users
alter table public.scripts
  add column if not exists user_id uuid references auth.users (id) on delete set null;

create index if not exists scripts_user_id_idx on public.scripts (user_id);

-- RLS: authenticated users can insert their own scripts
drop policy if exists "Authenticated insert own scripts" on public.scripts;
create policy "Authenticated insert own scripts"
  on public.scripts for insert
  to authenticated
  with check (auth.uid() = user_id);

-- Keep public read (from schema.sql); re-assert here safely
drop policy if exists "Public read scripts" on public.scripts;
create policy "Public read scripts"
  on public.scripts for select
  to anon, authenticated
  using (true);
