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

function pickPreferredTask(rows) {
  const candidates = rows
    .map((row) => ({ ...row, input_payload: parsePayload(row.input_payload) }))
    .filter((row) => row.input_payload && row.input_payload.splitter_summary && !row.input_payload.builder_last_run_at);
  if (!candidates.length) return null;
  return candidates.find((row) => row.slug === "task-ai-wire-tap") || candidates[0];
}

async function fetchSteveTask(store) {
  if (store.kind === "supabase") {
    const { data, error } = await store.client
      .from("tasks")
      .select("id, slug, title, input_payload")
      .eq("owner_initials", "St")
      .order("updated_at", { ascending: true })
      .limit(10);
    if (error) throw new Error(`Failed to load Steve tasks: ${error.message}`);
    const task = pickPreferredTask(data ?? []);
    if (!task) throw new Error("No Steve tasks with specs are ready.");
    return task;
  }
  const { rows } = await store.pool.query(
    `select id, slug, title, input_payload
     from tasks
     where owner_initials = 'St'
     order by updated_at asc
     limit 10`
  );
  const task = pickPreferredTask(rows);
  if (!task) throw new Error("No Steve tasks with specs are ready.");
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
  const sources = [
    "Reuters Tech RSS",
    "SEC 8-K search API",
    "Chip advisory RSS",
  ];
  const file = `/**\n * ${spec.splitter_summary}\n *\n * Definition of Done: ${spec.splitter_definition_of_done}\n */\nexport type AiWireTapEvent = {\n  source: string;\n  title: string;\n  link: string;\n  publishedAt: string;\n  summary: string;\n  affectedLanes: string[];\n  raw: Record<string, unknown>;\n};\n\nexport const AI_WIRE_TAP_SOURCES = ${JSON.stringify(sources, null, 2)};\n\nexport function createAiWireTapEvent(event: AiWireTapEvent) {\n  // TODO: ${spec.splitter_handoff_actions?.[0] ?? "Insert event + alert"}\n  return event;\n}\n`;
  const path = `${dir}/event-model.ts`;
  writeFileSync(path, file);
  return path;
}

function applySpecChange(task) {
  if (task.slug === "task-ai-wire-tap") {
    return [createAiWireTapStub(task)];
  }
  return [];
}

async function main() {
  const token = env("BUILDER_GITHUB_TOKEN");
  if (!token) throw new Error("BUILDER_GITHUB_TOKEN is required.");

  const store = createDataStore();
  const task = await fetchSteveTask(store);

  const branchName = `auto/${task.slug}-builder-v2`;
  console.log(`Using task ${task.slug} -> branch ${branchName}`);

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
