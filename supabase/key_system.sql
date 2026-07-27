-- Key system flag on scripts
-- Run in Supabase SQL Editor

alter table public.scripts
  add column if not exists key_system boolean not null default false;

create index if not exists scripts_key_system_idx
  on public.scripts (key_system)
  where key_system = true;
