create extension if not exists pgcrypto;
-- Mission Control Supabase schema v0
-- Tables: tasks, approvals, activity_log

create table if not exists public.tasks (
  id uuid primary key default gen_random_uuid(),
  slug text unique,
  title text not null,
  description text,
  column_id text not null default 'backlog',
  status_color text default 'bg-slate-500',
  owner_initials text,
  source text,
  project text,
  timebox_hours numeric,
  status text default 'open',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists tasks_column_id_idx on public.tasks (column_id);
create index if not exists tasks_project_idx on public.tasks (project);

create table if not exists public.activity_log (
  id uuid primary key default gen_random_uuid(),
  task_id uuid references public.tasks(id) on delete set null,
  owner text not null,
  summary text not null,
  details text,
  occurred_at timestamptz not null default now()
);

create index if not exists activity_log_task_id_idx on public.activity_log (task_id);
create index if not exists activity_log_occurred_at_idx on public.activity_log (occurred_at desc);

create table if not exists public.approvals (
  id uuid primary key default gen_random_uuid(),
  slug text unique,
  title text not null,
  summary text not null,
  technical_scope text,
  payout_usd numeric,
  time_estimate_hours_min numeric,
  time_estimate_hours_max numeric,
  token_estimate integer,
  token_cost_usd numeric,
  expected_profit_usd numeric,
  recommendation text,
  status text not null default 'pending',
  repo_url text,
  listing_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists approvals_status_idx on public.approvals (status);

-- Seed initial tasks
insert into public.tasks (slug, title, description, column_id, status_color, owner_initials, source, project)
values
  ('task-concierge-offer', 'Define Clawbot Concierge offer & tiers', 'One-pager covering audience, Tier 1 done-for-you install, Tier 2 Mission Control starter, pricing + approval flags.', 'backlog', 'bg-violet-400', 'Spl', 'Concierge', 'Concierge'),
  ('task-concierge-copy', 'Draft Clawbot Concierge landing page copy + FAQ', 'Hero, benefits, how-it-works steps, CTA text, and 10-question FAQ for MVP page.', 'backlog', 'bg-sky-400', 'Sp', 'Concierge', 'Concierge'),
  ('task-concierge-landing', 'Implement Clawbot Concierge landing page on Vercel', 'Decide routing, build Next.js page with hero, benefits, process, FAQ, CTA; prep for Vercel deploy.', 'backlog', 'bg-emerald-400', 'St', 'Concierge', 'Concierge'),
  ('task-concierge-form', 'Add lead capture form for Concierge requests', 'Collect name/email/use-case+tier interest and persist safely (Airtable, Supabase, etc.).', 'backlog', 'bg-amber-400', 'St', 'Concierge', 'Concierge'),
  ('task-concierge-chat', 'Design minimal guided install/chat flow', 'Interactive helper to ask OS/stack, walk key install steps, and escalate to Concierge when blocked.', 'backlog', 'bg-rose-400', 'H', 'Concierge', 'Concierge'),
  ('task-revlab-template', 'Define Revenue Lab experiment template', 'Document standard fields (hypothesis, channel, EV, effort, owner, status) as schema for backlog.', 'backlog', 'bg-indigo-400', 'Spl', 'Revenue Lab', 'Revenue Lab'),
  ('task-revlab-backlog', 'Create initial Revenue Lab experiments backlog', 'Seed 5+ scored experiments (pricing, YouTube funnel, AI spend dashboard, bounty automations).', 'backlog', 'bg-lime-400', 'Sp', 'Revenue Lab', 'Revenue Lab'),
  ('task-bounty-sources', 'Map bounty / code-fix sources & filters', 'List 2–4 marketplaces or repos plus filters aligned with TS/Next/AI skills and payout targets.', 'backlog', 'bg-teal-400', 'Sp', 'Bounty Lane', 'Bounty Lane'),
  ('task-bounty-target', 'Select first bounty/code-fix target', 'Pick best-fit bounty with repo link, acceptance criteria, payout, and risk notes for Steve to execute.', 'backlog', 'bg-fuchsia-400', 'Spl', 'Bounty Lane', 'Bounty Lane'),
  ('task-replit-oauth', 'Replit OAuth fix – NextAuth/Clerk', 'Claim bounty #21873, secure access, implement Google OAuth regression fix + tests per acceptance criteria.', 'backlog', 'bg-purple-500', 'St', 'Bounty Lane', 'Bounty Lane'),
  ('task-approvals-ui', 'Wire Approvals tab to data + markdown', 'Surface approvals entries in-app with ROI modeling so Nate can approve before work starts.', 'backlog', 'bg-cyan-500', 'H', 'Mission Control', 'Mission Control')
on conflict (slug) do update
set
  title = excluded.title,
  description = excluded.description,
  column_id = excluded.column_id,
  status_color = excluded.status_color,
  owner_initials = excluded.owner_initials,
  source = excluded.source,
  project = excluded.project;

-- Seed initial approvals
insert into public.approvals (
  slug,
  title,
  summary,
  technical_scope,
  payout_usd,
  time_estimate_hours_min,
  time_estimate_hours_max,
  token_estimate,
  token_cost_usd,
  expected_profit_usd,
  recommendation,
  status,
  repo_url,
  listing_url
)
values (
  'approval-replit-oauth',
  'Replit OAuth regression fix',
  'Google sign-in is broken on the Clerk Next.js starter. Need to reproduce, upgrade NextAuth middleware, and ship a Loom-backed fix.',
  'Reproduce failing OAuth flow, upgrade route handlers to auth().protect(), patch Google provider + session persistence, add regression test, deploy preview.',
  1100,
  4.5,
  6.5,
  120000,
  1.8,
  1098.2,
  'Strongly pursue',
  'pending',
  'https://github.com/replit/clerk-app-template',
  'https://replit.com/bounties/21873'
)
on conflict (slug) do update
set
  title = excluded.title,
  summary = excluded.summary,
  technical_scope = excluded.technical_scope,
  payout_usd = excluded.payout_usd,
  time_estimate_hours_min = excluded.time_estimate_hours_min,
  time_estimate_hours_max = excluded.time_estimate_hours_max,
  token_estimate = excluded.token_estimate,
  token_cost_usd = excluded.token_cost_usd,
  expected_profit_usd = excluded.expected_profit_usd,
  recommendation = excluded.recommendation,
  status = excluded.status,
  repo_url = excluded.repo_url,
  listing_url = excluded.listing_url;

-- Row Level Security
alter table public.tasks enable row level security;
alter table public.activity_log enable row level security;
alter table public.approvals enable row level security;

drop policy if exists "allow read" on public.tasks;
create policy "allow read" on public.tasks for select using (true);
drop policy if exists "allow read" on public.activity_log;
create policy "allow read" on public.activity_log for select using (true);
drop policy if exists "allow read" on public.approvals;
create policy "allow read" on public.approvals for select using (true);

drop policy if exists "service insert" on public.tasks;
create policy "service insert" on public.tasks for insert with check (auth.uid() is not null);
drop policy if exists "service insert" on public.activity_log;
create policy "service insert" on public.activity_log for insert with check (auth.uid() is not null);
drop policy if exists "service insert" on public.approvals;
create policy "service insert" on public.approvals for insert with check (auth.uid() is not null);

drop policy if exists "service update" on public.tasks;
create policy "service update" on public.tasks for update using (auth.uid() is not null) with check (auth.uid() is not null);
drop policy if exists "service update" on public.activity_log;
create policy "service update" on public.activity_log for update using (auth.uid() is not null) with check (auth.uid() is not null);
drop policy if exists "service update" on public.approvals;
create policy "service update" on public.approvals for update using (auth.uid() is not null) with check (auth.uid() is not null);
