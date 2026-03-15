#!/usr/bin/env node
import { createClient } from "@supabase/supabase-js";
import { Pool } from "pg";
import { logActivity } from "../shared/log-activity.js";
import { fetchJsonWithCache } from "./lib/llm.js";

const DEFAULT_AGENT = process.env.AGENT_RUNNER_AGENT || "Splitter";
const DEFAULT_LIMIT = Number(process.env.AGENT_RUNNER_LIMIT || 2) || 2;
const DEFAULT_MODEL =
  process.env.AGENT_RUNNER_MODEL ||
  (process.env.DEEPSEEK_API_KEY ? process.env.DEEPSEEK_MODEL || "deepseek-chat" : "gpt-4.1-mini");

const AGENT_PROFILES = {
  Splitter: {
    promptBuilder: buildSplitterPrompt,
    defaultModel: process.env.SPLITTER_MODEL || DEFAULT_MODEL,
    runnerActor: "SplitterRunner",
    summaryPrefix: "Splitter produced spec",
  },
  Sweeper: {
    promptBuilder: buildSweeperPrompt,
    defaultModel: process.env.SWEEPER_MODEL || process.env.DEEPSEEK_MODEL || DEFAULT_MODEL,
    runnerActor: "SweeperRunner",
    summaryPrefix: "Sweeper polished spec",
  },
};

const TITLE_LIMIT = Number(process.env.AGENT_CONTEXT_FIELD_LIMIT || 200);
const ACCEPTANCE_LIMIT = Number(process.env.AGENT_CONTEXT_ARRAY_LIMIT || 8);

function truncateText(value, limit = TITLE_LIMIT) {
  if (typeof value !== "string") return value;
  if (value.length <= limit) return value;
  return `${value.slice(0, limit)}… [truncated from ${value.length} chars]`;
}

function buildMinimalTaskContext(task) {
  const payload = task.input_payload && typeof task.input_payload === "object" ? task.input_payload : null;
  const acceptanceSource = payload?.splitter_acceptance_criteria || payload?.acceptance_criteria || [];
  const acceptanceCriteria = Array.isArray(acceptanceSource)
    ? acceptanceSource.slice(0, ACCEPTANCE_LIMIT).map((item) => truncateText(item, 160))
    : [];
  return {
    slug: task.slug ?? task.id,
    title: truncateText(task.title || "", TITLE_LIMIT),
    acceptanceCriteria,
  };
}


function parseArgs(argv) {
  const args = { agent: DEFAULT_AGENT, limit: DEFAULT_LIMIT, dryRun: false };
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    switch (arg) {
      case "--agent":
        args.agent = argv[++i] || args.agent;
        break;
      case "--limit":
        args.limit = Number(argv[++i]) || args.limit;
        break;
      case "--dry-run":
        args.dryRun = true;
        break;
      case "--model":
        args.model = argv[++i] || DEFAULT_MODEL;
        break;
      default:
        break;
    }
  }
  args.model = args.model || DEFAULT_MODEL;
  return args;
}

function buildDataClient() {
  const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (supabaseUrl && serviceRoleKey) {
    const client = createClient(supabaseUrl, serviceRoleKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
    return { kind: "supabase", client };
  }

  const dbUrl = process.env.SUPABASE_DB_URL;
  if (dbUrl) {
    process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
    const parsed = new URL(dbUrl);
    const pool = new Pool({
      user: decodeURIComponent(parsed.username),
      password: decodeURIComponent(parsed.password),
      host: parsed.hostname,
      port: parsed.port || 5432,
      database: parsed.pathname.replace(/^\//, ""),
      ssl: { rejectUnauthorized: false },
    });
    return { kind: "pg", pool };
  }

  throw new Error(
    "Missing Supabase credentials. Set SUPABASE_SERVICE_ROLE_KEY or SUPABASE_DB_URL."
  );
}

async function closeDataClient(store) {
  if (store.kind === "pg" && store.pool) {
    await store.pool.end();
  }
}

async function fetchPendingSessions(store, agent, limit) {
  if (store.kind === "supabase") {
    const { data, error } = await store.client
      .from("agent_work_sessions")
      .select("id, task_id, task_slug, task_title, agent_name, metadata, status, runner_status, triggered_at, started_at")
      .eq("agent_name", agent)
      .eq("status", "started")
      .eq("runner_status", "pending")
      .order("triggered_at", { ascending: true })
      .limit(limit);

    if (error) {
      throw new Error(`Failed to load pending work sessions: ${error.message}`);
    }
    return data ?? [];
  }

  const { rows } = await store.pool.query(
    `select id, task_id, task_slug, task_title, agent_name, metadata, status, runner_status, triggered_at, started_at
     from agent_work_sessions
     where agent_name = $1 and status = 'started' and runner_status = 'pending'
     order by triggered_at asc
     limit $2`,
    [agent, limit]
  );
  return rows;
}

async function lockSession(store, sessionId) {
  const now = new Date().toISOString();
  if (store.kind === "supabase") {
    const { data, error } = await store.client
      .from("agent_work_sessions")
      .update({ runner_status: "running", runner_notes: { last_run_started_at: now } })
      .eq("id", sessionId)
      .eq("runner_status", "pending")
      .select()
      .single();

    if (error && error.code !== "PGRST116") {
      throw new Error(`Failed to lock session ${sessionId}: ${error.message}`);
    }
    return data ?? null;
  }

  const { rows } = await store.pool.query(
    `update agent_work_sessions
     set runner_status = 'running',
         runner_notes = coalesce(runner_notes, '{}'::jsonb) || jsonb_build_object('last_run_started_at', $2::timestamptz)
     where id = $1 and runner_status = 'pending'
     returning *`,
    [sessionId, now]
  );
  return rows[0] ?? null;
}

async function fetchTask(store, taskId) {
  if (store.kind === "supabase") {
    const { data, error } = await store.client
      .from("tasks")
      .select(
        "id, slug, title, description, definition_of_done, input_payload, column_id, owner_initials"
      )
      .eq("id", taskId)
      .single();

    if (error) {
      throw new Error(`Failed to load task ${taskId}: ${error.message}`);
    }
    return data;
  }

  const { rows } = await store.pool.query(
    `select id, slug, title, description, definition_of_done, input_payload, column_id, owner_initials
     from tasks
     where id = $1`,
    [taskId]
  );
  if (!rows.length) {
    throw new Error(`Task ${taskId} not found`);
  }
  return rows[0];
}

function buildSplitterPrompt(task) {
  const context = buildMinimalTaskContext(task);
  const formattedContext = JSON.stringify(context, null, 2);

  const instructions = `You are Splitter, a systems designer who translates Nate's backlog items into actionable specs for builders.
You will only receive the task slug, title, and any acceptance criteria captured so far. Do not ask for additional context—fill in reasonable defaults and call out unknowns explicitly.
Return a STRICT JSON object with this schema:
{
  "summary": string,
  "definition_of_done": string,
  "acceptance_criteria": string[],
  "handoff_actions": string[],
  "spec_markdown": string
}`;

  const userContent = `Task context:\n${formattedContext}`;
  return { instructions, userContent };
}

function buildSweeperPrompt(task) {
  const context = buildMinimalTaskContext(task);
  const formattedContext = JSON.stringify(context, null, 2);
  const instructions = `You are Sweeper, the Mission Control cleanup editor.
Only slug, title, and the current acceptance criteria are provided. Tighten the SAME JSON schema as Splitter (summary, definition_of_done, acceptance_criteria, handoff_actions, spec_markdown).
Rules:
- Do NOT invent new modules, APIs, or scope.
- Highlight unknowns explicitly if data is missing.
- Keep acceptance criteria boolean and testable.
- Spec markdown should stay concise and builder-ready.`;
  const userContent = `Existing Splitter output (trimmed to slug/title/acceptance criteria):\n${formattedContext}`;
  return { instructions, userContent };
}

async function generateSpec({ task, model, promptBuilder, dryRun }) {
  if (dryRun) {
    return {
      summary: `[dry-run] Spec for ${task.title}`,
      definition_of_done: "Dry run did not call model.",
      acceptance_criteria: [],
      handoff_actions: [],
      spec_markdown: `# ${task.title}\n\n_Dry run placeholder spec._`,
      raw: null,
    };
  }

  const builder = promptBuilder || buildSplitterPrompt;
  const { instructions, userContent } = builder(task);
  const responseContent = await fetchJsonWithCache({ instructions, userContent, model });

  let parsed;
  try {
    parsed = JSON.parse(responseContent);
  } catch (err) {
    throw new Error(`Failed to parse LLM JSON: ${err.message}`);
  }

  return { ...parsed, raw: responseContent };
}

async function persistSpec({ dataClient, session, task, spec, model, agentProfile }) {
  const now = new Date().toISOString();
  const existingPayload =
    task.input_payload && typeof task.input_payload === "object" ? task.input_payload : {};
  const agentName = session.agent_name || "Splitter";
  const isSplitter = agentName.toLowerCase() === "splitter";
  const payloadPatch = isSplitter
    ? {
        splitter_spec: spec.spec_markdown,
        splitter_summary: spec.summary,
        splitter_handoff_actions: spec.handoff_actions ?? [],
        splitter_acceptance_criteria: spec.acceptance_criteria ?? [],
        splitter_last_run_at: now,
      }
    : {
        sweeper_spec: spec.spec_markdown,
        sweeper_summary: spec.summary,
        sweeper_handoff_actions: spec.handoff_actions ?? [],
        sweeper_acceptance_criteria: spec.acceptance_criteria ?? [],
        sweeper_last_run_at: now,
      };
  const updatedPayload = {
    ...existingPayload,
    ...payloadPatch,
  };

  const column_id = isSplitter && task.column_id === "backlog" ? "rev" : task.column_id;
  const owner_initials = isSplitter ? null : task.owner_initials;

  if (dataClient.kind === "supabase") {
    await dataClient.client
      .from("tasks")
      .update({
        definition_of_done: spec.definition_of_done || task.definition_of_done || null,
        input_payload: updatedPayload,
        column_id,
        owner_initials,
        updated_at: now,
      })
      .eq("id", task.id);

    const runnerNotes = {
      summary: spec.summary,
      model,
      agent: agentName,
      completed_at: now,
    };

    await dataClient.client
      .from("agent_work_sessions")
      .update({
        status: "completed",
        completed_at: now,
        runner_status: "completed",
        runner_notes: runnerNotes,
      })
      .eq("id", session.id);
  } else {
    const client = await dataClient.pool.connect();
    const runnerNotes = {
      summary: spec.summary,
      model,
      agent: agentName,
      completed_at: now,
    };

    try {
      await client.query("BEGIN");
      await client.query(
        `update tasks
         set definition_of_done = $1,
             input_payload = $2::jsonb,
             column_id = $3,
             owner_initials = $4,
             updated_at = $5
         where id = $6`,
        [
          spec.definition_of_done || task.definition_of_done || null,
          JSON.stringify(updatedPayload),
          column_id,
          owner_initials,
          now,
          task.id,
        ]
      );

      await client.query(
        `update agent_work_sessions
         set status = 'completed',
             completed_at = $2,
             runner_status = 'completed',
             runner_notes = coalesce(runner_notes, '{}'::jsonb) || $3::jsonb
         where id = $1`,
        [session.id, now, JSON.stringify(runnerNotes)]
      );

      await client.query("COMMIT");
    } catch (err) {
      await client.query("ROLLBACK");
      throw err;
    } finally {
      client.release();
    }
  }

  await logActivity({
    eventType: "agent_spec_generated",
    summary: `${(agentProfile?.summaryPrefix || `${agentName} completed spec`)} for ${task.slug ?? task.title}`,
    actor: agentProfile?.runnerActor || `${agentName}Runner`,
    source: "agent-runner",
    entityType: "task",
    entityId: task.id,
    metadata: {
      agent: agentName,
      session_id: session.id,
      model,
    },
  });
}

async function resetRunnerStatus(dataClient, sessionId) {
  if (dataClient.kind === "supabase") {
    await dataClient.client
      .from("agent_work_sessions")
      .update({ runner_status: "pending", runner_notes: {} })
      .eq("id", sessionId);
    return;
  }

  await dataClient.pool.query(
    `update agent_work_sessions
     set runner_status = 'pending', runner_notes = '{}'::jsonb
     where id = $1`,
    [sessionId]
  );
}

async function recordAgentHealth(store, payload) {
  const now = new Date().toISOString();
  const data = {
    agent_id: payload.agentId,
    agent_name: payload.agentName,
    lane: payload.lane,
    status: payload.status,
    last_run_at: now,
    last_duration_ms: payload.lastDurationMs ?? null,
    next_run_eta: payload.nextRunEta ?? null,
    error_context: payload.errorContext ?? null,
    metadata: payload.metadata ?? {},
    updated_at: now,
  };

  if (store.kind === "supabase") {
    await store.client.from("agent_health_status").upsert(data, { onConflict: "agent_id" });
    return;
  }

  await store.pool.query(
    `insert into agent_health_status
       (agent_id, agent_name, lane, status, last_run_at, last_duration_ms, next_run_eta, error_context, metadata, updated_at)
     values ($1,$2,$3,$4,$5,$6,$7,$8,$9::jsonb,$10)
     on conflict (agent_id) do update set
       agent_name = excluded.agent_name,
       lane = excluded.lane,
       status = excluded.status,
       last_run_at = excluded.last_run_at,
       last_duration_ms = excluded.last_duration_ms,
       next_run_eta = excluded.next_run_eta,
       error_context = excluded.error_context,
       metadata = excluded.metadata,
       updated_at = excluded.updated_at`,
    [
      data.agent_id,
      data.agent_name,
      data.lane,
      data.status,
      data.last_run_at,
      data.last_duration_ms,
      data.next_run_eta,
      data.error_context,
      JSON.stringify(data.metadata ?? {}),
      data.updated_at,
    ]
  );
}

async function markSessionError(dataClient, sessionId, message) {
  const now = new Date().toISOString();
  if (dataClient.kind === "supabase") {
    await dataClient.client
      .from("agent_work_sessions")
      .update({ runner_status: "error", runner_notes: { error_message: message, failed_at: now } })
      .eq("id", sessionId);
    return;
  }

  await dataClient.pool.query(
    `update agent_work_sessions
     set runner_status = 'error',
         runner_notes = coalesce(runner_notes, '{}'::jsonb) || jsonb_build_object('error_message', $2::text, 'failed_at', $3::timestamptz)
     where id = $1`,
    [sessionId, message, now]
  );
}

async function run() {
  const args = parseArgs(process.argv.slice(2));
  const agentProfile = AGENT_PROFILES[args.agent] || AGENT_PROFILES.Splitter;
  if (!agentProfile) {
    throw new Error(`No agent profile configured for ${args.agent}`);
  }
  if (!args.model) {
    args.model = agentProfile.defaultModel;
  }
  const dataClient = buildDataClient();
  const startTime = Date.now();
  const agentId = `runner:${args.agent.toLowerCase()}`;
  const basePayload = { agentId, agentName: agentProfile.runnerActor || `${args.agent} Runner`, lane: args.agent };
  let completedCount = 0;
  let errorCount = 0;
  try {
    const sessions = await fetchPendingSessions(dataClient, args.agent, args.limit);

    if (sessions.length === 0) {
      console.log("No pending sessions for", args.agent);
      await recordAgentHealth(dataClient, {
        ...basePayload,
        status: "dry_run",
        lastDurationMs: Date.now() - startTime,
        nextRunEta: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
        metadata: { assigned: 0, skipped: 0, approvals_blocked: 0, dry_run: true },
      });
      return;
    }

    for (const session of sessions) {
      try {
        const locked = await lockSession(dataClient, session.id);
        if (!locked) {
          console.log(`Skipped ${session.id} (already running)`);
          continue;
        }
        const task = await fetchTask(dataClient, session.task_id);
        const spec = await generateSpec({
          task,
          model: args.model,
          promptBuilder: agentProfile.promptBuilder,
          dryRun: args.dryRun,
        });
        if (args.dryRun) {
          console.log(`[dry-run] Would persist spec for ${task.slug ?? task.title}`);
          await resetRunnerStatus(dataClient, session.id);
          continue;
        }
        await persistSpec({
          dataClient,
          session: locked,
          task,
          spec,
          model: args.model,
          agentProfile,
        });
        completedCount += 1;
        console.log(`Completed spec for ${task.slug ?? task.title}`);
      } catch (err) {
        errorCount += 1;
        console.error(`Runner failed for session ${session.id}:`, err.message ?? err);
        await markSessionError(dataClient, session.id, err.message ?? String(err));
      }
    }

    const status = errorCount === 0 ? "ok" : completedCount > 0 ? "warning" : "error";
    const duration = Date.now() - startTime;
    await recordAgentHealth(dataClient, {
      ...basePayload,
      status,
      lastDurationMs: duration,
      nextRunEta: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
      errorContext: errorCount ? `${errorCount} failure(s)` : null,
      metadata: { assigned: completedCount, skipped: errorCount, approvals_blocked: 0, dry_run: args.dryRun },
    });
  } finally {
    await closeDataClient(dataClient);
  }
}

run().catch((err) => {
  console.error("Agent runner crashed:", err);
  process.exit(1);
});
