#!/usr/bin/env node
import fs from "fs";
import path from "path";

const REQUIRED = ["SUPABASE_URL", "SUPABASE_SERVICE_ROLE_KEY"];
const missing = REQUIRED.filter((key) => !process.env[key]);
if (missing.length) {
  console.error(`Missing env vars: ${missing.join(", ")}`);
  process.exit(1);
}

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const LOG_PATH = process.env.HEARTBEAT_LOG_PATH || path.join(process.env.HOME, ".openclaw", "workspace", "logs", "heartbeat-monitor.log");

const TASKS_ENDPOINT = `${SUPABASE_URL}/rest/v1/tasks` +
  `?select=id,slug,owner_initials,updated_at,column_id,title&column_id=eq.in_progress` +
  `&order=updated_at.desc`;

function appendLog(line) {
  const dir = path.dirname(LOG_PATH);
  fs.mkdirSync(dir, { recursive: true });
  fs.appendFileSync(LOG_PATH, `${line}\n`);
}

const IDLE_THRESHOLD_MINUTES = Number(process.env.HEARTBEAT_IDLE_THRESHOLD || 60);

function minutesSince(dateStr) {
  const updated = new Date(dateStr).getTime();
  return (Date.now() - updated) / (1000 * 60);
}

function summarize(tasks) {
  const owners = {};
  for (const task of tasks) {
    const owner = task.owner_initials || "(unassigned)";
    if (!owners[owner]) owners[owner] = [];
    owners[owner].push(task);
  }
  return owners;
}

async function recordAlerts(entries) {
  if (!entries.length) return;
  const rows = entries.map((entry) => ({
    agent_name: entry.owner,
    task_id: entry.task?.id ?? null,
    task_slug: entry.task?.slug ?? null,
    idle_minutes: entry.minutes,
    metadata: { column: entry.task?.column_id, title: entry.task?.title },
    last_seen_at: new Date().toISOString(),
    status: "open",
  }));

  const res = await fetch(`${SUPABASE_URL}/rest/v1/agent_alerts`, {
    method: "POST",
    headers: {
      apikey: SUPABASE_SERVICE_ROLE_KEY,
      Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
      "Content-Type": "application/json",
      Prefer: "return=representation"
    },
    body: JSON.stringify(rows),
  });
  if (!res.ok) {
    console.error("Failed to record alerts", await res.text());
  }
}

async function fetchTasks() {
  const res = await fetch(TASKS_ENDPOINT, {
    headers: {
      apikey: SUPABASE_SERVICE_ROLE_KEY,
      Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
    },
  });
  if (!res.ok) {
    throw new Error(`Supabase fetch failed: ${res.status}`);
  }
  return res.json();
}

async function main() {
  const tasks = await fetchTasks();
  const owners = summarize(tasks);
  const idle = [];
  for (const [owner, list] of Object.entries(owners)) {
    const oldest = list.reduce((max, task) => Math.max(max, minutesSince(task.updated_at)), 0);
    if (oldest >= IDLE_THRESHOLD_MINUTES) {
      idle.push({ owner, minutes: Math.round(oldest), task: list[0] });
    }
  }
  const timestamp = new Date().toISOString();
  const summary = {
    timestamp,
    total_tasks: tasks.length,
    owners: Object.keys(owners).length,
    idle,
  };
  appendLog(JSON.stringify(summary));
  await recordAlerts(idle);
}


main().catch((err) => {
  appendLog(`[${new Date().toISOString()}] ERROR: ${err.message}`);
  process.exit(1);
});
