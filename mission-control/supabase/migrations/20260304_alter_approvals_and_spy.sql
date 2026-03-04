alter table if exists public.approvals
  add column if not exists opportunity_id uuid references public.spy_opportunities(id) on delete set null,
  add column if not exists task_slug text;

create index if not exists approvals_opportunity_id_idx on public.approvals (opportunity_id);
create index if not exists approvals_task_slug_idx on public.approvals (task_slug);

alter table if exists public.spy_opportunities
  add column if not exists claim_status text not null default 'unclaimed',
  add column if not exists claim_comment_url text,
  add column if not exists maintainer_contact text,
  add column if not exists repo_full_name text,
  add column if not exists issue_number integer,
  add column if not exists last_claim_check timestamptz;
