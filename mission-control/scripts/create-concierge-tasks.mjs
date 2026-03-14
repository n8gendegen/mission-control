#!/usr/bin/env node
import "dotenv/config";
import { Client } from "pg";

const SUPABASE_DB_URL = process.env.SUPABASE_DB_URL;

if (!SUPABASE_DB_URL) {
  console.error("Missing SUPABASE_DB_URL env.");
  process.exit(1);
}

const SOURCE = "concierge-relaunch";
const PROJECT = "Concierge MVP";
const MODULES = {
  0: { lane: "module-0-offer", color: "bg-violet-500" },
  1: { lane: "module-1-infra", color: "bg-cyan-500" },
  2: { lane: "module-2-packaging", color: "bg-amber-500" },
  3: { lane: "module-3-commerce", color: "bg-emerald-500" },
  4: { lane: "module-4-launch", color: "bg-sky-500" },
};

const TASKS = [
  {
    slug: "task-concierge-mod0-icp",
    title: "Module 0 — Define ICP tiers",
    description: "Document the solo operator, lean ops team, and boutique studio personas with pains, budgets, and success metrics.",
    owner: "Jn",
    module: 0,
    column: "in-progress",
  },
  {
    slug: "task-concierge-mod0-scope",
    title: "Module 0 — Outline tier scope",
    description: "List the exact deliverables bundled into Tier 1-3 so the chatbot/install wizard can reference them verbatim.",
    owner: "Ar",
    module: 0,
    column: "in-progress",
  },
  {
    slug: "task-concierge-mod0-exclusions",
    title: "Module 0 — Explicit exclusions",
    description: "Publish the 'not included' list (bespoke agents, net-new repos, multi-quarter retainers) for each tier.",
    owner: "Ar",
    module: 0,
  },
  {
    slug: "task-concierge-mod0-policies",
    title: "Module 0 — Refund & reschedule policy",
    description: "Draft refund, reschedule, and support-channel policies we can paste into Stripe + the onboarding emails.",
    owner: "Jn",
    module: 0,
  },
  {
    slug: "task-concierge-mod0-security",
    title: "Module 0 — Access & security playbook",
    description: "Document how we handle API keys, temp GitHub users, screen-share installs, and key retention windows.",
    owner: "Jn",
    module: 0,
  },
  {
    slug: "task-concierge-mod1-domain",
    title: "Module 1 — Domain + registrar setup",
    description: "Accept shared Namecheap creds, verify auth, and stage Cloudflare zone delegation for openclawlaunchpad.com.",
    owner: "Jn",
    module: 1,
  },
  {
    slug: "task-concierge-mod1-cloudflare",
    title: "Module 1 — Cloudflare + monitoring",
    description: "Create Cloudflare zone, set WAF defaults, and hook uptime/error alerts for landing + checkout endpoints.",
    owner: "Jn",
    module: 1,
  },
  {
    slug: "task-concierge-mod1-vercel",
    title: "Module 1 — Vercel env wiring",
    description: "Provision Vercel project + staging env, set Supabase/Vault keys, and verify SSL after DNS cutover.",
    owner: "St",
    module: 1,
  },
  {
    slug: "task-concierge-mod1-monitoring",
    title: "Module 1 — Webhook & health monitors",
    description: "Add Stripe webhook retry alerts + agent runner health checks so concierge automations page when anything fails.",
    owner: "St",
    module: 1,
  },
  {
    slug: "task-concierge-mod2-pricing-copy",
    title: "Module 2 — Tier feature tables",
    description: "Write the pricing/feature matrix for $99 / $279 / $399 tiers plus the $59/mo update add-on.",
    owner: "Ar",
    module: 2,
  },
  {
    slug: "task-concierge-mod2-prereqs",
    title: "Module 2 — Prerequisite checklists",
    description: "List the tooling each tier must have ready (AI key, Supabase, GitHub PAT, Stripe key, storage bucket, etc.).",
    owner: "Ar",
    module: 2,
  },
  {
    slug: "task-concierge-mod2-intake",
    title: "Module 2 — Intake + intake script",
    description: "Write the questions for the client intake (contact, goals, requirements) and the chatbot intro script.",
    owner: "Ar",
    module: 2,
  },
  {
    slug: "task-concierge-mod2-assets",
    title: "Module 2 — Module screenshots/GIFs",
    description: "Capture auto-assign, agent health, data tab, and content factory screenshots/GIFs for the site + deck.",
    owner: "Ar",
    module: 2,
  },
  {
    slug: "task-concierge-mod2-testimonials",
    title: "Module 2 — Testimonials/FAQ",
    description: "Assemble starter testimonials (internal ok) and a FAQ that answers install/support/questions per tier.",
    owner: "Ar",
    module: 2,
  },
  {
    slug: "task-concierge-mod2-legal",
    title: "Module 2 — Terms + privacy blurb",
    description: "Write the concierge-specific ToS, disclaimer, and privacy copy (data access + retention) for the site + checkout.",
    owner: "Jn",
    module: 2,
  },
  {
    slug: "task-concierge-mod2-sla",
    title: "Module 2 — Support SLA table",
    description: "Publish the SLA grid (Tier 1 email, Tier 2 chat, Tier 3 24h install blocker) for the onboarding portal.",
    owner: "Ar",
    module: 2,
  },
  {
    slug: "task-concierge-mod3-stripe",
    title: "Module 3 — Stripe product setup",
    description: "Create the three one-time SKUs + $59 subscription in Stripe and map webhooks to Supabase queues.",
    owner: "St",
    module: 3,
  },
  {
    slug: "task-concierge-mod3-webhooks",
    title: "Module 3 — License + webhook handler",
    description: "Build the webhook endpoint that issues repo/chatbot licenses after Stripe payment and retries on failure.",
    owner: "St",
    module: 3,
  },
  {
    slug: "task-concierge-mod3-release-pipeline",
    title: "Module 3 — Repo bundle + release job",
    description: "Script the sanitized Mission Control bundle + monthly release tag builder for subscribers.",
    owner: "St",
    module: 3,
  },
  {
    slug: "task-concierge-mod3-onboarding",
    title: "Module 3 — Onboarding emails + portal",
    description: "Wire the welcome, preflight checker, and reminder emails plus the Supabase portal surfaces for downloads.",
    owner: "St",
    module: 3,
  },
  {
    slug: "task-concierge-mod3-cache",
    title: "Module 3 — License cache + audit log",
    description: "Persist license issuance + access logs so we can revoke sharing/abuse and show status in the portal.",
    owner: "St",
    module: 3,
  },
  {
    slug: "task-concierge-mod3-fallbacks",
    title: "Module 3 — Failure + orphan playbooks",
    description: "Document and code the retry/manual reconciliation paths for failed Stripe webhooks or partial installs.",
    owner: "St",
    module: 3,
  },
  {
    slug: "task-concierge-mod4-site",
    title: "Module 4 — Landing page build",
    description: "Implement the new landing layout (hero, tier cards, gallery, FAQ) on openclawlaunchpad.com.",
    owner: "Qu",
    module: 4,
  },
  {
    slug: "task-concierge-mod4-forms",
    title: "Module 4 — Intake + mailing hooks",
    description: "Connect the intake form + newsletter opt-in to Supabase and our broadcast list.",
    owner: "Qu",
    module: 4,
  },
  {
    slug: "task-concierge-mod4-analytics",
    title: "Module 4 — Analytics + KPI tiles",
    description: "Set up GA4/Pixel events plus Supabase metrics for LP→checkout, checkout→intake, intake→install.",
    owner: "Qu",
    module: 4,
  },
  {
    slug: "task-concierge-mod4-comms",
    title: "Module 4 — Launch comms kit",
    description: "Draft the launch thread, announcement email, and weekly drip sequence for concierge buyers.",
    owner: "Ar",
    module: 4,
  },
  {
    slug: "task-concierge-mod4-support",
    title: "Module 4 — Support docs + SLA surfacing",
    description: "Build the help-center starter docs (key rotation, redeploy, add agent) and surface SLA tier badges in portal.",
    owner: "Qu",
    module: 4,
  },
  {
    slug: "task-concierge-mod4-feedback",
    title: "Module 4 — Feedback + NPS loop",
    description: "Add the satisfaction pulse + 'almost didn’t buy' questions and wire them into the roadmap digest.",
    owner: "Qu",
    module: 4,
  },
];

function resolveMeta(task) {
  const moduleMeta = MODULES[task.module];
  return {
    source: SOURCE,
    project: PROJECT,
    lane: moduleMeta.lane,
    status_color: moduleMeta.color,
    column_id: task.column || "backlog",
  };
}

async function upsertTask(client, task) {
  const meta = resolveMeta(task);
  const values = [
    task.slug,
    task.title,
    task.description,
    meta.column_id,
    meta.status_color,
    task.owner,
    meta.source,
    meta.project,
    meta.lane,
  ];
  const { rows } = await client.query(
    `insert into tasks (slug, title, description, column_id, status_color, owner_initials, source, project, lane)
     values ($1,$2,$3,$4,$5,$6,$7,$8,$9)
     on conflict (slug) do update set
       title = excluded.title,
       description = excluded.description,
       column_id = excluded.column_id,
       status_color = excluded.status_color,
       owner_initials = excluded.owner_initials,
       source = excluded.source,
       project = excluded.project,
       lane = excluded.lane,
       updated_at = timezone('utc', now())
     returning id`,
    values
  );
  return rows[0].id;
}

async function main() {
  const client = new Client({ connectionString: SUPABASE_DB_URL, ssl: { rejectUnauthorized: false } });
  await client.connect();
  try {
    for (const task of TASKS) {
      const id = await upsertTask(client, task);
      console.log(`Upserted ${task.slug} (${id})`);
    }
  } catch (err) {
    console.error(err);
    process.exitCode = 1;
  } finally {
    await client.end();
  }
}

main();
