#!/usr/bin/env node
import { spawnSync } from "child_process";
import { config } from "dotenv";
import pkg from "pg";

const { Pool } = pkg;
config({ path: ".env.local" });

const argv = process.argv.slice(2);
const TARGET_AGENT = (() => {
  const idx = argv.indexOf("--agent");
  if (idx !== -1 && argv[idx + 1]) return argv[idx + 1];
  return process.env.BUILDER_AGENT_NAME || "Steve";
})();
const OWNER_INITIALS = (() => {
  const idx = argv.indexOf("--initials");
  if (idx !== -1 && argv[idx + 1]) return argv[idx + 1];
  return process.env.BUILDER_OWNER_INITIALS || "St";
})();
const SESSION_LIMIT = (() => {
  const idx = argv.indexOf("--limit");
  if (idx !== -1 && argv[idx + 1]) return Number(argv[idx + 1]) || 1;
  return Number(process.env.BUILDER_SESSION_LIMIT || 1) || 1;
})();
const TARGET_SLUG = (() => {
  const idx = argv.indexOf("--slug");
  if (idx !== -1 && argv[idx + 1]) return argv[idx + 1];
  return process.env.BUILDER_TARGET_SLUG || null;
})();

if (!process.env.SUPABASE_DB_URL) {
  throw new Error("SUPABASE_DB_URL is required for builder session runner");
}

const pool = new Pool({
  connectionString: process.env.SUPABASE_DB_URL,
  ssl: { rejectUnauthorized: false },
});

async function fetchPendingSessions(limit) {
  if (TARGET_SLUG) {
    const { rows } = await pool.query(
      `select id, task_id, task_slug
         from agent_work_sessions
        where agent_name = $1
          and status = 'started'
          and runner_status = 'pending'
          and task_slug = $2
        limit 1`,
      [TARGET_AGENT, TARGET_SLUG]
    );
    return rows;
  }
  const { rows } = await pool.query(
    `select id, task_id, task_slug
       from agent_work_sessions
      where agent_name = $1
        and status = 'started'
        and runner_status = 'pending'
      order by triggered_at asc
      limit $2`,
    [TARGET_AGENT, limit]
  );
  return rows;
}

async function markSessionStatus(id, updates) {
  const sets = [];
  const params = [];
  let idx = 1;
  for (const [key, value] of Object.entries(updates)) {
    if (key === "runner_notes") {
      sets.push(`runner_notes = coalesce(runner_notes, '{}'::jsonb) || $${idx}::jsonb`);
      params.push(JSON.stringify(value));
    } else {
      sets.push(`${key} = $${idx}`);
      params.push(value);
    }
    idx += 1;
  }
  sets.push(`updated_at = now()`);
  await pool.query(`update agent_work_sessions set ${sets.join(", ")} where id = $${idx}`, [...params, id]);
}

function runBuilderHarness(slug) {
  const env = {
    ...process.env,
    BUILDER_PRIORITY_SLUGS: slug,
    BUILDER_FORCE_SLUG: slug,
    BUILDER_OWNER_INITIALS: OWNER_INITIALS,
  };
  const result = spawnSync("node", ["scripts/builder-harness.mjs"], {
    cwd: process.cwd(),
    env,
    encoding: "utf-8",
  });
  if (result.status !== 0) {
    throw new Error(result.stderr || "builder harness failed");
  }
  return result.stdout;
}

function parseHarnessOutput(output) {
  const branchMatch = output.match(/branch ([^\s]+)/);
  const prMatch = output.match(/https:\/\/github.com\/[^\s]+\/pull\/\d+/);
  const commitMatch = output.match(/Commit\s+([0-9a-f]{8,})/i);
  return {
    branch: branchMatch ? branchMatch[1] : null,
    prUrl: prMatch ? prMatch[0] : null,
    commit: commitMatch ? commitMatch[1] : null,
  };
}

async function markTaskComplete(taskId) {
  await pool.query(
    `update tasks
        set column_id = 'done', status = 'completed', owner_initials = null, updated_at = now()
      where id = $1`,
    [taskId]
  );
}

async function main() {
  const sessions = await fetchPendingSessions(SESSION_LIMIT);
  if (!sessions.length) {
    console.log("No pending builder sessions for", TARGET_AGENT);
    await pool.end();
    return;
  }

  for (const session of sessions) {
    try {
      await markSessionStatus(session.id, {
        runner_status: "running",
        runner_notes: { last_run_started_at: new Date().toISOString() },
      });
      const output = runBuilderHarness(session.task_slug);
      const { branch, prUrl, commit } = parseHarnessOutput(output);
      await markTaskComplete(session.task_id);
      await markSessionStatus(session.id, {
        status: "completed",
        completed_at: new Date().toISOString(),
        runner_status: "completed",
        runner_notes: { branch, pr_url: prUrl, commit },
      });
      console.log(`Builder session ${session.id} completed (${session.task_slug}).`);
    } catch (err) {
      console.error(`Builder session ${session.id} failed:`, err.message ?? err);
      await markSessionStatus(session.id, {
        runner_status: "error",
        runner_notes: { error_message: err.message ?? String(err) },
      });
    }
  }
  await pool.end();
}

main().catch(async (err) => {
  console.error("Builder session runner crashed:", err);
  await pool.end();
  process.exit(1);
});
