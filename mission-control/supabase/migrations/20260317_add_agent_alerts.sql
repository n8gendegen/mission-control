create table if not exists agent_alerts (
  id uuid primary key default gen_random_uuid(),
  agent_name text not null,
  task_id uuid,
  task_slug text,
  idle_minutes integer not null,
  last_seen_at timestamptz not null default timezone('utc', now()),
  status text not null default 'open',
  metadata jsonb default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create index if not exists agent_alerts_status_idx on agent_alerts(status);
create index if not exists agent_alerts_agent_idx on agent_alerts(agent_name, status);
