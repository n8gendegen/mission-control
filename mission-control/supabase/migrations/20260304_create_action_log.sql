create extension if not exists "pgcrypto";

create table if not exists public.action_log (
  id uuid primary key default gen_random_uuid(),
  entity_type text not null,
  entity_id text not null,
  action text not null check (action in ('ack','snooze','complete')),
  actor text not null,
  metadata jsonb,
  created_at timestamptz not null default timezone('utc', now())
);

create index if not exists action_log_entity_lookup on public.action_log (entity_type, entity_id, created_at desc);

alter table public.action_log enable row level security;

drop policy if exists "Action log readable" on public.action_log;
create policy "Action log readable" on public.action_log
  for select
  using (true);

drop policy if exists "Action log writable by service" on public.action_log;
create policy "Action log writable by service" on public.action_log
  for insert
  to service_role
  with check (true);
drop policy if exists "Action log writable by anon" on public.action_log;
create policy "Action log writable by anon" on public.action_log
  for insert
  to anon
  with check (true);

