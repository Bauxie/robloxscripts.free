-- Community features: comments, reports, notifications, executor tags, script edit/delete RLS
-- Run in Supabase SQL Editor after roles.sql

-- Executor tags on scripts
alter table public.scripts
  add column if not exists executors text[] not null default '{}';

create index if not exists scripts_executors_gin_idx
  on public.scripts using gin (executors);

-- Owners can update/delete their scripts
drop policy if exists "Users update own scripts" on public.scripts;
create policy "Users update own scripts"
  on public.scripts for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "Users delete own scripts" on public.scripts;
create policy "Users delete own scripts"
  on public.scripts for delete
  to authenticated
  using (auth.uid() = user_id);

-- Comments
create table if not exists public.comments (
  id text primary key,
  script_id text not null references public.scripts (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  body text not null,
  created_at timestamptz not null default now(),
  constraint comments_body_len check (char_length(body) between 1 and 1000)
);

create index if not exists comments_script_id_idx on public.comments (script_id, created_at desc);
create index if not exists comments_user_id_idx on public.comments (user_id);

alter table public.comments enable row level security;

drop policy if exists "Public read comments" on public.comments;
create policy "Public read comments"
  on public.comments for select
  to anon, authenticated
  using (true);

drop policy if exists "Users insert own comments" on public.comments;
create policy "Users insert own comments"
  on public.comments for insert
  to authenticated
  with check (auth.uid() = user_id);

drop policy if exists "Users delete own comments" on public.comments;
create policy "Users delete own comments"
  on public.comments for delete
  to authenticated
  using (auth.uid() = user_id);

-- Reports (scripts or users)
create table if not exists public.reports (
  id text primary key,
  reporter_id uuid not null references auth.users (id) on delete cascade,
  target_type text not null check (target_type in ('script', 'user', 'comment')),
  target_id text not null,
  reason text not null,
  details text not null default '',
  status text not null default 'open' check (status in ('open', 'resolved', 'dismissed')),
  created_at timestamptz not null default now(),
  resolved_at timestamptz,
  resolved_by uuid references auth.users (id) on delete set null,
  constraint reports_reason_len check (char_length(reason) between 2 and 80),
  constraint reports_details_len check (char_length(details) <= 1000)
);

create index if not exists reports_status_idx on public.reports (status, created_at desc);
create index if not exists reports_target_idx on public.reports (target_type, target_id);

alter table public.reports enable row level security;

drop policy if exists "Users insert reports" on public.reports;
create policy "Users insert reports"
  on public.reports for insert
  to authenticated
  with check (auth.uid() = reporter_id);

drop policy if exists "Users read own reports" on public.reports;
create policy "Users read own reports"
  on public.reports for select
  to authenticated
  using (auth.uid() = reporter_id);

-- Staff read/update via service role in API (bypasses RLS)

-- Notifications
create table if not exists public.notifications (
  id text primary key,
  user_id uuid not null references auth.users (id) on delete cascade,
  kind text not null,
  title text not null,
  body text not null default '',
  href text,
  read_at timestamptz,
  created_at timestamptz not null default now(),
  constraint notifications_title_len check (char_length(title) between 1 and 120),
  constraint notifications_body_len check (char_length(body) <= 300)
);

create index if not exists notifications_user_idx
  on public.notifications (user_id, created_at desc);

alter table public.notifications enable row level security;

drop policy if exists "Users read own notifications" on public.notifications;
create policy "Users read own notifications"
  on public.notifications for select
  to authenticated
  using (auth.uid() = user_id);

drop policy if exists "Users update own notifications" on public.notifications;
create policy "Users update own notifications"
  on public.notifications for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Inserts done with service role from API
