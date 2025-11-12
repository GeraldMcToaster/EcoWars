create extension if not exists "uuid-ossp";

create table if not exists public.matches (
  id text primary key,
  state jsonb not null,
  turn text not null,
  winner text,
  updated_at timestamptz not null default now()
);

create table if not exists public.players (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  match_id text not null references public.matches (id) on delete cascade,
  stats jsonb not null,
  hand jsonb not null,
  created_at timestamptz not null default now()
);

create table if not exists public.cards (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  type text not null,
  cost int not null,
  effect text not null
);

create index if not exists players_match_idx on public.players (match_id);
