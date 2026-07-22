-- Run this in the Supabase SQL Editor (Dashboard → SQL → New query)
-- Project: robloxscripts.free

create table if not exists public.scripts (
  id text primary key,
  title text not null,
  description text not null default '',
  author text not null default 'Anonymous',
  game text not null default '',
  game_place_id text,
  tags text[] not null default '{}',
  code text not null,
  views integer not null default 0,
  copies integer not null default 0,
  likes integer not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists scripts_created_at_idx on public.scripts (created_at desc);
create index if not exists scripts_views_idx on public.scripts (views desc);
create index if not exists scripts_copies_idx on public.scripts (copies desc);
create index if not exists scripts_likes_idx on public.scripts (likes desc);
create index if not exists scripts_game_idx on public.scripts (game);
create index if not exists scripts_game_place_id_idx
  on public.scripts (game_place_id)
  where game_place_id is not null;

-- Server uses the service role key, which bypasses RLS.
-- Keep RLS on so the anon key cannot write freely if it ever leaks to the client.
alter table public.scripts enable row level security;

-- Optional: allow public read with the anon key (useful later for client fetches)
drop policy if exists "Public read scripts" on public.scripts;
create policy "Public read scripts"
  on public.scripts
  for select
  to anon, authenticated
  using (true);
