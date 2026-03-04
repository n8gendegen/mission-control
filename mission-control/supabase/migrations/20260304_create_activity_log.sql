create extension if not exists "pgcrypto";

drop table if exists public.activity_log;

create table if not exists public.activity_log (
  id uuid primary key default gen_random_uuid(),
  event_type text not null,
  source text,
  actor text not null,
  summary text not null,
  entity_type text,
  entity_id text,
  metadata jsonb,
  created_at timestamptz not null default timezone('utc', now())
);

create index if not exists activity_log_created_at_idx on public.activity_log (created_at desc);
create index if not exists activity_log_event_type_idx on public.activity_log (event_type);
create index if not exists activity_log_entity_idx on public.activity_log (entity_type, entity_id);

alter table public.activity_log enable row level security;

drop policy if exists "Activity log readable by anon" on public.activity_log;
create policy "Activity log readable by anon" on public.activity_log
  for select
  using (true);

drop policy if exists "Activity log insertable by service" on public.activity_log;
create policy "Activity log insertable by service" on public.activity_log
  for insert
  to service_role
  with check (true);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = "supabase_realtime"
      AND schemaname = "public"
      AND tablename = "activity_log"
  ) THEN
    EXECUTE "alter publication supabase_realtime add table public.activity_log";
  END IF;
END
$$;
