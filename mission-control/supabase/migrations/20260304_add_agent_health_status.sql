create extension if not exists "pgcrypto";

create table if not exists public.agent_health_status (
  id uuid primary key default gen_random_uuid(),
  agent_id text not null unique,
  agent_name text not null,
  lane text,
  status text not null default 'unknown',
  last_run_at timestamptz,
  last_duration_ms integer,
  next_run_eta timestamptz,
  error_context text,
  metadata jsonb,
  updated_at timestamptz not null default timezone('utc', now())
);

create index if not exists agent_health_status_status_idx on public.agent_health_status (status);
create index if not exists agent_health_status_lane_idx on public.agent_health_status (lane);

alter table public.agent_health_status enable row level security;

drop policy if exists "Agent health readable by anon" on public.agent_health_status;
create policy "Agent health readable by anon" on public.agent_health_status
  for select
  using (true);

drop policy if exists "Agent health writable by service" on public.agent_health_status;
create policy "Agent health writable by service" on public.agent_health_status
  for all
  to service_role
  using (true)
  with check (true);
