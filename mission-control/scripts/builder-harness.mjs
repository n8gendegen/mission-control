#!/usr/bin/env node
import { execSync } from "child_process";
import { appendFileSync, mkdirSync, writeFileSync } from "fs";
import { createClient } from "@supabase/supabase-js";
import { Pool } from "pg";

function run(cmd, options = {}) {
  execSync(cmd, { stdio: "inherit", ...options });
}

function capture(cmd) {
  return execSync(cmd, { stdio: "pipe" }).toString().trim();
}

function env(name) {
  return process.env[name] ?? null;
}

function createDataStore() {
  const url = env("SUPABASE_URL");
  const key = env("SUPABASE_SERVICE_ROLE_KEY");
  if (url && key) {
    const client = createClient(url, key, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
    return { kind: "supabase", client };
  }
  const dbUrl = env("SUPABASE_DB_URL");
  if (dbUrl) {
    process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
    const pool = new Pool({ connectionString: dbUrl, ssl: { rejectUnauthorized: false } });
    return { kind: "pg", pool };
  }
  throw new Error("Missing Supabase credentials.");
}

function parsePayload(raw) {
  if (!raw) return null;
  if (typeof raw === "object") return raw;
  try {
    return JSON.parse(raw);
  } catch (err) {
    return null;
  }
}

function pickPreferredTask(rows, priority) {
  const candidates = rows
    .map((row) => ({ ...row, input_payload: parsePayload(row.input_payload) }))
    .filter((row) => row.input_payload && row.input_payload.splitter_summary && !row.input_payload.builder_last_run_at);
  if (!candidates.length) return null;
  for (const slug of priority) {
    const match = candidates.find((row) => row.slug === slug);
    if (match) return match;
  }
  return candidates[0];
}

async function fetchTask(store, ownerInitials, priority) {
  if (store.kind === "supabase") {
    const { data, error } = await store.client
      .from("tasks")
      .select("id, slug, title, input_payload")
      .eq("owner_initials", ownerInitials)
      .order("updated_at", { ascending: true })
      .limit(10);
    if (error) throw new Error(`Failed to load ${ownerInitials} tasks: ${error.message}`);
    const task = pickPreferredTask(data ?? [], priority);
    if (!task) throw new Error(`No ${ownerInitials} tasks with specs are ready.`);
    return task;
  }
  const { rows } = await store.pool.query(
    `select id, slug, title, input_payload
     from tasks
     where owner_initials = $1
     order by updated_at asc
     limit 10`,
    [ownerInitials]
  );
  const task = pickPreferredTask(rows, priority);
  if (!task) throw new Error(`No ${ownerInitials} tasks with specs are ready.`);
  return task;
}

async function markTask(store, task, branchName) {
  const now = new Date().toISOString();
  const payload = { ...(task.input_payload || {}) };
  payload.builder_last_run_at = now;
  payload.builder_last_branch = branchName;
  if (store.kind === "supabase") {
    const { error } = await store.client
      .from("tasks")
      .update({ input_payload: payload, updated_at: now })
      .eq("id", task.id);
    if (error) throw new Error(`Failed to tag task ${task.id}: ${error.message}`);
  } else {
    await store.pool.query(
      `update tasks set input_payload = $2::jsonb, updated_at = $3 where id = $1`,
      [task.id, JSON.stringify(payload), now]
    );
  }
}

function buildPlanMarkdown(task) {
  const spec = task.input_payload;
  const ac = spec.splitter_acceptance_criteria ?? [];
  const handoff = spec.splitter_handoff_actions ?? [];
  return `# ${task.title}\n\n## Summary\n${spec.splitter_summary}\n\n## Definition of Done\n${spec.splitter_definition_of_done}\n\n## Acceptance Criteria\n${ac.map((item) => `- ${item}`).join("\n") || "- tbd"}\n\n## Handoff Actions\n${handoff.map((item, idx) => `${idx + 1}. ${item}`).join("\n") || "1. Document remaining steps"}\n`;
}

function createAiWireTapStub(task) {
  const spec = task.input_payload;
  const dir = "src/lib/ai-wire-tap";
  mkdirSync(dir, { recursive: true });
  const sources = ["Reuters Tech RSS", "SEC 8-K search API", "Chip advisory RSS"];
  const file = `/**\n * ${spec.splitter_summary}\n *\n * Definition of Done: ${spec.splitter_definition_of_done}\n */\nexport type AiWireTapEvent = {\n  source: string;\n  title: string;\n  link: string;\n  publishedAt: string;\n  summary: string;\n  affectedLanes: string[];\n  raw: Record<string, unknown>;\n};\n\nexport const AI_WIRE_TAP_SOURCES = ${JSON.stringify(sources, null, 2)};\n\nexport function createAiWireTapEvent(event: AiWireTapEvent) {\n  // TODO: ${spec.splitter_handoff_actions?.[0] ?? "Insert event + alert"}\n  return event;\n}\n`;
  const path = `${dir}/event-model.ts`;
  writeFileSync(path, file);
  return path;
}

function createLoadMeterStub(task) {
  const spec = task.input_payload;
  const dir = "src/lib/load-meter";
  mkdirSync(dir, { recursive: true });
  const firstCriteria = spec.splitter_acceptance_criteria?.[0] ?? "Auto-updates";
  const lines = [
    `/**`,
    ` * ${spec.splitter_summary}`,
    ` *`,
    ` * Definition of Done: ${spec.splitter_definition_of_done}`,
    ` */`,
    `export type AgentLoadSnapshot = {`,
    `  agent: string;`,
    `  points: number;`,
    `  etaDays: number;`,
    `  tasks: number;`,
    `};`,
    ``,
    `export const LOAD_BANDS = {`,
    `  green: { max: 2 },`,
    `  yellow: { min: 3, max: 4 },`,
    `  red: { min: 5 }`,
    `} as const;`,
    ``,
    `export function computeLoadBand(points: number) {`,
    `  if (points <= LOAD_BANDS.green.max) return "green";`,
    `  if (points >= LOAD_BANDS.red.min) return "red";`,
    `  return "yellow";`,
    `}`,
    ``,
    `export function describeLoad(snapshot: AgentLoadSnapshot) {`,
    `  return "${firstCriteria} => " + snapshot.agent + " has " + snapshot.points + " pts";`,
    `}`,
  ];
  const file = lines.join("\n");
  const path = `${dir}/config.ts`;
  writeFileSync(path, file);
  return path;
}

function createTavilyStub(task) {
  const spec = task.input_payload;
  const dir = "src/lib/tavily";
  mkdirSync(dir, { recursive: true });
  const helper = `/**\n * ${spec.splitter_summary}\n *\n * Definition of Done: ${spec.splitter_definition_of_done}\n */\nexport type TavilySearchOptions = {\n  focus?: \"news\" | \"finance\" | \"general\";\n  maxResults?: number;\n};\n\nexport async function tavilySearch(query: string, opts: TavilySearchOptions = {}) {\n  throw new Error('Wire Tavily helper per spec: store API key in Supabase and add caching');\n}\n`;
  const path = `${dir}/helper.ts`;
  writeFileSync(path, helper);
  return path;
}

function createBountyTargetStub(task) {
  const spec = task.input_payload;
  const dir = "src/lib/spy";
  mkdirSync(dir, { recursive: true });
  const file = `/**\n * ${spec.splitter_summary}\n *\n * Definition of Done: ${spec.splitter_definition_of_done}\n */\nexport type BountyTarget = {\n  title: string;\n  repo: string;\n  payoutUsd: number;\n  acceptanceCriteria: string;\n  riskNotes: string;\n};\n\nexport async function selectBountyTarget(): Promise<BountyTarget> {\n  throw new Error('Implement bounty target selection per splitter spec');\n}\n`;
  const path = `${dir}/bounty-target.ts`;
  writeFileSync(path, file);
  return path;
}

function createBountySourcesStub(task) {
  const spec = task.input_payload;
  const dir = "src/lib/spy";
  mkdirSync(dir, { recursive: true });
  const file = `/**\n * ${spec.splitter_summary}\n *\n * Definition of Done: ${spec.splitter_definition_of_done}\n */\nexport type BountySource = {\n  name: string;\n  url: string;\n  filter: string;\n  cadence: string;\n};\n\nexport function listBountySources(): BountySource[] {\n  return []; // TODO: hydrate with scraper output per spec\n}\n`;
  const path = `${dir}/bounty-sources.ts`;
  writeFileSync(path, file);
  return path;
}

function createReplitOauthStub(task) {
  const spec = task.input_payload;
  const dir = "src/lib/replit";
  mkdirSync(dir, { recursive: true });
  const file = `/**\n * ${spec.splitter_summary}\n *\n * Definition of Done: ${spec.splitter_definition_of_done}\n */\nexport type ReplitOAuthConfig = {\n  clientId: string;\n  clientSecret: string;\n  redirectUri: string;\n};\n\nexport function buildReplitAuthUrl(config: ReplitOAuthConfig) {\n  throw new Error('Wire Replit OAuth helper per splitter spec');\n}\n`;
  const path = `${dir}/oauth.ts`;
  writeFileSync(path, file);
  return path;
}

function createRevlabTemplateStub(task) {
  const spec = task.input_payload;
  const dir = "src/lib/revlab";
  mkdirSync(dir, { recursive: true });
  const file = `/**\n * ${spec.splitter_summary}\n *\n * Definition of Done: ${spec.splitter_definition_of_done}\n */\nexport type ExperimentTemplate = {\n  name: string;\n  hypothesis: string;\n  metric: string;\n  owner: string;\n  notes: string;\n};\n\nexport function createExperimentTemplate(): ExperimentTemplate {\n  throw new Error('Define Revenue Lab experiment template per splitter spec');\n}\n`;
  const path = `${dir}/template.ts`;
  writeFileSync(path, file);
  return path;
}

function createRevlabBacklogStub(task) {
  const spec = task.input_payload;
  const dir = "src/lib/revlab";
  mkdirSync(dir, { recursive: true });
  const file = `/**\n * ${spec.splitter_summary}\n *\n * Definition of Done: ${spec.splitter_definition_of_done}\n */\nexport type ExperimentBacklogItem = {\n  id: string;\n  templateId: string;\n  priority: number;\n  etaWeeks: number;\n};\n\nexport function seedExperimentBacklog(): ExperimentBacklogItem[] {\n  return []; // TODO: hydrate from Supabase per spec\n}\n`;
  const path = `${dir}/backlog.ts`;
  writeFileSync(path, file);
  return path;
}

function createCronCalendarStub(task) {
  const spec = task.input_payload;
  const dir = "src/lib/cron";
  mkdirSync(dir, { recursive: true });
  const file = `/**\n * ${spec.splitter_summary}\n *\n * Definition of Done: ${spec.splitter_definition_of_done}\n */\nexport type CronJob = {\n  id: string;\n  label: string;\n  cron: string;\n  lane: string;\n};\n\nexport const STATIC_CRON_JOBS: CronJob[] = [];\n\nexport function expandCron(job: CronJob): Date[] {\n  throw new Error('Add cron expansion helper per splitter spec');\n}\n`;
  const path = `${dir}/calendar.ts`;
  writeFileSync(path, file);
  return path;
}

function applySpecChange(task) {
  if (task.slug === "task-ai-wire-tap") {
    return [createAiWireTapStub(task)];
  }
  if (task.slug === "task-load-meter") {
    return [createLoadMeterStub(task)];
  }
  if (task.slug === "task-tavily-integration") {
    return [createTavilyStub(task)];
  }
  if (task.slug === "task-bounty-target") {
    return [createBountyTargetStub(task)];
  }
  if (task.slug === "task-bounty-sources") {
    return [createBountySourcesStub(task)];
  }
  if (task.slug === "task-replit-oauth") {
    return [createReplitOauthStub(task)];
  }
  if (task.slug === "task-revlab-template") {
    return [createRevlabTemplateStub(task)];
  }
  if (task.slug === "task-revlab-backlog") {
    return [createRevlabBacklogStub(task)];
  }
  if (task.slug === "task-cron-calendar") {
    return [createCronCalendarStub(task)];
  }
  return [];
}

function defaultPriority(owner) {
  if (owner === "St") {
    return ["task-ai-wire-tap", "task-load-meter", "task-tavily-integration", "task-cron-calendar"];
  }
  if (owner === "Sp") {
    return [
      "task-bounty-target",
      "task-bounty-sources",
      "task-replit-oauth",
      "task-revlab-template",
      "task-revlab-backlog"
    ];
  }
  return [];
}

async function main() {
  const token = env("BUILDER_GITHUB_TOKEN");
  if (!token) throw new Error("BUILDER_GITHUB_TOKEN is required.");

  const ownerInitials = env("BUILDER_OWNER_INITIALS") ?? "St";
  const priority = env("BUILDER_PRIORITY_SLUGS")
    ? env("BUILDER_PRIORITY_SLUGS").split(",").map((item) => item.trim()).filter(Boolean)
    : defaultPriority(ownerInitials);

  const store = createDataStore();
  const task = await fetchTask(store, ownerInitials, priority);

  const branchName = `auto/${task.slug}-builder-v2`;
  console.log(`Using task ${task.slug} (${ownerInitials}) -> branch ${branchName}`);

  run("git checkout main");
  run("git pull origin main");
  run(`git checkout -B ${branchName}`);

  mkdirSync("docs/builder", { recursive: true });
  const docPath = `docs/builder/${task.slug}.md`;
  writeFileSync(docPath, buildPlanMarkdown(task));

  mkdirSync("docs", { recursive: true });
  const logEntry = `- ${new Date().toISOString()} — Builder harness created/updated build plan for ${task.slug}\n`;
  appendFileSync("docs/builder-log.md", logEntry);

  const specFiles = applySpecChange(task);

  run(`git add ${[docPath, "docs/builder-log.md", ...specFiles].join(" ")}`);
  run(`git commit -m "builder: plan + stub for ${task.slug}"`);

  run(`git push origin ${branchName} --force`);

  const prTitle = `Builder: ${task.title}`;
  const prBody = `Automation scaffold derived from splitter spec for ${task.slug}.`;
  const envVars = { ...process.env, GH_TOKEN: token };
  run(`gh pr create --title "${prTitle}" --body "${prBody}" --head ${branchName} --base main`, { env: envVars });

  const commitSha = capture("git rev-parse HEAD");
  console.log(`Commit ${commitSha} pushed on ${branchName}`);

  await markTask(store, task, branchName);
}

main().catch((err) => {
  console.error("Builder harness failed:", err.message ?? err);
  process.exit(1);
});
