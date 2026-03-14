#!/usr/bin/env node
// Usage: npm run spec-generator -- --lane=steve --limit=1
// Requires DEEPSEEK_API_KEY (preferred) or OPENAI_API_KEY plus Supabase creds.
import { createClient } from "@supabase/supabase-js";
import { Pool } from "pg";
import { fetchJsonWithCache } from "./lib/llm.js";

const lanes = {
  steve: { initials: "St" },
  spy: { initials: "Sp" },
};

function parseArgs() {
  const args = process.argv.slice(2);
  const options = { lane: "steve", limit: 1 };
  for (let i = 0; i < args.length; i += 1) {
    const arg = args[i];
    if (arg === "--lane" && args[i + 1]) {
      options.lane = args[i + 1].toLowerCase();
      i += 1;
    } else if (arg === "--limit" && args[i + 1]) {
      options.limit = Number(args[i + 1]) || options.limit;
      i += 1;
    }
  }
  return options;
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

function buildLeanContext(task) {
  const payload = task.input_payload && typeof task.input_payload === "object" ? task.input_payload : null;
  const acceptanceCriteria = Array.isArray(payload?.splitter_acceptance_criteria)
    ? payload.splitter_acceptance_criteria.slice(0, 6)
    : [];
  return {
    slug: task.slug ?? task.id,
    title: task.title ?? "",
    acceptanceCriteria,
  };
}

function createDataStore() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (url && key) {
    const client = createClient(url, key, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
    return { kind: "supabase", client };
  }

  const dbUrl = process.env.SUPABASE_DB_URL;
  if (dbUrl) {
    process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
    const pool = new Pool({ connectionString: dbUrl, ssl: { rejectUnauthorized: false } });
    return { kind: "pg", pool };
  }

  throw new Error("Missing Supabase credentials. Set SUPABASE_SERVICE_ROLE_KEY or SUPABASE_DB_URL.");
}

async function fetchTasks(store, initials, limit) {
  if (store.kind === "supabase") {
    const { data, error } = await store.client
      .from("tasks")
      .select("id, slug, title, description, input_payload")
      .eq("owner_initials", initials)
      .limit(limit * 3);
    if (error) {
      throw new Error(`Failed to load tasks: ${error.message}`);
    }
    return (data ?? []).filter((task) => {
      const payload = parsePayload(task.input_payload);
      task.input_payload = payload;
      return !payload || !payload.splitter_summary;
    }).slice(0, limit);
  }

  const { rows } = await store.pool.query(
    `select id, slug, title, description, input_payload
     from tasks
     where owner_initials = $1
     order by updated_at asc
     limit $2`,
    [initials, limit * 3]
  );
  const filtered = rows.filter((task) => {
    const payload = parsePayload(task.input_payload);
    task.input_payload = payload;
    return !payload || !payload.splitter_summary;
  });
  return filtered.slice(0, limit);
}

async function generateSpec(task) {
  const context = buildLeanContext(task);
  const instructions = `You are Splitter drafting specs for automation tasks.
Given only the task slug, title, and any acceptance criteria, produce JSON with:
- summary (2 sentences)
- definition_of_done
- acceptance_criteria (array)
- handoff_actions (array)
- spec_markdown (markdown doc)
Do NOT request more context; work with what you have.`;
  const userContent = JSON.stringify(context, null, 2);
  const cached = await fetchJsonWithCache({ instructions, userContent });
  return JSON.parse(cached);
}

async function writeSpec(store, task, spec) {
  const now = new Date().toISOString();
  const existing = task.input_payload && typeof task.input_payload === "object" ? { ...task.input_payload } : {};
  const payload = {
    ...existing,
    splitter_summary: spec.summary,
    splitter_definition_of_done: spec.definition_of_done,
    splitter_acceptance_criteria: spec.acceptance_criteria,
    splitter_handoff_actions: spec.handoff_actions,
    splitter_spec: spec.spec_markdown,
    splitter_last_run_at: now,
  };

  if (store.kind === "supabase") {
    const { error } = await store.client
      .from("tasks")
      .update({ input_payload: payload, updated_at: now })
      .eq("id", task.id);
    if (error) {
      throw new Error(`Failed to update task ${task.id}: ${error.message}`);
    }
  } else {
    await store.pool.query(
      `update tasks set input_payload = $2::jsonb, updated_at = $3 where id = $1`,
      [task.id, JSON.stringify(payload), now]
    );
  }
}

async function closeStore(store) {
  if (store.kind === "pg" && store.pool) {
    await store.pool.end();
  }
}

async function main() {
  const { lane, limit } = parseArgs();
  if (!lanes[lane]) {
    throw new Error(`Unsupported lane ${lane}. Use one of: ${Object.keys(lanes).join(", ")}`);
  }

  const store = createDataStore();
  try {
    const tasks = await fetchTasks(store, lanes[lane].initials, limit);
    if (!tasks.length) {
      console.log(`No ${lane} tasks need specs.`);
      return;
    }

    for (const task of tasks) {
      const spec = await generateSpec(task);
      await writeSpec(store, task, spec);
      console.log(
        `[spec] ${task.slug} (${task.id}) -> splitter_summary, splitter_definition_of_done, splitter_acceptance_criteria, splitter_handoff_actions, splitter_spec`
      );
    }
  } finally {
    await closeStore(store);
  }
}

main().catch((err) => {
  console.error(err.message ?? err);
  process.exit(1);
});
