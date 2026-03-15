create extension if not exists "pgcrypto";

create table if not exists concierge_licenses (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  tier text not null,
  status text not null default 'active',
  access_token text not null unique,
  stripe_customer_id text,
  stripe_subscription_id text,
  created_at timestamptz not null default timezone('utc', now())
);

create table if not exists concierge_chat_sessions (
  id uuid primary key default gen_random_uuid(),
  license_id uuid not null references concierge_licenses(id) on delete cascade,
  created_at timestamptz not null default timezone('utc', now()),
  last_interaction_at timestamptz not null default timezone('utc', now())
);

create table if not exists concierge_chat_messages (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references concierge_chat_sessions(id) on delete cascade,
  license_id uuid not null references concierge_licenses(id) on delete cascade,
  role text not null check (role in ('user','assistant')),
  content text not null,
  token_count integer default 0,
  cost_usd numeric(10,4) default 0,
  created_at timestamptz not null default timezone('utc', now())
);

create index if not exists concierge_chat_messages_license_created_idx on concierge_chat_messages (license_id, created_at desc);
create index if not exists concierge_chat_sessions_license_idx on concierge_chat_sessions (license_id);
