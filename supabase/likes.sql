-- Add likes counter for scripts
-- Run in Supabase SQL Editor

alter table public.scripts
  add column if not exists likes integer not null default 0;

create index if not exists scripts_likes_idx on public.scripts (likes desc);
