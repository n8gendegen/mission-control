create extension if not exists "pgcrypto";

create table if not exists public.agent_work_sessions (
  id uuid primary key default gen_random_uuid(),
  task_id uuid not null,
  task_slug text,
  task_title text,
  agent_name text not null,
  status text not null default 'triggered',
  triggered_at timestamptz not null default timezone('utc', now()),
  started_at timestamptz,
  completed_at timestamptz,
  metadata jsonb,
  updated_at timestamptz not null default timezone('utc', now())
);

create unique index if not exists agent_work_sessions_task_agent_key on public.agent_work_sessions (task_id, agent_name);
create index if not exists agent_work_sessions_status_idx on public.agent_work_sessions (status);

alter table public.agent_work_sessions enable row level security;

drop policy if exists "Agent work readable by anon" on public.agent_work_sessions;
create policy "Agent work readable by anon" on public.agent_work_sessions
  for select
  using (true);

drop policy if exists "Agent work writable by service" on public.agent_work_sessions;
create policy "Agent work writable by service" on public.agent_work_sessions
  for all
  to service_role
  using (true)
  with check (true);
