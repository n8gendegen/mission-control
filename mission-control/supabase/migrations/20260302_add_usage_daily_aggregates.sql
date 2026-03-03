create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create table if not exists public.usage_daily_aggregates (
  date date not null,
  provider text not null,
  model text not null,
  total_tokens bigint not null default 0,
  total_cost_usd numeric(18,6) not null default 0,
  by_agent jsonb not null default '[]'::jsonb,
  by_project jsonb not null default '[]'::jsonb,
  anomalies jsonb default '[]'::jsonb,
  ingestion_notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (date, provider, model)
);

create index if not exists usage_daily_aggregates_date_idx on public.usage_daily_aggregates (date desc);
create index if not exists usage_daily_aggregates_provider_idx on public.usage_daily_aggregates (provider);

create trigger usage_daily_aggregates_set_updated_at
  before update on public.usage_daily_aggregates
  for each row
  execute procedure public.set_updated_at();

alter table public.usage_daily_aggregates enable row level security;

create policy "usage_aggregates_allow_read"
  on public.usage_daily_aggregates for select
  using (true);
