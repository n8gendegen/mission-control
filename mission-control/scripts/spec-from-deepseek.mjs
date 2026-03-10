#!/usr/bin/env node
import { Pool } from "pg";

const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY;
if (!DEEPSEEK_API_KEY) {
  console.error("Missing DEEPSEEK_API_KEY in environment");
  process.exit(1);
}

const DEFAULT_LIMIT = Number(process.env.AUTO_SPEC_LIMIT || 3) || 3;

const pool = new Pool({
  connectionString: process.env.SUPABASE_DB_URL,
  ssl: { rejectUnauthorized: false },
});

function buildPrompt({ title, description }) {
  return {
    model: "deepseek-chat",
    response_format: { type: "json_object" },
    messages: [
      {
        role: "system",
        content:
          "You are Splitter, a mission-control spec writer. Respond in JSON with keys summary, definition_of_done (array), acceptance_criteria (array), handoff_actions (array), spec_markdown.",
      },
      {
        role: "user",
        content: `Task: ${title}. Description: ${description || "No description provided."}`,
      },
    ],
  };
}

async function fetchSpec(task) {
  const response = await fetch("https://api.deepseek.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${DEEPSEEK_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(buildPrompt(task)),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Deepseek request failed (${response.status}): ${text}`);
  }

  const payload = await response.json();
  const content = payload?.choices?.[0]?.message?.content;
  if (!content) throw new Error("Deepseek response missing content");
  return JSON.parse(content);
}

async function updateTask(taskId, spec) {
  const patch = {
    splitter_summary: spec.summary,
    splitter_definition_of_done: spec.definition_of_done,
    splitter_acceptance_criteria: spec.acceptance_criteria,
    splitter_handoff_actions: spec.handoff_actions,
    splitter_spec: spec.spec_markdown,
  };
  await pool.query(
    `update tasks
       set input_payload = coalesce(input_payload::jsonb, '{}'::jsonb) || $2::jsonb,
           updated_at = now()
     where id = $1`,
    [taskId, JSON.stringify(patch)]
  );
}

async function fetchPendingTasks(limit) {
  const { rows } = await pool.query(
    `select id, slug, title, description
       from tasks
      where column_id = 'backlog'
        and (input_payload->>'splitter_spec') is null
      order by created_at asc
      limit $1`,
    [limit]
  );
  return rows;
}

async function main() {
  const limit = Number(process.argv[2]) || DEFAULT_LIMIT;
  const tasks = await fetchPendingTasks(limit);
  if (tasks.length === 0) {
    console.log("No spec-less backlog tasks found. Exiting.");
    return;
  }

  for (const task of tasks) {
    try {
      console.log(`[spec] Generating spec for ${task.slug}`);
      const spec = await fetchSpec(task);
      await updateTask(task.id, spec);
      console.log(`[spec] Stored Deepseek spec for ${task.slug}`);
    } catch (error) {
      console.error(`[spec] Failed for ${task.slug}:`, error.message || error);
    }
  }
}

main()
  .catch((error) => {
    console.error("Spec automation crashed:", error.message || error);
    process.exit(1);
  })
  .finally(async () => {
    await pool.end();
  });
