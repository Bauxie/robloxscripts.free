-- Feature pack: games SEO, favorites, follows, versions, votes, featured, DMCA, rate limits, sponsors
-- Run after security.sql

-- ---------- Script metadata ----------
alter table public.scripts
  add column if not exists updated_at timestamptz not null default now();

alter table public.scripts
  add column if not exists changelog text not null default '';

alter table public.scripts
  add column if not exists version integer not null default 1;

alter table public.scripts
  add column if not exists version_group text;

alter table public.scripts
  add column if not exists featured boolean not null default false;

alter table public.scripts
  add column if not exists staff_verified boolean not null default false;

alter table public.scripts
  add column if not exists works_count integer not null default 0;

alter table public.scripts
  add column if not exists broken_count integer not null default 0;

update public.scripts set version_group = id where version_group is null;

create index if not exists scripts_featured_idx on public.scripts (featured) where featured = true;
create index if not exists scripts_staff_verified_idx on public.scripts (staff_verified) where staff_verified = true;
create index if not exists scripts_updated_at_idx on public.scripts (updated_at desc);
create index if not exists scripts_version_group_idx on public.scripts (version_group);

-- Protect new counter / staff fields from client forge
create or replace function public.protect_script_fields()
returns trigger
language plpgsql
security invoker
set search_path = public
as $$
begin
  if coalesce(auth.role(), '') = 'service_role' then
    return new;
  end if;

  if new.views is distinct from old.views
     or new.likes is distinct from old.likes
     or new.copies is distinct from old.copies
     or new.works_count is distinct from old.works_count
     or new.broken_count is distinct from old.broken_count
     or new.featured is distinct from old.featured
     or new.staff_verified is distinct from old.staff_verified
     or new.user_id is distinct from old.user_id
     or new.id is distinct from old.id
     or new.created_at is distinct from old.created_at
  then
    raise exception 'protected script fields cannot be changed directly';
  end if;

  return new;
end;
$$;

-- ---------- Favorites ----------
create table if not exists public.favorites (
  user_id uuid not null references auth.users (id) on delete cascade,
  script_id text not null references public.scripts (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, script_id)
);

create index if not exists favorites_script_idx on public.favorites (script_id);

alter table public.favorites enable row level security;

drop policy if exists "Users manage own favorites" on public.favorites;
create policy "Users manage own favorites"
  on public.favorites for all
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- ---------- Follows ----------
create table if not exists public.follows (
  follower_id uuid not null references auth.users (id) on delete cascade,
  following_id uuid not null references auth.users (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (follower_id, following_id),
  constraint follows_no_self check (follower_id <> following_id)
);

create index if not exists follows_following_idx on public.follows (following_id);

alter table public.follows enable row level security;

drop policy if exists "Public read follows" on public.follows;
create policy "Public read follows"
  on public.follows for select
  to anon, authenticated
  using (true);

drop policy if exists "Users manage own follows" on public.follows;
create policy "Users manage own follows"
  on public.follows for all
  to authenticated
  using (auth.uid() = follower_id)
  with check (auth.uid() = follower_id);

-- ---------- Compat votes (works / broken per executor) ----------
create table if not exists public.script_votes (
  script_id text not null references public.scripts (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  executor_id text not null,
  vote text not null check (vote in ('works', 'broken')),
  created_at timestamptz not null default now(),
  primary key (script_id, user_id, executor_id)
);

create index if not exists script_votes_script_idx on public.script_votes (script_id);

alter table public.script_votes enable row level security;

drop policy if exists "Public read votes" on public.script_votes;
create policy "Public read votes"
  on public.script_votes for select
  to anon, authenticated
  using (true);

drop policy if exists "Users upsert own votes" on public.script_votes;
create policy "Users upsert own votes"
  on public.script_votes for insert
  to authenticated
  with check (auth.uid() = user_id);

drop policy if exists "Users update own votes" on public.script_votes;
create policy "Users update own votes"
  on public.script_votes for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "Users delete own votes" on public.script_votes;
create policy "Users delete own votes"
  on public.script_votes for delete
  to authenticated
  using (auth.uid() = user_id);

-- ---------- Version log ----------
create table if not exists public.script_versions (
  id text primary key,
  script_id text not null references public.scripts (id) on delete cascade,
  version integer not null,
  changelog text not null default '',
  created_at timestamptz not null default now(),
  user_id uuid references auth.users (id) on delete set null
);

create index if not exists script_versions_script_idx
  on public.script_versions (script_id, version desc);

alter table public.script_versions enable row level security;

drop policy if exists "Public read versions" on public.script_versions;
create policy "Public read versions"
  on public.script_versions for select
  to anon, authenticated
  using (true);

-- inserts via service role / authenticated owner through API

drop policy if exists "Owners insert versions" on public.script_versions;
create policy "Owners insert versions"
  on public.script_versions for insert
  to authenticated
  with check (
    exists (
      select 1 from public.scripts s
      where s.id = script_id and s.user_id = auth.uid()
    )
  );

-- ---------- Reports: staff notes ----------
alter table public.reports
  add column if not exists staff_notes text not null default '';

-- ---------- DMCA / takedown ----------
create table if not exists public.dmca_requests (
  id text primary key,
  name text not null,
  email text not null,
  urls text not null,
  details text not null default '',
  status text not null default 'open' check (status in ('open', 'resolved', 'dismissed')),
  created_at timestamptz not null default now(),
  constraint dmca_name_len check (char_length(name) between 2 and 120),
  constraint dmca_email_len check (char_length(email) between 5 and 200),
  constraint dmca_urls_len check (char_length(urls) between 5 and 4000),
  constraint dmca_details_len check (char_length(details) <= 4000)
);

alter table public.dmca_requests enable row level security;

drop policy if exists "Anyone insert dmca" on public.dmca_requests;
create policy "Anyone insert dmca"
  on public.dmca_requests for insert
  to anon, authenticated
  with check (true);

-- staff read via service role

-- ---------- Simple DB rate limits (works without Upstash) ----------
create table if not exists public.rate_limits (
  bucket text primary key,
  count integer not null default 0,
  window_start timestamptz not null default now()
);

alter table public.rate_limits enable row level security;
-- only service role should touch this (no policies for anon/auth)

-- ---------- Sponsors ----------
create table if not exists public.sponsors (
  id text primary key,
  name text not null,
  tagline text not null default '',
  url text not null,
  image_url text,
  placement text not null default 'executors'
    check (placement in ('executors', 'home', 'scripts')),
  active boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

alter table public.sponsors enable row level security;

drop policy if exists "Public read active sponsors" on public.sponsors;
create policy "Public read active sponsors"
  on public.sponsors for select
  to anon, authenticated
  using (active = true);
