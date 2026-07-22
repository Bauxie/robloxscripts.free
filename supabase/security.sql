-- Security hardening: lock privileged columns + unique likes
-- Run in Supabase SQL Editor after community.sql

-- ---------------------------------------------------------------------------
-- Profiles: users must not change roles (or other staff-only fields) via RLS
-- Service role (admin API) still can.
-- ---------------------------------------------------------------------------
create or replace function public.protect_profile_fields()
returns trigger
language plpgsql
security invoker
set search_path = public
as $$
begin
  if coalesce(auth.role(), '') = 'service_role' then
    return new;
  end if;

  if new.roles is distinct from old.roles then
    raise exception 'roles cannot be changed directly';
  end if;

  -- Keep id immutable
  if new.id is distinct from old.id then
    raise exception 'profile id cannot be changed';
  end if;

  return new;
end;
$$;

drop trigger if exists protect_profile_fields_trg on public.profiles;
create trigger protect_profile_fields_trg
  before update on public.profiles
  for each row
  execute function public.protect_profile_fields();

-- ---------------------------------------------------------------------------
-- Scripts: owners cannot forge views/likes/copies or reassign ownership
-- ---------------------------------------------------------------------------
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
     or new.user_id is distinct from old.user_id
     or new.id is distinct from old.id
     or new.created_at is distinct from old.created_at
  then
    raise exception 'protected script fields cannot be changed directly';
  end if;

  return new;
end;
$$;

drop trigger if exists protect_script_fields_trg on public.scripts;
create trigger protect_script_fields_trg
  before update on public.scripts
  for each row
  execute function public.protect_script_fields();

-- ---------------------------------------------------------------------------
-- Unique likes (one like per signed-in user per script)
-- ---------------------------------------------------------------------------
create table if not exists public.script_likes (
  script_id text not null references public.scripts (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (script_id, user_id)
);

create index if not exists script_likes_user_idx on public.script_likes (user_id);

alter table public.script_likes enable row level security;

drop policy if exists "Users read own likes" on public.script_likes;
create policy "Users read own likes"
  on public.script_likes for select
  to authenticated
  using (auth.uid() = user_id);

drop policy if exists "Users insert own likes" on public.script_likes;
create policy "Users insert own likes"
  on public.script_likes for insert
  to authenticated
  with check (auth.uid() = user_id);

-- Deletes / counter updates go through service role API
