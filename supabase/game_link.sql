-- Add Roblox place ID for Play Game + thumbnails
-- Run in Supabase SQL Editor after schema.sql / auth.sql

alter table public.scripts
  add column if not exists game_place_id text;

create index if not exists scripts_game_place_id_idx
  on public.scripts (game_place_id)
  where game_place_id is not null;
