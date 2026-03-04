create extension if not exists "pgcrypto";

create table if not exists public.spy_opportunities (
  id uuid primary key default gen_random_uuid(),
  source text not null,
  external_id text not null,
  title text not null,
  summary text,
  tags text[] default '{}',
  payout_usd numeric,
  listing_url text,
  repo_url text,
  fit_score numeric default 0,
  status text not null default 'new',
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (source, external_id)
);

alter table public.spy_opportunities enable row level security;

drop policy if exists "Spy opportunities readable" on public.spy_opportunities;
create policy "Spy opportunities readable" on public.spy_opportunities
  for select
  using (true);

drop policy if exists "Spy opportunities insert" on public.spy_opportunities;
create policy "Spy opportunities insert" on public.spy_opportunities
  for insert
  with check (auth.uid() is not null);

drop policy if exists "Spy opportunities update" on public.spy_opportunities;
create policy "Spy opportunities update" on public.spy_opportunities
  for update
  using (auth.uid() is not null)
  with check (auth.uid() is not null);
